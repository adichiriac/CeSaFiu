import {describe, expect, it} from 'vitest';
import {normalizeLandingPath, normalizeReferralCode, normalizeReferralSource} from './server';

describe('referral normalization', () => {
  it('normalizes referral codes to the stored format', () => {
    expect(normalizeReferralCode(' AbC_123-xyZ! ')).toBe('abc_123-xyz');
  });

  it('rejects empty or non-string referral codes', () => {
    expect(normalizeReferralCode(' !!! ')).toBe('');
    expect(normalizeReferralCode(null)).toBe('');
  });

  it('bounds and cleans referral sources', () => {
    expect(normalizeReferralSource(' WhatsApp!!! ')).toBe('whatsapp');
    expect(normalizeReferralSource('a'.repeat(80))).toHaveLength(64);
  });

  it('keeps only relative landing paths', () => {
    expect(normalizeLandingPath('/ro/test/scenarii?ref=abc')).toBe('/ro/test/scenarii?ref=abc');
    expect(normalizeLandingPath('https://cesafiu.ro/ro')).toBeNull();
    expect(normalizeLandingPath('ro/test')).toBeNull();
  });
});
