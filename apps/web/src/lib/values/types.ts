/**
 * „Valorile tale” — O*NET Work Importance Locator (WIL) RO adaptation.
 * Shared types for the card-sort test. See docs/WORK-VALUES-PLAN.md.
 */

export type WorkValueKey =
  | 'achievement'
  | 'independence'
  | 'recognition'
  | 'relationships'
  | 'support'
  | 'conditions';

export const WORK_VALUE_KEYS: WorkValueKey[] = [
  'achievement',
  'independence',
  'recognition',
  'relationships',
  'support',
  'conditions',
];

export type WorkValuesColumn = {
  points: number;
  label: string;
};

export type WorkValuesItem = {
  id: string;
  /** Official O*NET need name (English) — the scoring anchor from the WIL User's Guide. */
  need: string;
  value: WorkValueKey;
  text: string;
};

export type WorkValueMeta = {
  name: string;
  short: string;
  /** WIL User's Guide multiplier: ×3 (2-need value), ×2 (3-need values), ×1 (6-need value). */
  multiplier: number;
  desc: string;
};

export type WorkValuesDefinition = {
  name: string;
  subtitle: string;
  attribution: string;
  disclaimer: string;
  framing: string;
  forcedChoiceNote: string;
  columns: WorkValuesColumn[];
  cardsPerColumn: number;
  scoring: {min: number; max: number};
  items: WorkValuesItem[];
  values: Record<WorkValueKey, WorkValueMeta>;
};

/** itemId → column points (5..1). Complete when all 20 items are assigned. */
export type WorkValuesAssignments = Record<string, number>;

export type WorkValuesScores = Record<WorkValueKey, number>;

/**
 * WIL scoring, exactly per the official User's Guide:
 * value score = Σ(column points of its needs) × multiplier → 6..30 for all six.
 */
export function scoreWorkValues(
  definition: WorkValuesDefinition,
  assignments: WorkValuesAssignments,
): WorkValuesScores {
  const sums: Record<string, number> = {};
  for (const item of definition.items) {
    const points = assignments[item.id];
    if (typeof points !== 'number') continue;
    sums[item.value] = (sums[item.value] ?? 0) + points;
  }
  const out = {} as WorkValuesScores;
  for (const key of WORK_VALUE_KEYS) {
    out[key] = (sums[key] ?? 0) * (definition.values[key]?.multiplier ?? 1);
  }
  return out;
}

/** 6..30 → 0..100 for UI bars and the stored workValues vector. */
export function toPercent(definition: WorkValuesDefinition, raw: number): number {
  const {min, max} = definition.scoring;
  return Math.round(((raw - min) / (max - min)) * 100);
}
