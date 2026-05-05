import {createHmac, timingSafeEqual} from 'node:crypto';

export type AgeBand = '10-12' | '13-15' | '16-17' | '18+' | 'parent' | 'unknown';
export type ConsentStatus = 'self' | 'pending_parent' | 'parent_confirmed' | 'revoked';

const UNDER_16_AGE_BANDS: AgeBand[] = ['10-12', '13-15'];

export function isUnder16AgeBand(ageBand: AgeBand) {
  return UNDER_16_AGE_BANDS.includes(ageBand);
}

/**
 * Test slugs that are part of the "Profil Complet" bundle.
 * The bundle is free during the pilot, but kept as a single future paid
 * surface. These routes are gated by parent consent for under-16 users.
 *
 * Single source of truth — referenced by:
 *   - apps/web/src/app/[locale]/test/[slug]/page.tsx (page-level gate)
 *   - apps/web/src/app/api/match/route.ts (consent gate via PAID_MATCH_FIELDS)
 *   - landing / results / profile UI for the bundle card
 *
 * See docs/PAID-BUNDLE-POSITIONING.md for the bundling rationale.
 */
export const PAID_TEST_SLUGS = ['ipip-neo-60', 'vocational-deep'] as const;

export type PaidTestSlug = (typeof PAID_TEST_SLUGS)[number];

export function isPaidTestSlug(slug: string): slug is PaidTestSlug {
  return (PAID_TEST_SLUGS as readonly string[]).includes(slug);
}

/**
 * /api/match request body fields produced by the deep bundle tests.
 * If any of these are present in a request body, the under-16 consent gate fires.
 * Kept in lockstep with PAID_TEST_SLUGS.
 */
export const PAID_MATCH_FIELDS = ['ipipNeo60Scores', 'vocationalDeepRaw'] as const;

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
