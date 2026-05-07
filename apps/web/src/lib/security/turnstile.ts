/**
 * Cloudflare Turnstile server-side verification.
 *
 * Turnstile is an invisible, privacy-preserving CAPTCHA. The browser script
 * mints a token (sometimes after a transparent challenge), the client sends
 * the token alongside the form, and we verify it with Cloudflare here.
 *
 * Configuration:
 *   NEXT_PUBLIC_TURNSTILE_SITE_KEY  (consumed by the browser)
 *   TURNSTILE_SECRET_KEY            (server-only)
 *
 * Behavior:
 *  - Both env vars set -> strict verification, ok requires Cloudflare to say so.
 *  - Either env var missing -> "soft mode": we accept the request but log a
 *    warning. This is intentional for local dev and for the brief window
 *    between deploying the code and the operator setting up Turnstile.
 *    In production the absence of the secret should be loud (deploy gate).
 *
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

export type TurnstileResult =
  | {ok: true; mode: 'verified' | 'soft_skip'}
  | {ok: false; mode: 'verified'; error: string};

type TurnstileResponse = {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
};

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify a Turnstile token. `remoteIp` is optional but recommended — Cloudflare
 * uses it for additional anti-replay heuristics.
 *
 * Token may be empty/missing — treat that as a hard fail in strict mode and
 * a logged warning in soft mode.
 */
export async function verifyTurnstile(args: {
  token: string | null | undefined;
  remoteIp?: string;
  expectedAction?: string;
}): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!secret || !siteKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('turnstile: TURNSTILE_SECRET_KEY / NEXT_PUBLIC_TURNSTILE_SITE_KEY missing — soft mode');
    }
    return {ok: true, mode: 'soft_skip'};
  }

  if (!args.token) {
    return {ok: false, mode: 'verified', error: 'missing_token'};
  }

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', args.token);
  if (args.remoteIp) {
    params.set('remoteip', args.remoteIp);
  }

  let response: Response;
  try {
    response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      body: params.toString(),
      // Don't let a slow Cloudflare hold up the whole request.
      signal: AbortSignal.timeout(5000)
    });
  } catch (err) {
    console.error('turnstile: verify_fetch_failed', err);
    return {ok: false, mode: 'verified', error: 'verify_unreachable'};
  }

  if (!response.ok) {
    return {ok: false, mode: 'verified', error: `verify_http_${response.status}`};
  }

  const data = (await response.json()) as TurnstileResponse;
  if (!data.success) {
    const code = data['error-codes']?.[0] ?? 'unknown';
    return {ok: false, mode: 'verified', error: code};
  }

  if (args.expectedAction && data.action && data.action !== args.expectedAction) {
    return {ok: false, mode: 'verified', error: `wrong_action:${data.action}`};
  }

  return {ok: true, mode: 'verified'};
}
