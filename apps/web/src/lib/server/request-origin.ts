/**
 * Resolve the *public* origin (scheme + host) of an incoming request.
 *
 * Behind Railway's proxy (and most production reverse proxies) `request.url`
 * resolves to the internal `http://localhost:8080/...` URL, not the public
 * `https://cesafiu.ro/...` URL the browser actually hit. Constructing redirect
 * targets with `new URL(path, request.url)` therefore produces redirects to
 * the internal hostname — which is what the visitor's browser then follows,
 * landing on `localhost:8080` and failing.
 *
 * The right source of truth for the public origin in a proxied setup is the
 * `x-forwarded-host` / `x-forwarded-proto` header pair, which the proxy sets
 * to the original public-facing values. This helper reads them with sensible
 * fallbacks so dev (`localhost:3000`) keeps working when the headers are
 * absent.
 *
 * Used by Phase D1.1 short redirects (`/r/[code]`, `/quiz`).
 */

import type {NextRequest} from 'next/server';

export function publicOriginFromRequest(request: NextRequest): string {
  const proto =
    (request.headers.get('x-forwarded-proto') ?? '').split(',')[0]?.trim() || 'https';
  const forwardedHost =
    (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(',')[0]?.trim() || '';

  if (forwardedHost) {
    // Strip any explicit port for the public hosts — Railway proxies HTTPS on
    // 443 but the internal server hears the connection on 8080.
    const cleanedHost =
      forwardedHost === 'cesafiu.ro' || forwardedHost === 'www.cesafiu.ro'
        ? forwardedHost
        : forwardedHost.replace(/:8080$/, '');
    return `${proto}://${cleanedHost}`;
  }

  // Last-resort fallback: the request's own origin. This is correct in local
  // dev where the headers above aren't set.
  try {
    return new URL(request.url).origin;
  } catch {
    return 'https://cesafiu.ro';
  }
}
