import {describe, expect, it} from 'vitest';
import {checkSameOrigin} from './origin-guard';

function makeRequest(method: string, headers: Record<string, string>): Request {
  return new Request('https://cesafiu.ro/api/feedback', {method, headers});
}

describe('checkSameOrigin', () => {
  it('passes through GET requests without Origin', () => {
    const result = checkSameOrigin(makeRequest('GET', {}));
    expect(result.ok).toBe(true);
  });

  it('rejects POST without Origin or Referer', () => {
    const result = checkSameOrigin(makeRequest('POST', {host: 'cesafiu.ro'}));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('missing_origin');
    }
  });

  it('accepts POST with matching Origin', () => {
    const result = checkSameOrigin(
      makeRequest('POST', {host: 'cesafiu.ro', origin: 'https://cesafiu.ro'})
    );
    expect(result.ok).toBe(true);
  });

  it('accepts POST with matching www Origin', () => {
    const result = checkSameOrigin(
      makeRequest('POST', {host: 'www.cesafiu.ro', origin: 'https://www.cesafiu.ro'})
    );
    expect(result.ok).toBe(true);
  });

  it('accepts POST when Origin is missing but Referer matches', () => {
    const result = checkSameOrigin(
      makeRequest('POST', {host: 'cesafiu.ro', referer: 'https://cesafiu.ro/ro'})
    );
    expect(result.ok).toBe(true);
  });

  it('rejects POST with foreign Origin', () => {
    const result = checkSameOrigin(
      makeRequest('POST', {host: 'cesafiu.ro', origin: 'https://evil.example'})
    );
    expect(result.ok).toBe(false);
  });

  it('respects extraAllowedHosts', () => {
    const result = checkSameOrigin(
      makeRequest('POST', {host: 'cesafiu.ro', origin: 'https://preview.example'}),
      {extraAllowedHosts: ['preview.example']}
    );
    expect(result.ok).toBe(true);
  });

  it('treats local dev host as allowed via x-forwarded-host', () => {
    const result = checkSameOrigin(
      makeRequest('POST', {
        host: 'localhost:3000',
        'x-forwarded-host': 'localhost:3000',
        origin: 'http://localhost:3000'
      })
    );
    expect(result.ok).toBe(true);
  });
});
