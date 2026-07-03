/**
 * Ce Să Fiu? — Career collections (Explore redesign, docs/EXPLORE-REDESIGN-PLAN.md §2/§4)
 *
 * Derives filterable facts from the free-text career fields ONCE, instead of
 * regexing `salary`/`demand` inside components (the prototype did that; it is
 * brittle at 184 careers). Pure functions — unit-tested in collections.test.ts.
 */

import type {Career} from '@/lib/matcher';

/** Collection chip ids shown on the Cariere section, in display order. */
export const COLLECTION_IDS = ['all', 'matched', 'paid', 'demand', 'nodegree', 'creative', 'saved'] as const;
export type CollectionId = (typeof COLLECTION_IDS)[number];

/** Monthly EUR at or above which a career counts as 💰 "Bine plătite". */
export const WELL_PAID_MIN_EUR = 4000;

/** Hours used to convert an hourly rate ("€/oră") to a monthly equivalent. */
const HOURS_PER_MONTH = 160;

/** pathTypes that do not require a university degree ("Fără facultate"). */
const NO_DEGREE_PATH_TYPES = new Set(['autodidact', 'profesional', 'creator', 'freelance', 'antreprenor']);

/** Lowercase + strip diacritics so "În creștere" matches "in crestere". */
function fold(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Parse the highest EUR amount from a free-text salary string.
 *
 * Handles the dataset's formats: dot-thousands ranges ("Junior: 1.200 — 2.500
 * €/lună · Senior: 4.500 — 7.500 €/lună"), open tops ("20.000+"), plain
 * hundreds ("800 — 1.500"), and hourly rates ("25 — 50 €/oră", converted via
 * HOURS_PER_MONTH). Returns null when no number is present ("Variabil —
 * depinde de impact").
 */
export function parseSalaryMaxEur(salary: string | undefined | null): number | null {
  if (!salary) return null;
  const matches = salary.match(/\d{1,3}(?:\.\d{3})+|\d+/g);
  if (!matches) return null;
  const hourly = fold(salary).includes('/ora');
  const values = matches.map((token) => Number(token.replace(/\./g, '')));
  const max = Math.max(...values);
  if (!Number.isFinite(max) || max <= 0) return null;
  return hourly ? max * HOURS_PER_MONTH : max;
}

/** 💰 Bine plătite — top of any listed band ≥ WELL_PAID_MIN_EUR/month. */
export function isWellPaid(career: Career): boolean {
  const max = parseSalaryMaxEur(career.salary);
  return max !== null && max >= WELL_PAID_MIN_EUR;
}

/** 🔥 În cerere — demand reads "Extremă", "Foarte mare" or "În creștere". */
export function isInDemand(career: Career): boolean {
  const demand = fold(career.demand ?? '');
  return demand.includes('extrem') || demand.includes('foarte mare') || demand.includes('in crestere');
}

/** Fără facultate — reachable without a university degree. */
export function isNoDegree(career: Career): boolean {
  return NO_DEGREE_PATH_TYPES.has(career.pathType);
}

/** Creative — Artistic is one of the career's RIASEC codes. */
export function isCreative(career: Career): boolean {
  return (career.riasec ?? []).includes('A');
}

/** How many top match careers feed the institutions "Potrivite" tab. */
export const MATCHED_UNIS_TOP_CAREERS = 3;

/**
 * Institutions "✨ Potrivite" derivation (plan §2): the user's top-N match
 * careers → programs whose careerIds include one of them → their host
 * institutions. `reason` holds the first matching program's name per
 * institution, shown as the "why this matched" chip.
 */
export function matchedInstitutions(
  matches: Array<{career: {id: string}; score: number}> | null | undefined,
  programs: Array<{universityId: string; careerIds?: string[]; name: string}>,
  topN: number = MATCHED_UNIS_TOP_CAREERS,
): {uniIds: Set<string>; reason: Record<string, string>} {
  const uniIds = new Set<string>();
  const reason: Record<string, string> = {};
  const topCareerIds = (matches ?? [])
    .filter((m) => m.score > 0)
    .slice(0, topN)
    .map((m) => m.career.id);
  if (topCareerIds.length === 0) return {uniIds, reason};

  for (const program of programs) {
    if (!(program.careerIds ?? []).some((id) => topCareerIds.includes(id))) continue;
    uniIds.add(program.universityId);
    reason[program.universityId] ??= program.name;
  }
  return {uniIds, reason};
}

/**
 * Membership test for the static collections. `matched` and `saved` depend on
 * user state, so the caller supplies them via `ctx`; `all` always passes.
 */
export function inCollection(
  career: Career,
  collection: CollectionId,
  ctx: {matchScore?: number; isSaved?: boolean} = {},
): boolean {
  switch (collection) {
    case 'all':
      return true;
    case 'matched':
      return (ctx.matchScore ?? 0) > 0;
    case 'paid':
      return isWellPaid(career);
    case 'demand':
      return isInDemand(career);
    case 'nodegree':
      return isNoDegree(career);
    case 'creative':
      return isCreative(career);
    case 'saved':
      return ctx.isSaved === true;
  }
}
