import {createHmac, timingSafeEqual} from 'node:crypto';

export type AgeBand = '10-12' | '13-15' | '16-17' | '18+' | 'parent' | 'unknown';
export type ConsentStatus = 'self' | 'pending_parent' | 'parent_confirmed' | 'revoked';

const UNDER_16_AGE_BANDS: AgeBand[] = ['10-12', '13-15'];

export function isUnder16AgeBand(ageBand: AgeBand) {
  return UNDER_16_AGE_BANDS.includes(ageBand);
}

export function consentStatusForAgeBand(ageBand: AgeBand): ConsentStatus {
  return isUnder16AgeBand(ageBand) ? 'pending_parent' : 'self';
}

export function hmacIdentifier(value: string, pepper: string) {
  return createHmac('sha256', pepper).update(value.trim().toLowerCase()).digest('hex');
}

export function hmacSecret(value: string, pepper: string) {
  return createHmac('sha256', pepper).update(value).digest('hex');
}

export function canConfirmToken(expectedHash: string, actualHash: string) {
  const expected = Buffer.from(expectedHash, 'hex');
  const actual = Buffer.from(actualHash, 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
