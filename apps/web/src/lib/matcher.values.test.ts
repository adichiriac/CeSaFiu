import {describe, expect, it} from 'vitest';
import {buildUserProfile, computeMatches, getWeights, VALUES_WEIGHT, type Career, type QuizAnswerOption} from './matcher';

function makeCareer(id: string, extra: Partial<Career> = {}): Career {
  return {
    id,
    name: id,
    tagline: '',
    color: 'purple',
    emoji: '✦',
    pathType: 'facultate',
    traits: ['analyze'],
    riasec: ['I', 'A'],
    big5: ['O'],
    salary: '',
    demand: '',
    vibe: '',
    description: '',
    day: [],
    skills: [],
    paths: [],
    ...extra,
  };
}

const quizAnswer: Record<string, QuizAnswerOption> = {
  q1: {id: 'a', riasec: ['I'], path: 'facultate', traits: ['analyze']},
};

const userValues = {achievement: 90, independence: 80, recognition: 40, relationships: 30, support: 20, conditions: 40};
/** Same shape as userValues (high achievement/independence). */
const alignedWv = {achievement: 85, independence: 75, recognition: 45, relationships: 35, support: 25, conditions: 45};
/** Inverted shape (high support/relationships). */
const opposedWv = {achievement: 20, independence: 25, recognition: 60, relationships: 70, support: 80, conditions: 60};

describe('work values in the matcher', () => {
  it('buildUserProfile picks up values + adds the source', () => {
    const profile = buildUserProfile(quizAnswer, {values: userValues});
    expect(profile.workValues).toEqual(userValues);
    expect(profile.sources).toContain('values');
  });

  it('weights: 0 without the test, VALUES_WEIGHT with it, total always 1', () => {
    const without = getWeights(buildUserProfile(quizAnswer));
    expect(without.values).toBe(0);

    const withValues = getWeights(buildUserProfile(quizAnswer, {values: userValues}));
    expect(withValues.values).toBe(VALUES_WEIGHT);

    const sum = (w: ReturnType<typeof getWeights>) =>
      w.riasec + w.paths + w.traits + w.signals + w.big5 + w.values;
    expect(sum(without)).toBeCloseTo(1, 6);
    expect(sum(withValues)).toBeCloseTo(1, 6);

    // Other components keep their ratios (all scaled by 1 - VALUES_WEIGHT).
    expect(withValues.riasec / without.riasec).toBeCloseTo(1 - VALUES_WEIGHT, 6);
    expect(withValues.signals / without.signals).toBeCloseTo(1 - VALUES_WEIGHT, 6);
  });

  it('ranks the values-aligned career above its opposed twin', () => {
    const careers = [makeCareer('opposed', {workValues: opposedWv}), makeCareer('aligned', {workValues: alignedWv})];
    const result = computeMatches({answers: quizAnswer, careers, deepScores: {values: userValues}});
    expect(result[0].career.id).toBe('aligned');
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('does not change ranking without the values test (twins stay tied)', () => {
    const careers = [makeCareer('opposed', {workValues: opposedWv}), makeCareer('aligned', {workValues: alignedWv})];
    const result = computeMatches({answers: quizAnswer, careers});
    expect(result[0].score).toBe(result[1].score);
  });

  it('does not penalize a career that has no values vector (missing data ≠ bad fit)', () => {
    // User's values OPPOSE career A's vector; career B has no vector at all.
    // A gets base + 0 (clamped negative similarity); B gets base renormalized —
    // B must come out ahead, never behind, for lacking data.
    const careers = [makeCareer('opposed', {workValues: opposedWv}), makeCareer('novector')];
    const result = computeMatches({answers: quizAnswer, careers, deepScores: {values: userValues}});
    expect(result[0].career.id).toBe('novector');
  });

  it('suggests the values test once quiz + vocational + big5 are done', () => {
    const result = computeMatches({
      answers: quizAnswer,
      careers: [makeCareer('c1', {workValues: alignedWv})],
      deepScores: {
        personality: {O: 70, C: 60, E: 50, A: 55, N: 40},
        vocational: {raw: {R: 5, I: 15, A: 10, S: 5, E: 5, C: 5}},
      },
    });
    expect(result.nextTest?.kind).toBe('values');
  });
});
