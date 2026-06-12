import {describe, expect, it} from 'vitest';

import {deriveJourney, expectedRewards, XP_PER_STEP} from './progress';
import type {DeriveInput, JourneyPathConfig} from './types';

const FACULTATE: JourneyPathConfig = {
  usesInstitutions: true,
  steps: [
    {id: 'open-day', emoji: '🚪', title: 'Porți deschise', title_en: 'Open day', sub: 'pe viu', sub_en: 'in person'},
    {id: 'talk-student', emoji: '💬', title: 'Vorbește cu un student', sub: 'primul an'},
    {id: 'sit-in', emoji: '📚', title: 'Asistă la un curs', sub: 'o oră reală'},
  ],
};

const CREATOR: JourneyPathConfig = {
  usesInstitutions: false,
  steps: [
    {id: 'publish-3', emoji: '📣', title: 'Publică 3 postări', sub: 'consistență'},
    {id: 'read-stats', emoji: '📊', title: 'Statistici', sub: 'date'},
    {id: 'talk-creator', emoji: '💬', title: 'Vorbește cu un creator', sub: '1.000'},
  ],
};

function freshInput(overrides: Partial<DeriveInput> = {}): DeriveInput {
  return {
    testsDone: {scenarii: false, vocational: false, personalitate: false},
    chosenCareer: null,
    topMatch: null,
    savedPath: null,
    savedAltCount: 0,
    savedUniCount: 0,
    admissionChecked: false,
    seenShareCard: false,
    manual: {},
    pathConfig: null,
    locale: 'ro',
    ...overrides,
  };
}

describe('deriveJourney — structure', () => {
  it('fresh user: first step is current, rest of derived chain locked, S3 gated', () => {
    const state = deriveJourney(freshInput());

    expect(state.currentId).toBe('quiz');
    const quiz = state.steps.find((s) => s.id === 'quiz')!;
    expect(quiz.current).toBe(true);
    expect(quiz.locked).toBe(false);

    const voc = state.steps.find((s) => s.id === 'voc')!;
    expect(voc.locked).toBe(true);

    const s3 = state.sections.find((s) => s.id === 's3')!;
    expect(s3.gated).toBe(true);
    expect(s3.steps).toHaveLength(0);

    expect(state.doneCount).toBe(0);
    expect(state.xpEarned).toBe(0);
    // 3 + 3 + (3 gated placeholders) + 3 (unis default) = 12
    expect(state.totalCount).toBe(12);
  });

  it('institution path (facultate): S4 has unis + admission + share', () => {
    const state = deriveJourney(freshInput({
      savedPath: {id: 'facultate', name: 'Facultate clasică'},
      pathConfig: FACULTATE,
    }));
    const s4 = state.sections.find((s) => s.id === 's4')!;
    expect(s4.steps.map((s) => s.id)).toEqual(['unis', 'adm', 'parent']);
    expect(state.totalCount).toBe(12);
  });

  it('non-institution path (creator): S4 is share-only, total shrinks', () => {
    const state = deriveJourney(freshInput({
      savedPath: {id: 'creator', name: 'Creator economy'},
      pathConfig: CREATOR,
    }));
    const s4 = state.sections.find((s) => s.id === 's4')!;
    expect(s4.steps.map((s) => s.id)).toEqual(['parent']);
    expect(state.totalCount).toBe(10);
  });

  it('S3 steps are localized when locale=en, with RO fallback', () => {
    const state = deriveJourney(freshInput({
      savedPath: {id: 'facultate', name: 'Facultate'},
      pathConfig: FACULTATE,
      locale: 'en',
    }));
    const s3 = state.sections.find((s) => s.id === 's3')!;
    expect(s3.steps[0].title).toBe('Open day');
    // talk-student has no EN — falls back to RO
    expect(s3.steps[1].title).toBe('Vorbește cu un student');
  });
});

describe('deriveJourney — lock semantics', () => {
  it('manual S3 steps are never locked and never current', () => {
    const state = deriveJourney(freshInput({
      savedPath: {id: 'creator', name: 'Creator'},
      pathConfig: CREATOR,
    }));
    const s3 = state.sections.find((s) => s.id === 's3')!;
    for (const step of s3.steps) {
      expect(step.locked).toBe(false);
      expect(step.current).toBe(false);
    }
  });

  it('S4 does not stall behind incomplete S3 manual steps', () => {
    const state = deriveJourney(freshInput({
      testsDone: {scenarii: true, vocational: true, personalitate: true},
      chosenCareer: {id: 'dev', name: 'Developer', emoji: '💻'},
      savedPath: {id: 'facultate', name: 'Facultate'},
      savedAltCount: 2,
      pathConfig: FACULTATE,
      // zero manual steps done
    }));
    // current jumps to S4's first step, not an S3 manual step
    expect(state.currentId).toBe('unis');
  });

  it('chain order: completing S1+S2 partially keeps current at first open derived step', () => {
    const state = deriveJourney(freshInput({
      testsDone: {scenarii: true, vocational: false, personalitate: true},
    }));
    expect(state.currentId).toBe('voc');
    const pers = state.steps.find((s) => s.id === 'pers')!;
    expect(pers.locked).toBe(false); // done steps are never locked
    expect(pers.done).toBe(true);
  });
});

describe('deriveJourney — completion + objective', () => {
  const completeInput = (): DeriveInput => freshInput({
    testsDone: {scenarii: true, vocational: true, personalitate: true},
    chosenCareer: {id: 'dev', name: 'Developer', emoji: '💻'},
    savedPath: {id: 'creator', name: 'Creator economy'},
    savedAltCount: 2,
    seenShareCard: true,
    pathConfig: CREATOR,
    manual: {
      'creator:publish-3': {at: '2026-06-01T10:00:00Z', note: 'a fost greu dar mișto'},
      'creator:read-stats': {at: '2026-06-02T10:00:00Z'},
      'creator:talk-creator': {at: '2026-06-03T10:00:00Z'},
    },
  });

  it('100% completion: complete=true, pct=100, all XP earned', () => {
    const state = deriveJourney(completeInput());
    expect(state.complete).toBe(true);
    expect(state.pct).toBe(100);
    expect(state.xpEarned).toBe(state.totalCount * XP_PER_STEP);
    expect(state.currentId).toBeNull();
  });

  it('manual steps carry their entry (timestamp + note)', () => {
    const state = deriveJourney(completeInput());
    const publish = state.steps.find((s) => s.id === 'creator:publish-3')!;
    expect(publish.entry?.note).toBe('a fost greu dar mișto');
    expect(publish.done).toBe(true);
  });

  it('objective prefers chosen career over top match', () => {
    const chosen = deriveJourney(completeInput());
    expect(chosen.objective).toMatchObject({id: 'dev', chosen: true});

    const suggested = deriveJourney(freshInput({topMatch: {id: 'arch', name: 'Arhitect', emoji: '📐'}}));
    expect(suggested.objective).toMatchObject({id: 'arch', chosen: false});

    expect(deriveJourney(freshInput()).objective).toBeNull();
  });

  it('switching paths keeps completions per (pathId, stepId) — no cross-path bleed', () => {
    const onCreator = deriveJourney(freshInput({
      savedPath: {id: 'creator', name: 'Creator'},
      pathConfig: CREATOR,
      manual: {'creator:publish-3': {at: '2026-06-01T10:00:00Z'}},
    }));
    expect(onCreator.steps.find((s) => s.id === 'creator:publish-3')!.done).toBe(true);

    const onFacultate = deriveJourney(freshInput({
      savedPath: {id: 'facultate', name: 'Facultate'},
      pathConfig: FACULTATE,
      manual: {'creator:publish-3': {at: '2026-06-01T10:00:00Z'}},
    }));
    const s3 = onFacultate.sections.find((s) => s.id === 's3')!;
    expect(s3.steps.every((s) => !s.done)).toBe(true);
  });
});

describe('expectedRewards', () => {
  it('emits step rewards for done steps and milestone badges for done sections', () => {
    const state = deriveJourney(freshInput({
      testsDone: {scenarii: true, vocational: true, personalitate: true},
    }));
    const rewards = expectedRewards(state);
    expect(rewards).toContainEqual({id: 'step:quiz', type: 'step', xp: XP_PER_STEP});
    expect(rewards).toContainEqual({id: 'milestone:s1', type: 'milestone', xp: 0, badgeId: 'm1'});
    expect(rewards.some((r) => r.id === 'journey:complete')).toBe(false);
  });

  it('emits journey:complete with finish badge at 100%', () => {
    const state = deriveJourney(freshInput({
      testsDone: {scenarii: true, vocational: true, personalitate: true},
      chosenCareer: {id: 'dev', name: 'Developer', emoji: '💻'},
      savedPath: {id: 'creator', name: 'Creator'},
      savedAltCount: 2,
      seenShareCard: true,
      pathConfig: CREATOR,
      manual: {
        'creator:publish-3': {at: 'x'},
        'creator:read-stats': {at: 'x'},
        'creator:talk-creator': {at: 'x'},
      },
    }));
    const rewards = expectedRewards(state);
    expect(rewards).toContainEqual({id: 'journey:complete', type: 'journey', xp: 0, badgeId: 'finish'});
  });
});
