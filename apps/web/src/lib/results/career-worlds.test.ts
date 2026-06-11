/**
 * Phase B acceptance tests (docs/ARCHETYPES-V2-PLAN.md, criteria #7):
 *   - sidecar bijection: every careers.json id mapped exactly once, 1–2 worlds,
 *     no orphan ids in either direction
 *   - every world has ≥1 career (no empty /browse filter)
 *   - deriveWorlds: weighted aggregation, thresholds, confidence gating
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';

import {describe, expect, it} from 'vitest';

import {CAREER_WORLDS} from './career-worlds';
import {deriveWorlds, WORLD_IDS, WORLDS, type WorldId} from './worlds';

const careers = JSON.parse(
  readFileSync(path.resolve(process.cwd(), '../../data/careers.json'), 'utf8'),
) as Array<{id: string}>;

describe('career-worlds sidecar bijection', () => {
  const careerIds = new Set(careers.map((c) => c.id));
  const mappedIds = Object.keys(CAREER_WORLDS);

  it('careers.json has unique ids', () => {
    expect(careerIds.size).toBe(careers.length);
  });

  it('every career in careers.json is mapped', () => {
    const unmapped = [...careerIds].filter((id) => !(id in CAREER_WORLDS));
    expect(unmapped).toEqual([]);
  });

  it('no orphan ids in the sidecar', () => {
    const orphans = mappedIds.filter((id) => !careerIds.has(id));
    expect(orphans).toEqual([]);
  });

  it('every career has 1–2 worlds, all valid and distinct', () => {
    const validWorlds = new Set<string>(WORLD_IDS);
    for (const [id, worlds] of Object.entries(CAREER_WORLDS)) {
      expect(worlds.length, `${id} world count`).toBeGreaterThanOrEqual(1);
      expect(worlds.length, `${id} world count`).toBeLessThanOrEqual(2);
      expect(new Set(worlds).size, `${id} has duplicate worlds`).toBe(worlds.length);
      for (const w of worlds) {
        expect(validWorlds.has(w), `${id} has unknown world "${w}"`).toBe(true);
      }
    }
  });

  it('every world has at least one career (no empty /browse filter)', () => {
    const used = new Set(Object.values(CAREER_WORLDS).flat());
    const empty = WORLD_IDS.filter((id) => !used.has(id));
    expect(empty).toEqual([]);
  });

  it('all 15 worlds have RO+EN names and taglines', () => {
    expect(WORLD_IDS.length).toBe(15);
    for (const id of WORLD_IDS) {
      const w = WORLDS[id];
      expect(w.nameRo.length).toBeGreaterThan(0);
      expect(w.nameEn.length).toBeGreaterThan(0);
      expect(w.taglineRo.length).toBeGreaterThan(0);
      expect(w.taglineEn.length).toBeGreaterThan(0);
    }
  });
});

describe('deriveWorlds aggregation', () => {
  const map: Record<string, WorldId[]> = {
    a1: ['ai-minds'],
    a2: ['ai-minds'],
    n1: ['numbers-people'],
    dual: ['ai-minds', 'numbers-people'],
    solo: ['makers'],
  };

  it('hides chips below the confidence gate', () => {
    const out = deriveWorlds([{careerId: 'a1', weight: 1}], map, 0.2);
    expect(out).toEqual([]);
  });

  it('splits weight across a career with two worlds', () => {
    const out = deriveWorlds(
      [
        {careerId: 'dual', weight: 1},
        {careerId: 'a1', weight: 0.8},
        {careerId: 'n1', weight: 0.8},
      ],
      map,
      0.9,
      {minCareers: 1},
    );
    const ai = out.find((w) => w.world.id === 'ai-minds');
    const nums = out.find((w) => w.world.id === 'numbers-people');
    expect(ai?.score).toBeCloseTo(0.5 + 0.8);
    expect(nums?.score).toBeCloseTo(0.5 + 0.8);
  });

  it('drops worlds with a single contributing career (minCareers=2)', () => {
    const out = deriveWorlds(
      [
        {careerId: 'a1', weight: 1},
        {careerId: 'a2', weight: 0.9},
        {careerId: 'solo', weight: 0.95},
      ],
      map,
      0.9,
    );
    expect(out.map((w) => w.world.id)).toEqual(['ai-minds']);
  });

  it('drops worlds under 50% of the leader', () => {
    const out = deriveWorlds(
      [
        {careerId: 'a1', weight: 1},
        {careerId: 'a2', weight: 1},
        {careerId: 'n1', weight: 0.4},
        {careerId: 'dual', weight: 0.4},
      ],
      map,
      0.9,
    );
    // ai-minds: 1 + 1 + 0.2 = 2.2; numbers-people: 0.4 + 0.2 = 0.6 < 1.1
    expect(out.map((w) => w.world.id)).toEqual(['ai-minds']);
  });

  it('returns at most maxWorlds, ranked by score', () => {
    const big: Record<string, WorldId[]> = {
      d1: ['digital-builders'], d2: ['digital-builders'],
      h1: ['healers'], h2: ['healers'],
      m1: ['makers'], m2: ['makers'],
      p1: ['protectors'], p2: ['protectors'],
    };
    const out = deriveWorlds(
      [
        {careerId: 'd1', weight: 1}, {careerId: 'd2', weight: 0.95},
        {careerId: 'h1', weight: 0.9}, {careerId: 'h2', weight: 0.85},
        {careerId: 'm1', weight: 0.8}, {careerId: 'm2', weight: 0.75},
        {careerId: 'p1', weight: 0.7}, {careerId: 'p2', weight: 0.65},
      ],
      big,
      0.9,
    );
    expect(out.length).toBe(3);
    expect(out[0].world.id).toBe('digital-builders');
    expect(out[0].score).toBeGreaterThanOrEqual(out[1].score);
    expect(out[1].score).toBeGreaterThanOrEqual(out[2].score);
  });

  it('ignores unknown career ids and respects topN', () => {
    const out = deriveWorlds(
      [
        {careerId: 'ghost', weight: 1},
        {careerId: 'a1', weight: 0.9},
        {careerId: 'a2', weight: 0.8},
      ],
      map,
      0.9,
      {topN: 2},
    );
    // ghost ignored; only a1 falls inside topN=2 → ai-minds has 1 career → dropped
    expect(out).toEqual([]);
  });
});
