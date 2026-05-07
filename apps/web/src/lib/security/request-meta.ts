/**
 * Request metadata helpers.
 *
 * Centralises how we read the client IP and how we hash identifiers
 * before they touch the database. Reuses the CONSENT_HASH_PEPPER pepper
 * that's already provisioned for the consent flow — no new env var.
 *
 * Hashing is one-way HMAC-SHA256. We never store raw IPs or user-agents.
 */

import {hmacIdentifier} from '@/lib/consent';

export type RequestMeta = {
  ip: string;
  ipHash: string;
  userAgentHash: string;
};

/**
 * Best-effort client IP. Order matters: Cloudflare is the most authoritative
 * if we sit behind it, then standard proxy headers, then `unknown`.
 */
export function getRequestIp(request: Request): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf) return cf;

  const real = request.headers.get('x-real-ip');
  if (real) return real;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
}

/**
 * Returns hashed IP and UA suitable for storing or using as rate-limit keys.
 * Returns null if the security pepper isn't configured — callers should treat
 * that as a hard configuration error and refuse to insert anything tied to it.
 */
export function getHashedRequestMeta(request: Request): RequestMeta | null {
  const pepper = process.env.CONSENT_HASH_PEPPER;
  if (!pepper) return null;

  const ip = getRequestIp(request);
  const userAgent = request.headers.get('user-agent') ?? 'unknown';

  return {
    ip,
    ipHash: hmacIdentifier(ip, pepper),
    userAgentHash: hmacIdentifier(userAgent, pepper)
  };
}
