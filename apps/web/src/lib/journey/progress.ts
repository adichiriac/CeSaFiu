/**
 * Drumul tău — pure journey-derivation engine.
 *
 * Takes a snapshot of real app state and returns the full journey model:
 * sections, steps, lock states, XP, milestones, objective. No React, no
 * stores, no side effects — unit-testable in isolation.
 *
 * Structure (dynamic around the chosen path):
 *  S1 DESCOPERĂ-TE   (derived, sequential)  — 3 tests
 *  S2 ALEGE DIRECȚIA (derived, sequential)  — career #1, path, 2 alternatives
 *  S3 TESTEAZĂ REALITATEA (manual, unordered, per path) — gated until a path
 *     is chosen; content comes from /data/journey-paths.json
 *  S4 FĂ PLANUL      (derived, sequential)  — [save 2 unis + check admission,
 *     only for institution paths] + share with parent
 *
 * Lock semantics: the derived chain S1 → S2 → S4 is sequential (one pulsing
 * "current" step). S3 manual steps are a parallel track — real-world
 * opportunities (open days, conversations) don't queue, and S4 must never
 * stall for weeks behind them.
 */

import {
  manualKey,
  type DeriveInput,
  type JourneyPathStep,
  type JourneySection,
  type JourneyState,
  type JourneyStep,
  type ManualEntry,
} from './types';

export const XP_PER_STEP = 25;

export const BADGES = ['m1', 'm2', 'm3', 'm4', 'finish'] as const;
export type BadgeId = (typeof BADGES)[number];

function pickLocalized(step: JourneyPathStep, field: 'title' | 'sub' | 'hint', locale: string): string | undefined {
  if (locale === 'en') {
    const en = step[`${field}_en` as const];
    if (en) return en;
  }
  return step[field];
}

type DerivedDef = {
  id: string;
  emoji: string;
  title: string;
  sub: string;
  subLiteral?: string;
  subParams?: Record<string, number>;
  done: boolean;
  target: JourneyStep['target'];
};

function derivedStep(def: DerivedDef): JourneyStep {
  return {
    ...def,
    kind: 'derived',
    locked: false,
    current: false,
    xp: XP_PER_STEP,
  };
}

export function deriveJourney(input: DeriveInput): JourneyState {
  const {
    testsDone, chosenCareer, topMatch, savedPath,
    savedAltCount, savedUniCount, admissionChecked, seenShareCard,
    manual, pathConfig, locale,
  } = input;

  // ── S1: Descoperă-te ──────────────────────────────────────────────────────
  const s1Steps: JourneyStep[] = [
    derivedStep({
      id: 'quiz', emoji: '✦', title: 'stepQuiz', sub: 'stepQuizSub',
      done: testsDone.scenarii, target: {kind: 'test', slug: 'scenarii'},
    }),
    derivedStep({
      id: 'voc', emoji: '◉', title: 'stepVocational', sub: 'stepVocationalSub',
      done: testsDone.vocational, target: {kind: 'test', slug: 'vocational'},
    }),
    derivedStep({
      id: 'pers', emoji: '◆', title: 'stepPersonality', sub: 'stepPersonalitySub',
      done: testsDone.personalitate, target: {kind: 'test', slug: 'personalitate'},
    }),
  ];

  // ── S2: Alege direcția ────────────────────────────────────────────────────
  const s2Steps: JourneyStep[] = [
    derivedStep({
      id: 'career', emoji: '★', title: 'stepCareer', sub: 'stepCareerSub',
      subLiteral: chosenCareer ? `${chosenCareer.emoji} ${chosenCareer.name}` : undefined,
      done: Boolean(chosenCareer),
      target: chosenCareer ? {kind: 'career', id: chosenCareer.id} : {kind: 'browse', section: 'careers'},
    }),
    derivedStep({
      id: 'path', emoji: '⚑', title: 'stepPath', sub: 'stepPathSub',
      subLiteral: savedPath?.name ?? undefined,
      done: Boolean(savedPath), target: {kind: 'browse', section: 'paths'},
    }),
    derivedStep({
      id: 'alts', emoji: '♡', title: 'stepAlts', sub: 'stepAltsSub',
      subParams: {count: Math.min(savedAltCount, 2)},
      done: savedAltCount >= 2, target: {kind: 'browse', section: 'careers'},
    }),
  ];

  // ── S3: Testează realitatea (manual, per path) ───────────────────────────
  const pathId = savedPath?.id ?? null;
  const s3Gated = !pathId || !pathConfig;
  const s3Steps: JourneyStep[] = !s3Gated && pathConfig
    ? pathConfig.steps.map((step): JourneyStep => {
        const entry: ManualEntry | undefined = manual[manualKey(pathId, step.id)];
        return {
          id: `${pathId}:${step.id}`,
          emoji: step.emoji,
          title: pickLocalized(step, 'title', locale) ?? step.title,
          sub: pickLocalized(step, 'sub', locale) ?? step.sub,
          hint: pickLocalized(step, 'hint', locale),
          done: Boolean(entry),
          kind: 'manual',
          locked: false,
          current: false,
          target: {kind: 'manual', pathId, stepId: step.id},
          xp: XP_PER_STEP,
          entry,
        };
      })
    : [];

  // ── S4: Fă planul ─────────────────────────────────────────────────────────
  const usesInstitutions = pathConfig ? pathConfig.usesInstitutions : true;
  const s4Steps: JourneyStep[] = [
    ...(usesInstitutions
      ? [
          derivedStep({
            id: 'unis', emoji: '⌂', title: 'stepUnis', sub: 'stepUnisSub',
            subParams: {count: Math.min(savedUniCount, 2)},
            done: savedUniCount >= 2, target: {kind: 'browse', section: 'unis'},
          }),
          derivedStep({
            id: 'adm', emoji: '⏰', title: 'stepAdmission', sub: 'stepAdmissionSub',
            done: admissionChecked, target: {kind: 'browse', section: 'unis'},
          }),
        ]
      : []),
    derivedStep({
      id: 'parent', emoji: '♥', title: 'stepParent', sub: 'stepParentSub',
      done: seenShareCard, target: {kind: 'share'},
    }),
  ];

  // ── Lock + current on the derived chain (S1 → S2 → S4) ───────────────────
  const derivedChain = [...s1Steps, ...s2Steps, ...s4Steps];
  const firstOpen = derivedChain.find((s) => !s.done) ?? null;
  let passedCurrent = false;
  for (const step of derivedChain) {
    if (step === firstOpen) {
      step.current = true;
      passedCurrent = true;
    } else if (passedCurrent && !step.done) {
      step.locked = true;
    }
  }

  const sections: JourneySection[] = [
    {id: 's1', titleKey: 'sectionDiscover', milestoneKey: 'milestoneDiscover', steps: s1Steps, done: s1Steps.every((s) => s.done), gated: false, badgeId: 'm1'},
    {id: 's2', titleKey: 'sectionDirection', milestoneKey: 'milestoneDirection', steps: s2Steps, done: s2Steps.every((s) => s.done), gated: false, badgeId: 'm2'},
    {id: 's3', titleKey: 'sectionReality', milestoneKey: 'milestoneReality', steps: s3Steps, done: !s3Gated && s3Steps.length > 0 && s3Steps.every((s) => s.done), gated: s3Gated, badgeId: 'm3'},
    {id: 's4', titleKey: 'sectionPlan', milestoneKey: 'milestonePlan', steps: s4Steps, done: s4Steps.every((s) => s.done), gated: false, badgeId: 'm4'},
  ];

  const steps = sections.flatMap((s) => s.steps);
  const doneCount = steps.filter((s) => s.done).length;
  // When S3 is still gated, count its eventual steps as 3 so the percentage
  // doesn't jump backwards once a path is chosen.
  const gatedExtra = s3Gated ? 3 : 0;
  const totalCount = steps.length + gatedExtra;
  const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const objective = chosenCareer
    ? {...chosenCareer, chosen: true}
    : topMatch
      ? {...topMatch, chosen: false}
      : null;

  return {
    sections,
    steps,
    doneCount,
    totalCount,
    pct,
    xpEarned: doneCount * XP_PER_STEP,
    xpTotal: totalCount * XP_PER_STEP,
    currentId: firstOpen?.id ?? null,
    objective,
    complete: totalCount > 0 && doneCount === totalCount,
  };
}

/**
 * Reward ids that SHOULD exist in the ledger given the journey state.
 * The client diffs this against the store and logs (+toasts) the new ones.
 */
export function expectedRewards(state: JourneyState): Array<{id: string; type: 'step' | 'milestone' | 'journey'; xp: number; badgeId?: string}> {
  const out: Array<{id: string; type: 'step' | 'milestone' | 'journey'; xp: number; badgeId?: string}> = [];

  for (const step of state.steps) {
    if (step.done) out.push({id: `step:${step.id}`, type: 'step', xp: XP_PER_STEP});
  }
  for (const section of state.sections) {
    if (section.done) out.push({id: `milestone:${section.id}`, type: 'milestone', xp: 0, badgeId: section.badgeId});
  }
  if (state.complete) out.push({id: 'journey:complete', type: 'journey', xp: 0, badgeId: 'finish'});

  return out;
}
