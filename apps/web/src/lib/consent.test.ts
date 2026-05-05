import {describe, expect, it} from 'vitest';
import {
  PAID_MATCH_FIELDS,
  PAID_TEST_SLUGS,
  consentStatusForAgeBand,
  isPaidTestSlug,
  isUnder16AgeBand
} from './consent';

describe('age band rules', () => {
  it('flags 10-12 and 13-15 as under 16', () => {
    expect(isUnder16AgeBand('10-12')).toBe(true);
    expect(isUnder16AgeBand('13-15')).toBe(true);
  });

  it('does not flag 16-17, 18+, parent, or unknown as under 16', () => {
    expect(isUnder16AgeBand('16-17')).toBe(false);
    expect(isUnder16AgeBand('18+')).toBe(false);
    expect(isUnder16AgeBand('parent')).toBe(false);
    expect(isUnder16AgeBand('unknown')).toBe(false);
  });

  it('routes under-16 bands to pending_parent and others to self', () => {
    expect(consentStatusForAgeBand('10-12')).toBe('pending_parent');
    expect(consentStatusForAgeBand('13-15')).toBe('pending_parent');
    expect(consentStatusForAgeBand('16-17')).toBe('self');
    expect(consentStatusForAgeBand('18+')).toBe('self');
    expect(consentStatusForAgeBand('parent')).toBe('self');
    expect(consentStatusForAgeBand('unknown')).toBe('self');
  });
});

describe('paid bundle slugs', () => {
  it('contains exactly the two deep tests in the bundle', () => {
    // If this test changes, also update:
    //   docs/PAID-BUNDLE-POSITIONING.md (§1, §3, §9)
    //   apps/web/messages/{ro,en}.json (consentRequiredLead, paid* keys)
    expect([...PAID_TEST_SLUGS].sort()).toEqual(['ipip-neo-60', 'vocational-deep']);
  });

  it('isPaidTestSlug recognizes both bundle slugs', () => {
    expect(isPaidTestSlug('ipip-neo-60')).toBe(true);
    expect(isPaidTestSlug('vocational-deep')).toBe(true);
  });

  it('isPaidTestSlug rejects free test slugs', () => {
    expect(isPaidTestSlug('scenarii')).toBe(false);
    expect(isPaidTestSlug('personalitate')).toBe(false);
    expect(isPaidTestSlug('vocational')).toBe(false);
    expect(isPaidTestSlug('unknown-slug')).toBe(false);
    expect(isPaidTestSlug('')).toBe(false);
  });

  it('PAID_MATCH_FIELDS matches the slug list 1:1', () => {
    // Lockstep invariant — adding a slug to PAID_TEST_SLUGS without adding
    // its matching match-request field leaves a hole in the API gate.
    expect(PAID_MATCH_FIELDS).toHaveLength(PAID_TEST_SLUGS.length);
    expect([...PAID_MATCH_FIELDS].sort()).toEqual(['ipipNeo60Scores', 'vocationalDeepRaw']);
  });
});
