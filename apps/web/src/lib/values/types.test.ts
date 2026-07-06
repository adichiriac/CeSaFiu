import {readFileSync} from 'node:fs';
import path from 'node:path';
import {describe, expect, it} from 'vitest';
import {scoreWorkValues, toPercent, WORK_VALUE_KEYS, type WorkValuesDefinition} from './types';

const definition = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../../../data/work-values.json'), 'utf8'),
) as WorkValuesDefinition;

/** Need counts per value, from the official WIL User's Guide (p. 22). */
const GUIDE_NEED_COUNTS: Record<string, number> = {
  achievement: 2,
  independence: 3,
  recognition: 3,
  relationships: 3,
  support: 3,
  conditions: 6,
};

/** Multipliers per the guide: ×3 (2 needs), ×2 (3 needs), ×1 (6 needs). */
const GUIDE_MULTIPLIERS: Record<string, number> = {
  achievement: 3,
  independence: 2,
  recognition: 2,
  relationships: 2,
  support: 2,
  conditions: 1,
};

describe('work-values.json — WIL structure', () => {
  it('has exactly 20 items (MIQ item 16, social status, dropped)', () => {
    expect(definition.items).toHaveLength(20);
  });

  it('assigns needs to values exactly per the User\'s Guide', () => {
    const counts: Record<string, number> = {};
    for (const item of definition.items) {
      counts[item.value] = (counts[item.value] ?? 0) + 1;
    }
    expect(counts).toEqual(GUIDE_NEED_COUNTS);
  });

  it('uses the official multipliers', () => {
    for (const key of WORK_VALUE_KEYS) {
      expect(definition.values[key].multiplier).toBe(GUIDE_MULTIPLIERS[key]);
    }
  });

  it('has 5 columns × 4 cards = 20 slots (forced distribution)', () => {
    expect(definition.columns).toHaveLength(5);
    expect(definition.cardsPerColumn).toBe(4);
    expect(definition.columns.map((c) => c.points).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('scoreWorkValues — WIL scoring', () => {
  it('lands every value on 18 (scale midpoint) when all cards score 3', () => {
    const assignments = Object.fromEntries(definition.items.map((item) => [item.id, 3]));
    const scores = scoreWorkValues(definition, assignments);
    for (const key of WORK_VALUE_KEYS) {
      expect(scores[key]).toBe(18);
    }
  });

  it('hits the 6–30 bounds at the extremes for every value', () => {
    for (const key of WORK_VALUE_KEYS) {
      const atMax = Object.fromEntries(
        definition.items.map((item) => [item.id, item.value === key ? 5 : 1]),
      );
      const atMin = Object.fromEntries(
        definition.items.map((item) => [item.id, item.value === key ? 1 : 5]),
      );
      expect(scoreWorkValues(definition, atMax)[key]).toBe(definition.scoring.max);
      expect(scoreWorkValues(definition, atMin)[key]).toBe(definition.scoring.min);
    }
  });

  it('scores a known valid forced distribution correctly', () => {
    // Column by definition order: first 4 items → 5, next 4 → 4, etc.
    const assignments: Record<string, number> = {};
    definition.items.forEach((item, index) => {
      assignments[item.id] = 5 - Math.floor(index / 4);
    });
    const scores = scoreWorkValues(definition, assignments);
    // Recompute independently.
    for (const key of WORK_VALUE_KEYS) {
      const sum = definition.items.reduce(
        (acc, item) => (item.value === key ? acc + assignments[item.id] : acc),
        0,
      );
      expect(scores[key]).toBe(sum * GUIDE_MULTIPLIERS[key]);
      expect(scores[key]).toBeGreaterThanOrEqual(6);
      expect(scores[key]).toBeLessThanOrEqual(30);
    }
  });

  it('maps 6→0%, 18→50%, 30→100%', () => {
    expect(toPercent(definition, 6)).toBe(0);
    expect(toPercent(definition, 18)).toBe(50);
    expect(toPercent(definition, 30)).toBe(100);
  });
});
