import {beforeEach, describe, expect, it, vi} from 'vitest';

const limit = vi.fn();

vi.mock('@upstash/redis', () => ({
  Redis: class Redis {}
}));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class Ratelimit {
    static slidingWindow() {
      return {};
    }

    limit = limit;
  }
}));

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    limit.mockReset();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
  });

  it('fails open when the rate-limit provider is unavailable', async () => {
    const providerError = new Error('provider unavailable');
    limit.mockRejectedValue(providerError);
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const {checkRateLimit, RATE_LIMIT_PROFILES} = await import('./rate-limit');

    await expect(
      checkRateLimit({
        profile: RATE_LIMIT_PROFILES.feedback,
        ipHash: 'test-ip-hash'
      })
    ).resolves.toEqual({ok: true, blockedBy: null, retryAfterSeconds: -1});
    expect(log).toHaveBeenCalledWith('rate-limit: check_failed, failing open', providerError);
  });
});
