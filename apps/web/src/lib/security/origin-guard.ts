/**
 * Same-origin / CSRF guard.
 *
 * For state-changing methods (POST/PUT/PATCH/DELETE) on our own API routes
 * we require the request to come from one of our own origins. This is a
 * cheap defense against cross-site form submissions: it can't stop a
 * sufficiently motivated attacker but it filters drive-by abuse and is
 * standard hygiene.
 *
 * Browsers always send `Origin` on cross-origin POST and on same-origin
 * non-GET requests in modern engines. If `Origin` is absent we fall back
 * to `Referer`. If both are absent we reject — that pattern matches
 * scripted clients (curl, scrapers) which are exactly what we want to
 * gate, even though it's not a hard security boundary.
 *
 * For genuine non-browser clients (mobile app one day, server-to-server)
 * use a different auth path that bypasses this guard — don't loosen it.
 */

const STATEFUL_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export type OriginGuardConfig = {
  /** Extra hostnames to permit (e.g. preview deploy URLs). */
  extraAllowedHosts?: string[];
};

export type OriginGuardResult = {ok: true} | {ok: false; reason: string};

function parseHost(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Returns the set of hosts considered "us". Includes the request's own
 * Host (so the guard works on preview/local without configuration), the
 * canonical production domains, and any extras the caller passes.
 */
function getAllowedHosts(request: Request, extras?: string[]): Set<string> {
  const allowed = new Set<string>([
    'cesafiu.ro',
    'www.cesafiu.ro'
  ]);

  // Trust our own Host header — Vercel forwards it correctly. This is what
  // makes the guard transparent on `localhost:3000`, preview URLs, etc.
  // It does NOT widen the trust boundary because we still compare the
  // request's *Origin* (provided by the browser, not the server) to it.
  const selfHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (selfHost) {
    selfHost
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
      .forEach((h) => allowed.add(h));
  }

  for (const extra of extras ?? []) {
    allowed.add(extra.toLowerCase());
  }

  return allowed;
}

export function checkSameOrigin(
  request: Request,
  config: OriginGuardConfig = {}
): OriginGuardResult {
  if (!STATEFUL_METHODS.has(request.method.toUpperCase())) {
    return {ok: true};
  }

  const allowed = getAllowedHosts(request, config.extraAllowedHosts);
  const originHost = parseHost(request.headers.get('origin'));
  const refererHost = parseHost(request.headers.get('referer'));
  const candidate = originHost ?? refererHost;

  if (!candidate) {
    return {ok: false, reason: 'missing_origin'};
  }

  if (!allowed.has(candidate)) {
    return {ok: false, reason: `disallowed_origin:${candidate}`};
  }

  return {ok: true};
}
