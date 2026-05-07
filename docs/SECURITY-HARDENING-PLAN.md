# Security hardening plan — extending the feedback baseline

**Status:** Plan only. Phase 0 (feedback widget + foundations) is shipped.
Phases A–D below are not implemented yet.

**Last updated:** 2026-05-07

## Context

The 2026-05-07 commit introduced a security baseline (`src/lib/security/*`)
plus the `/api/feedback` endpoint that uses every layer of it. Everything
else in the app is still at the original protection level — i.e. mostly
none.

This document plans how to extend that baseline to the rest of the app,
phased by impact-per-effort.

### What's already in place

`src/lib/security/`:

- `request-meta.ts` — `getRequestIp` + HMAC hashing (reuses `CONSENT_HASH_PEPPER`)
- `rate-limit.ts` — Upstash sliding-window with declarative `RATE_LIMIT_PROFILES`
- `origin-guard.ts` — same-origin / CSRF check for state-changing methods
- `turnstile.ts` — Cloudflare Turnstile server verify (soft mode when keys missing)
- `pii.ts` — redact email / RO phone / CNP / cards / URLs + spam shape scoring
- `audit.ts` — append-only writes into `audit_events`

`supabase/migrations/20260507100000_security_baseline.sql`:

- `audit_events` (RLS-locked, service-role-only)
- `feedback_submissions` (RLS-locked, service-role-only)

### Deployment context

- **Platform: Railway** (`railway.toml`, NIXPACKS).
- Railway has **no built-in WAF, no edge rate limiting, no bot management**.
  This makes app-level + Cloudflare-in-front much more important than on
  Vercel-style hosts.

## Endpoint inventory & risk

| Endpoint                             | Method | Auth     | Current protection         | Abuse risk                                                                           |
| ------------------------------------ | ------ | -------- | -------------------------- | ------------------------------------------------------------------------------------ |
| `/api/match`                         | POST   | Optional | None                       | CPU-heavy (cosine + MMR), scoring reverse-engineering, quiz pollution                |
| `/api/feedback`                      | POST   | Optional | **Full stack** (this baseline) | n/a                                                                              |
| `/api/referrals/click`               | POST   | Anon     | None                       | Click farms, anonymous spam                                                          |
| `/api/referrals/test-completed`      | POST   | Yes      | None                       | Event spam to manipulate referral counts                                             |
| `/api/referrals/onboarded`           | POST   | Yes      | None                       | Same                                                                                 |
| `/api/referrals/me`                  | GET    | Yes      | None                       | Read-only — risk small                                                               |
| `/api/consent/age-band`              | POST   | Yes      | None                       | **High** — repeatedly switching age band may bypass minor-consent gates              |
| `/api/consent/parent-request`        | POST   | Yes      | DB-based rate limit        | Phishing via parent email; protected, but DB-based limiting is slow                  |
| `/api/consent/parent-confirm`        | GET    | Token    | Hash + expiry              | Token brute force                                                                    |
| `/[locale]/auth/callback`            | GET    | OAuth    | Supabase                   | Standard OAuth flow                                                                  |

## Phasing

### Phase A — Standardize existing endpoints

**Effort:** ~3–4h implementation + ~2h tests.
**Goal:** every route handler runs through one pipeline:
origin guard → rate limit → (optional) Turnstile → (optional) auth → handler.

Introduce `withSecurity()` wrapper:

```ts
// before
export async function POST(request: Request) { /* logic */ }

// after
export const POST = withSecurity(
  {profile: RATE_LIMIT_PROFILES.match, requireOrigin: true},
  async (request, ctx) => { /* ctx: {ipHash, userAgentHash, userId, supabase} */ }
);
```

Add the following profiles to `RATE_LIMIT_PROFILES`:

| Profile                | Per-IP    | Per-user      | Notes                                                                |
| ---------------------- | --------- | ------------- | -------------------------------------------------------------------- |
| `match`                | 60/min    | 200/h         | exists; tighten if abuse seen                                        |
| `referralClick`        | 30/min    | —             | strict — anonymous endpoint                                          |
| `referralEvent`        | 20/min    | 100/day       | onboarded + test-completed                                           |
| `referralRead`         | 30/min    | 60/min        | GET /referrals/me                                                    |
| `consentAgeBand`       | 10/h      | **3/day**     | very strict — no legit reason to switch repeatedly                   |
| `consentParentConfirm` | 30/min    | —             | token endpoint — anti-brute-force                                    |
| `auth`                 | 10/h      | —             | for `/auth/callback`                                                 |

Per-endpoint refactor:

1. **`/api/match`** — wrap with `withSecurity({profile: match})`. Bonus: emit
   a *quiz session token* (HMAC) at quiz start and verify it in the body.
   Eliminates synthetic submits that don't go through the UI. ~50 lines code,
   2–3 client edits.
2. **`/api/referrals/*`** — wrap with the appropriate profile. Audit-log
   create events.
3. **`/api/consent/age-band`** — wrap + audit-log every change. This is the
   most worrying endpoint: changing `age_band` could let a user bypass the
   minor-consent gate for paid tests.
4. **`/api/consent/parent-request`** — migrate from DB-based rate limiting
   to Upstash, with the DB version as a fallback when Upstash is down.
   Saves 50–200ms per request and improves resilience.
5. **`/api/consent/parent-confirm`** — add IP rate limiting (anti token
   brute force). Don't change the lookup itself.
6. **`/[locale]/auth/callback`** — IP rate limit. Supabase does its own
   limiting upstream, but layered defense doesn't hurt.

**Test coverage:** one integration test per endpoint asserting that
invalid origin returns 403, exceeding the limit returns 429, invalid
payload returns 400. Mock Supabase via `vi.mock`.

### Phase B — Cloudflare in front of Railway

**Effort:** ~1h work + DNS propagation (≤24h).
**Goal:** maximum security uplift per hour invested, given Railway has no
edge protection.

Steps:

1. Add Cloudflare as DNS provider for `cesafiu.ro` (DNS only — domain
   stays where it is).
2. Set `cesafiu.ro` and `www.cesafiu.ro` to proxied (orange cloud).
3. CNAME to Railway's `*.up.railway.app` URL.
4. Enable on the free plan:
   - **Bot Fight Mode** — auto-blocks obvious bots (`python-requests` etc.)
   - Security Level: Medium
   - **WAF Managed Rules** — free tier covers SQL injection, XSS, common abuse
   - **Rate Limiting Rules** — 1 free rule on free plan; use it for an
     aggressive `/api/*` block, e.g. "100 req/IP/min to `/api/*`"
   - **Cache** the static-ish pages (`/[locale]`, `/cariera/*`, `/browse`)
     to reduce backend cost and hide endpoints from scrapers

After this lands:

- Real client IP arrives via `cf-connecting-ip` (already handled by
  `getRequestIp`)
- Free DDoS protection
- Free tier covers current traffic comfortably

Adjustments needed in code:

- Verify `origin-guard.ts` works behind Cloudflare. It already reads
  `x-forwarded-host`, but worth confirming on a preview deploy.
- Check Sentry / Umami still see the right hostname.

### Phase C — Payment endpoints (when €19 SKU goes live)

Pre-launch checklist:

- Stripe webhook signature verification (mandatory)
- Idempotency keys on checkout-session creation
- Force 3DS on new cards
- Stripe Radar enabled (default — verify)
- Webhook endpoint with Stripe IP allowlist + signature check (no
  Turnstile — it's not a UI surface)
- `/api/checkout/create-session`: 5/h/IP, 10/h/user
- Audit log every payment event (`audit_events` already exists)
- Disposable-email check before anonymous checkout

### Phase D — Monitoring & alerting

Run in parallel with Phase A.

- Sentry alert on >5% 4xx/5xx in any 5-min window
- Daily digest from `audit_events` grouped by `event_type` to Adi —
  early warning if abuse is climbing
- Weekly query for trend visibility:

  ```sql
  select count(*), event_type
  from audit_events
  where created_at > now() - interval '7 days'
  group by event_type;
  ```

- Sentry × Railway integration for crash visibility (probably already
  enabled — confirm)
- Umami custom event `security_block_*` so we can correlate blocks with
  other funnel data

## Recommended order

1. **Phase B (Cloudflare)** — 1h work, biggest immediate uplift. Do
   first, before any code.
2. **Phase A (wrapper refactor)** — one focused session, 3–4h. Once the
   `withSecurity()` wrapper exists, every endpoint is copy-paste.
3. **Phase D (alerting)** — alongside Phase A, low marginal cost.
4. **Phase C (payments)** — gated on the €19 SKU going live.

## Open questions

1. **Cloudflare account:** does Adi already have one? Comfortable moving
   `cesafiu.ro` DNS to Cloudflare? (Reversible at any time.)
2. **Quiz session signing on `/api/match`:** worth the extra client/server
   coupling, or rely on rate-limit alone? Recommendation: do it before
   public launch.
3. **`/api/consent/parent-request` migration:** keep DB-based fallback
   when Upstash is down, or migrate fully? Recommendation: fallback —
   resilient against Upstash outage on the most-sensitive endpoint.

## Out of scope (deliberately)

- Custom moderation pipeline for user-generated text — not needed because
  there are no public surfaces. Revisit only if/when comments/profiles
  ever become visible to other users.
- Cookie banner / consent overhaul — separate workstream tracked in
  `docs/CONSENT-BANNER-SPEC.md`.
- Penetration testing engagement — out of scope until Phase 1 is publicly
  launched and traffic is non-trivial.
