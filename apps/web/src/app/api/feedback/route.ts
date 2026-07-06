/**
 * POST /api/feedback
 *
 * Receives a single feedback submission from the in-app widget.
 * Defenses (in order — fail fast on cheap checks):
 *
 *   1. Same-origin guard (drops cross-site POSTs)
 *   2. JSON parse + Zod schema (drops malformed inputs)
 *   3. Honeypot check (drops naive bots)
 *   4. Rate limit per-IP (and per-user when logged in)
 *   5. Cloudflare Turnstile verification
 *   6. Auth resolution (user_id is required-when-logged-in by design)
 *   7. PII redaction + spam-shape scoring on the message
 *   8. Insert into feedback_submissions (service role)
 *   9. Audit event
 *
 * The route always returns 204 on the "drop quietly" branches (honeypot,
 * spam-score > hard threshold) so attackers can't tell whether their
 * submission stuck. Real users see 204 on success; informational error
 * codes are returned only for fixable client-side problems (rate limit,
 * Turnstile failure) so the UI can show a helpful message.
 */

import {AUDIT_EVENT_TYPES, logAuditEvent} from '@/lib/security/audit';
import {checkSameOrigin} from '@/lib/security/origin-guard';
import {redactPii, scoreSpamShape} from '@/lib/security/pii';
import {RATE_LIMIT_PROFILES, checkRateLimit} from '@/lib/security/rate-limit';
import {getHashedRequestMeta} from '@/lib/security/request-meta';
import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {verifyTurnstile} from '@/lib/security/turnstile';
import {createHmac} from 'node:crypto';
import {NextResponse} from 'next/server';
import {z} from 'zod';

export const runtime = 'nodejs';

const HARD_SPAM_THRESHOLD = 1.5;

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.enum(['bug', 'confused', 'suggestion', 'praise']).nullable().optional(),
  message: z.string().max(500).nullable().optional(),
  pagePath: z.string().max(512).nullable().optional(),
  pageUrl: z.string().max(2048).nullable().optional(),
  locale: z.string().max(8).nullable().optional(),
  appVersion: z.string().max(64).nullable().optional(),
  /** Honeypot: must be empty/missing. */
  website: z.string().max(0).optional(),
  /** Cloudflare Turnstile token. Empty string is fine in soft mode. */
  turnstileToken: z.string().max(4096).optional(),
  /** Anonymous session token from the widget cookie. Hashed before storage. */
  anonSessionToken: z.string().max(128).optional(),
  /** Optional context — e.g. {quizSessionId, variant}. Capped server-side. */
  context: z.record(z.string(), z.unknown()).optional()
});

function noContent() {
  return new NextResponse(null, {status: 204});
}

export async function POST(request: Request) {
  // 1. Origin guard
  const origin = checkSameOrigin(request);
  if (!origin.ok) {
    return NextResponse.json({error: 'forbidden_origin'}, {status: 403});
  }

  // 2. Parse + validate
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({error: 'invalid_request'}, {status: 400});
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({error: 'invalid_request'}, {status: 400});
  }
  const body = parsed.data;
  const pageUrl = normalizeFeedbackPageUrl(body.pageUrl, request);
  const pagePath = normalizeFeedbackPagePath(body.pagePath, pageUrl);

  // 3. Honeypot — drop silently with success status to avoid signalling
  //    bots that their attempt failed.
  if (body.website && body.website.length > 0) {
    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.feedbackRejectedHoneypot,
      payload: {pagePath}
    });
    return noContent();
  }

  // 4. Rate limit (need request meta for keying)
  const meta = getHashedRequestMeta(request);
  if (!meta) {
    // CONSENT_HASH_PEPPER missing — refuse rather than insert with raw IP.
    return NextResponse.json({error: 'not_configured'}, {status: 500});
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({error: 'not_configured'}, {status: 500});
  }

  // Resolve auth before rate limit so we can apply per-user buckets too.
  // Auth header is optional for feedback (we accept anonymous), but when
  // present we treat the user as the principal — "always-linked-when-logged-in"
  // is part of the product spec.
  let userId: string | null = null;
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (accessToken) {
    const {data: userData} = await supabase.auth.getUser(accessToken);
    if (userData?.user) {
      userId = userData.user.id;
    }
    // If the token is invalid we silently fall back to anonymous — we don't
    // want a stale/expired token to block legitimate feedback.
  }

  const rl = await checkRateLimit({
    profile: RATE_LIMIT_PROFILES.feedback,
    ipHash: meta.ipHash,
    userId
  });
  if (!rl.ok) {
    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.feedbackRejectedRateLimit,
      userId,
      ipAddressHash: meta.ipHash,
      userAgentHash: meta.userAgentHash,
      payload: {blockedBy: rl.blockedBy, retryAfter: rl.retryAfterSeconds}
    });
    return NextResponse.json(
      {error: 'rate_limited', retryAfterSeconds: rl.retryAfterSeconds},
      {status: 429, headers: {'retry-after': String(Math.max(1, rl.retryAfterSeconds))}}
    );
  }

  // 5. Turnstile
  const turnstile = await verifyTurnstile({
    token: body.turnstileToken,
    remoteIp: meta.ip,
    expectedAction: 'feedback'
  });
  if (!turnstile.ok) {
    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.feedbackRejectedTurnstile,
      userId,
      ipAddressHash: meta.ipHash,
      userAgentHash: meta.userAgentHash,
      payload: {error: turnstile.error}
    });
    return NextResponse.json({error: 'verification_failed'}, {status: 400});
  }

  // 6. Redact PII + score spam shape
  let redactedMessage: string | null = null;
  let spamScore = 0;
  let piiHits: string[] = [];
  if (body.message && body.message.trim().length > 0) {
    const redaction = redactPii(body.message);
    redactedMessage = redaction.text.trim().slice(0, 500);
    spamScore = scoreSpamShape(redactedMessage, redaction.spamScore);
    piiHits = redaction.hits;
  }

  // Drop very-spammy submissions silently.
  if (spamScore >= HARD_SPAM_THRESHOLD) {
    await logAuditEvent({
      eventType: AUDIT_EVENT_TYPES.feedbackRejectedValidation,
      userId,
      ipAddressHash: meta.ipHash,
      userAgentHash: meta.userAgentHash,
      payload: {reason: 'spam_score_over_threshold', score: spamScore, hits: piiHits}
    });
    return noContent();
  }

  // 7. Insert. Cap context size (defense-in-depth — schema already small).
  const cappedContext = clampContext({
    ...(body.context ?? {}),
    ...(pageUrl ? {pageUrl} : {})
  });

  // Hash anon session token if provided (don't store raw — it's a cookie
  // value that could be replayed).
  const anonSessionHash = body.anonSessionToken
    ? hashAnonSession(body.anonSessionToken, meta.ipHash)
    : null;

  const {data: inserted, error: insertError} = await supabase
    .from('feedback_submissions')
    .insert({
      user_id: userId,
      anon_session_hash: anonSessionHash,
      ip_address_hash: meta.ipHash,
      user_agent_hash: meta.userAgentHash,
      locale: body.locale ?? null,
      page_path: pagePath,
      rating: body.rating,
      category: body.category ?? null,
      message: redactedMessage,
      context: cappedContext,
      app_version: body.appVersion ?? null,
      spam_score: spamScore,
      pii_hits: piiHits,
      turnstile_status: turnstile.mode,
      status: spamScore >= 0.8 ? 'spam' : 'new'
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('feedback: insert_failed', {error: insertError.message});
    return NextResponse.json({error: 'insert_failed'}, {status: 500});
  }

  await logAuditEvent({
    eventType: AUDIT_EVENT_TYPES.feedbackSubmitted,
    userId,
    ipAddressHash: meta.ipHash,
    userAgentHash: meta.userAgentHash,
    payload: {
      feedbackId: inserted.id,
      rating: body.rating,
      hasMessage: redactedMessage !== null,
      pagePath,
      pageUrl,
      spamScore,
      piiHits
    }
  });

  return noContent();
}

function clampContext(input: Record<string, unknown>): Record<string, unknown> {
  // Allow only string/number/boolean leaves, max 16 keys. URLs get extra room.
  const out: Record<string, unknown> = {};
  let count = 0;
  for (const [key, value] of Object.entries(input)) {
    if (count >= 16) break;
    if (typeof key !== 'string' || key.length > 64) continue;
    if (typeof value === 'string') {
      out[key] = value.slice(0, key === 'pageUrl' ? 2048 : 256);
      count += 1;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
      count += 1;
    } else if (typeof value === 'boolean') {
      out[key] = value;
      count += 1;
    }
  }
  return out;
}

function parseHost(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

function getFeedbackAllowedHosts(request: Request): Set<string> {
  const allowed = new Set(['cesafiu.ro', 'www.cesafiu.ro']);
  for (const raw of [
    request.headers.get('host'),
    request.headers.get('x-forwarded-host')
  ]) {
    raw
      ?.split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
      .forEach((host) => allowed.add(host));
  }

  for (const raw of [request.headers.get('origin'), request.headers.get('referer')]) {
    const host = parseHost(raw);
    if (host) allowed.add(host);
  }

  return allowed;
}

function normalizeFeedbackPageUrl(value: string | null | undefined, request: Request): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!getFeedbackAllowedHosts(request).has(url.host.toLowerCase())) {
      return null;
    }
    return `${url.origin}${url.pathname}${url.search}${url.hash}`.slice(0, 2048);
  } catch {
    return null;
  }
}

function normalizeFeedbackPagePath(value: string | null | undefined, pageUrl: string | null): string | null {
  if (value && value.trim().length > 0) {
    return value.trim().slice(0, 512);
  }
  if (!pageUrl) return null;
  try {
    const url = new URL(pageUrl);
    return `${url.pathname}${url.search}${url.hash}`.slice(0, 512);
  } catch {
    return null;
  }
}

/**
 * Mix the anon session token with the IP hash + pepper so it's not a stable
 * cross-site fingerprint. Deterministic per-IP-per-token, which is what we
 * need for soft dedup of repeated submissions.
 */
function hashAnonSession(token: string, ipHash: string): string {
  const pepper = process.env.CONSENT_HASH_PEPPER ?? '';
  return createHmac('sha256', pepper)
    .update(`${ipHash}|${token}`)
    .digest('hex');
}

// Keep handlers explicit — Next will return 405 for the others by default.
export async function GET() {
  // Cheap reachability probe so we don't have to deploy + open the widget
  // just to confirm the route exists. Doesn't return any state.
  return new NextResponse(null, {status: 204});
}

// Reject anything else with a 405.
export async function PUT() {
  return NextResponse.json({error: 'method_not_allowed'}, {status: 405});
}
export async function DELETE() {
  return NextResponse.json({error: 'method_not_allowed'}, {status: 405});
}
