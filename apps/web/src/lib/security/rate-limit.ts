/**
 * Sliding-window rate limiting via Upstash Redis.
 *
 * Profiles are declared per logical endpoint, not per request. Each profile
 * defines independent IP and (optional) user buckets. Both are checked when
 * the user is logged in; only the IP bucket is checked otherwise.
 *
 * Configuration:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 *
 * If either env var is missing the limiter "fails open" and logs a warning.
 * That keeps local development frictionless and protects us from a Upstash
 * outage hard-failing every endpoint, but it is logged so it's never silent.
 *
 * IMPORTANT: profiles are sliding-window, not token-bucket — bursts are
 * counted against the trailing window, so 3/hour really means 3 in any
 * 60-minute span, not "3 then sleep until the hour rolls over".
 */

import {Ratelimit} from '@upstash/ratelimit';
import {Redis} from '@upstash/redis';

export type RateLimitProfile = {
  /** Stable id used as the Redis key prefix. */
  name: string;
  /** Per-IP limits. Always applied. */
  ip: {limit: number; windowSeconds: number};
  /** Per-user limits. Only applied when `userId` is provided. */
  user?: {limit: number; windowSeconds: number};
};

export type RateLimitDecision = {
  ok: boolean;
  /** Which bucket fired ('ip' | 'user' | null when ok). */
  blockedBy: 'ip' | 'user' | null;
  /** Seconds until the bucket has room again. -1 if unknown. */
  retryAfterSeconds: number;
};

let cachedRedis: Redis | null | undefined;
const limiterCache = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (cachedRedis !== undefined) return cachedRedis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    cachedRedis = null;
    return cachedRedis;
  }

  cachedRedis = new Redis({url, token});
  return cachedRedis;
}

function getLimiter(profile: RateLimitProfile, kind: 'ip' | 'user'): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const key = `${profile.name}:${kind}`;
  const cached = limiterCache.get(key);
  if (cached) return cached;

  const config = kind === 'ip' ? profile.ip : profile.user;
  if (!config) return null;

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
    analytics: false,
    prefix: `cesafiu:rl:${key}`
  });

  limiterCache.set(key, limiter);
  return limiter;
}

/**
 * Check rate limit for the given profile. Returns ok:true when there's room
 * (including when Redis is not configured — fail open). Blocked by user
 * takes precedence over blocked by IP for clearer error messages.
 */
export async function checkRateLimit(args: {
  profile: RateLimitProfile;
  ipHash: string;
  userId?: string | null;
}): Promise<RateLimitDecision> {
  const redis = getRedis();
  if (!redis) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('rate-limit: UPSTASH_REDIS_REST_* not configured, failing open');
    }
    return {ok: true, blockedBy: null, retryAfterSeconds: -1};
  }

  const ipLimiter = getLimiter(args.profile, 'ip');
  const userLimiter = args.userId ? getLimiter(args.profile, 'user') : null;

  const checks: Promise<{kind: 'ip' | 'user'; result: Awaited<ReturnType<Ratelimit['limit']>>}>[] = [];

  if (ipLimiter) {
    checks.push(ipLimiter.limit(args.ipHash).then((result) => ({kind: 'ip', result})));
  }
  if (userLimiter && args.userId) {
    checks.push(userLimiter.limit(args.userId).then((result) => ({kind: 'user', result})));
  }

  const results = await Promise.all(checks);

  // Prefer reporting "user" over "ip" when both are blocked — the user
  // identity is more specific and the error message is more useful.
  const sorted = results.sort((a) => (a.kind === 'user' ? -1 : 1));
  for (const {kind, result} of sorted) {
    if (!result.success) {
      const retry = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
      return {ok: false, blockedBy: kind, retryAfterSeconds: retry};
    }
  }

  return {ok: true, blockedBy: null, retryAfterSeconds: -1};
}

/* ------------------------------------------------------------------ */
/* Profile catalog — keep declarative so reviewers see all limits      */
/* in one place instead of hunting through routes.                     */
/* ------------------------------------------------------------------ */

export const RATE_LIMIT_PROFILES = {
  feedback: {
    name: 'feedback',
    ip: {limit: 10, windowSeconds: 60 * 60 * 24}, // 10/day per IP
    user: {limit: 20, windowSeconds: 60 * 60 * 24} // 20/day per user
  },
  parentConsentRequest: {
    name: 'parent-consent-request',
    ip: {limit: 10, windowSeconds: 60 * 10}, // 10 / 10-min window per IP
    user: {limit: 3, windowSeconds: 60 * 10} // 3 / 10-min window per user
  },
  match: {
    name: 'match',
    ip: {limit: 60, windowSeconds: 60} // 60/min per IP — generous, just anti-flood
  }
} as const satisfies Record<string, RateLimitProfile>;
