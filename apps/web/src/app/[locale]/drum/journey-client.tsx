'use client';

/**
 * Drumul tău — gamified journey screen.
 *
 * Duolingo-style path over REAL app state: tests, chosen career/path, saved
 * unis, share. Path-specific reality-check steps (S3) come from
 * /data/journey-paths.json and are self-reported, each with an optional
 * impression note.
 */

import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';

import BottomNav from '@/components/bottom-nav';
import ThemeToggle from '@/components/theme-toggle';
import {trackEvent} from '@/lib/analytics/umami';
import {deriveJourney} from '@/lib/journey/progress';
import type {JourneyPathsData, JourneySection, JourneyStep, StepTarget} from '@/lib/journey/types';
import {useAuthGate} from '@/components/auth/auth-provider';
import {useJourneyStore} from '@/stores/journey-store';
import {useQuizStore, readStoredResults, buildMatchRequest} from '@/stores/quiz-store';
import {useUniStore} from '@/stores/uni-store';
import type {PathEntry} from '@/lib/careers/types';
import type {CareerMatch} from '@/lib/matcher';

type SlimCareer = {id: string; name: string; emoji: string; color: string};

type JourneyClientProps = {
  careers: SlimCareer[];
  paths: (PathEntry & {emoji?: string})[];
  journeyPaths: JourneyPathsData;
  locale: string;
};

const NODE_OFFSETS = [0, 36, 64, 36];

export default function JourneyClient({careers, paths, journeyPaths, locale}: JourneyClientProps) {
  const t = useTranslations('drum');
  const router = useRouter();
  const {savedPath} = useAuthGate();
  const savedCareerIds = useQuizStore((s) => s.savedCareerIds);
  const savedUniIds = useUniStore((s) => s.savedUniIds);
  const chosenCareerId = useJourneyStore((s) => s.chosenCareerId);
  const admissionViewedUniIds = useJourneyStore((s) => s.admissionViewedUniIds);
  const seenShareCard = useJourneyStore((s) => s.seenShareCard);
  const resetJourney = useJourneyStore((s) => s.resetJourney);
  const manual = useJourneyStore((s) => s.manual);
  const completeManualStep = useJourneyStore((s) => s.completeManualStep);
  const undoManualStep = useJourneyStore((s) => s.undoManualStep);
  const saveNote = useJourneyStore((s) => s.saveNote);

  const [mounted, setMounted] = useState(false);
  const [testsDone, setTestsDone] = useState({scenarii: false, vocational: false, personalitate: false});
  const [valuesDone, setValuesDone] = useState(false);
  const [topMatch, setTopMatch] = useState<SlimCareer | null>(null);
  const [nudgeId, setNudgeId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [noteSheet, setNoteSheet] = useState<{pathId: string; stepId: string; title: string} | null>(null);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load client-only inputs (test results + suggested objective) ──────────
  useEffect(() => {
    setMounted(true);
    trackEvent('journey_view');
    const stored = readStoredResults();
    // Deep tests count for their family: a student who only did the deep
    // variant must not stay blocked on the short one.
    setTestsDone({
      scenarii: Boolean(stored['scenarii']),
      vocational: Boolean(stored['vocational'] || stored['vocational-deep']),
      personalitate: Boolean(stored['personalitate'] || stored['ipip-neo-60']),
    });
    setValuesDone(Boolean(stored['valori']));
    if (!Object.values(stored).some(Boolean)) return;

    fetch('/api/match', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(buildMatchRequest(stored)),
    })
      .then((r) => r.json())
      .then((data: {matches?: CareerMatch[]}) => {
        const top = data.matches?.[0]?.career;
        if (top) setTopMatch({id: top.id, name: top.name, emoji: top.emoji, color: top.color});
      })
      .catch(() => undefined);
  }, []);

  // ── Derive the journey from real state ────────────────────────────────────
  const chosenCareer = useMemo(
    () => careers.find((c) => c.id === chosenCareerId) ?? null,
    [careers, chosenCareerId],
  );
  const pathId = savedPath?.path_id ?? null;
  const pathEntry = pathId ? paths.find((p) => p.id === pathId) ?? null : null;
  const pathName = savedPath?.path_name ?? pathEntry?.name ?? pathId;

  // "Checked admission" = opened the detail page of a uni that is (now) saved.
  const admissionChecked = useMemo(
    () => savedUniIds.some((id) => admissionViewedUniIds.includes(id)),
    [savedUniIds, admissionViewedUniIds],
  );

  const state = useMemo(
    () =>
      deriveJourney({
        testsDone,
        chosenCareer,
        topMatch,
        savedPath: pathId ? {id: pathId, name: pathName ?? null} : null,
        savedAltCount: savedCareerIds.filter((id) => id !== chosenCareerId).length,
        savedUniCount: savedUniIds.length,
        admissionChecked,
        seenShareCard,
        manual,
        pathConfig: pathId ? journeyPaths[pathId] ?? null : null,
        locale,
      }),
    [testsDone, chosenCareer, topMatch, pathId, pathName, savedCareerIds, chosenCareerId, savedUniIds, admissionChecked, seenShareCard, manual, journeyPaths, locale],
  );

  // ── Step interaction ───────────────────────────────────────────────────────
  const hrefFor = useCallback((target: StepTarget): string => {
    switch (target.kind) {
      case 'test': return `/${locale}/test/${target.slug}`;
      case 'browse': return `/${locale}/browse?section=${target.section}`;
      case 'career': return `/${locale}/cariera/${target.id}`;
      case 'share': return `/${locale}/profil#parent-share`;
      case 'manual': return '#';
    }
  }, [locale]);

  function showNudge(stepId: string) {
    if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    setNudgeId(stepId);
    nudgeTimer.current = setTimeout(() => setNudgeId(null), 1600);
  }

  function onStepTap(step: JourneyStep) {
    trackEvent('journey_step_click', {step: step.id, locked: step.locked, done: step.done});
    if (step.locked) {
      showNudge(step.id);
      return;
    }
    if (step.kind === 'manual' && step.target.kind === 'manual') {
      if (step.done) {
        setNoteSheet({pathId: step.target.pathId, stepId: step.target.stepId, title: step.title});
      } else {
        setExpandedId((prev) => (prev === step.id ? null : step.id));
      }
      return;
    }
    router.push(hrefFor(step.target));
  }

  function onMarkDone(step: JourneyStep) {
    if (step.target.kind !== 'manual') return;
    setNoteSheet({pathId: step.target.pathId, stepId: step.target.stepId, title: step.title});
  }

  function completeRealityStep(pathId: string, stepId: string) {
    completeManualStep(pathId, stepId);
    trackEvent('journey_manual_complete', {path: pathId, step: stepId});
    setExpandedId(null);
  }

  if (!mounted) {
    return (
      <main className="journeyPage">
        <section className="journeyCanvas">
          <p className="journeyLoading">{t('loading')}</p>
        </section>
        <BottomNav active="journey" locale={locale} />
      </main>
    );
  }

  const objective = state.objective;

  return (
    <main className="journeyPage">
      <section className="journeyCanvas">
        <header className="journeyHeader">
          <div>
            <h1>{t('title')}</h1>
            <p>{t('lead', {done: state.doneCount, total: state.totalCount})}</p>
          </div>
          <ThemeToggle />
        </header>

        {/* ── Objective + progress ── */}
        <section className="journeyObjectiveCard">
          <span className="journeyObjectiveLabel">{t('objectiveLabel')}</span>
          {objective ? (
            <div className="journeyObjectiveRow">
              <span className="journeyObjectiveEmoji" aria-hidden="true">{objective.emoji}</span>
              <span className="journeyObjectiveCopy">
                <strong>{objective.name}</strong>
                <small>{objective.chosen ? t('objectiveChosen') : t('objectiveSuggested')}</small>
              </span>
            </div>
          ) : (
            <p className="journeyObjectiveEmpty">{t('objectiveEmpty')}</p>
          )}
          <div className="journeyProgressRow">
            <div className="journeyProgressTrack" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.pct}>
              <div className="journeyProgressFill" style={{width: `${state.pct}%`}} />
            </div>
          </div>
        </section>

        {/* ── The path ── */}
        {state.sections.map((section, sectionIndex) => (
          <Fragment key={section.id}>
            <JourneySectionBlock
              expandedId={expandedId}
              locale={locale}
              nudgeId={nudgeId}
              onMarkDone={onMarkDone}
              onStepTap={onStepTap}
              pathName={pathName ?? null}
              section={section}
              sectionIndex={sectionIndex}
              t={t}
            />
            {/* Optional side-quest: „Valorile tale” — parallel to the chain,
                never locks anything, cosmetic XP (WORK-VALUES-PLAN §UI #2). */}
            {sectionIndex === 0 && !valuesDone ? (
              <Link
                className="journeyOptionalCard"
                href={`/${locale}/test/valori`}
                onClick={() => trackEvent('journey_step_click', {step: 'valori-optional', locked: false, done: false})}
              >
                <span className="journeyOptionalLabel">{t('optionalValuesLabel')}</span>
                <span className="journeyOptionalBody">
                  <strong>{t('optionalValuesTitle')}</strong>
                  <small>{t('optionalValuesSub')}</small>
                </span>
                <em className="journeyOptionalXp">{t('optionalValuesXp')}</em>
              </Link>
            ) : null}
          </Fragment>
        ))}

        {/* ── Finish line ── */}
        <div className="journeyFinishWrap">
          <div className={state.complete ? 'journeyFinish isDone' : 'journeyFinish'}>
            <strong>{state.complete ? t('finishDone') : t('finish')}</strong>
            <small>
              {state.complete
                ? t('finishDoneSub')
                : t('finishRemaining', {count: state.totalCount - state.doneCount})}
            </small>
          </div>
        </div>

        {/* ── Privacy: delete journal + journey progress (local-only data) ── */}
        <div className="journeyResetWrap">
          <button
            className="journeyResetBtn"
            onClick={() => {
              if (window.confirm(t('resetConfirm'))) {
                resetJourney();
                trackEvent('journey_reset');
              }
            }}
            type="button"
          >
            {t('resetLabel')}
          </button>
        </div>
      </section>

      {/* ── Impression note sheet ── */}
      {noteSheet ? (
        <NoteSheet
          locale={locale}
          onClose={() => setNoteSheet(null)}
          onCompleteWithoutNote={() => {
            completeRealityStep(noteSheet.pathId, noteSheet.stepId);
            setNoteSheet(null);
          }}
          onSave={(note) => {
            const key = `${noteSheet.pathId}:${noteSheet.stepId}`;
            if (!manual[key]) completeRealityStep(noteSheet.pathId, noteSheet.stepId);
            saveNote(noteSheet.pathId, noteSheet.stepId, note);
            trackEvent('journey_note_saved', {path: noteSheet.pathId, step: noteSheet.stepId, has_text: note.trim().length > 0});
            setNoteSheet(null);
          }}
          onUndo={() => {
            undoManualStep(noteSheet.pathId, noteSheet.stepId);
            trackEvent('journey_manual_undo', {path: noteSheet.pathId, step: noteSheet.stepId});
            setNoteSheet(null);
          }}
          sheet={noteSheet}
          t={t}
        />
      ) : null}

      <BottomNav active="journey" locale={locale} />
    </main>
  );
}

// ── Section block ─────────────────────────────────────────────────────────────

type DrumTFunc = ReturnType<typeof useTranslations<'drum'>>;

function JourneySectionBlock({
  expandedId, locale, nudgeId, onMarkDone, onStepTap, pathName, section, sectionIndex, t,
}: {
  expandedId: string | null;
  locale: string;
  nudgeId: string | null;
  onMarkDone: (step: JourneyStep) => void;
  onStepTap: (step: JourneyStep) => void;
  pathName: string | null;
  section: JourneySection;
  sectionIndex: number;
  t: DrumTFunc;
}) {
  return (
    <section className="journeySection">
      <div className="journeySectionLabel">
        <i aria-hidden="true" />
        <span>{t(section.titleKey)}</span>
        <i aria-hidden="true" />
      </div>

      {section.id === 's3' && section.gated ? (
        <div className="journeyGatedCard">
          <span aria-hidden="true">🔭</span>
          <strong>{t('realityGatedTitle')}</strong>
          <p>{t('realityGatedBody')}</p>
          <Link className="journeyGatedCta" href={`/${locale}/browse?section=paths`}>
            {t('realityGatedCta')}
          </Link>
        </div>
      ) : (
        <>
          {section.id === 's3' && pathName ? (
            <>
              <p className="journeyRealityLead">{t('realityLead', {path: pathName})}</p>
              <p className="journeySafetyNote">{t('realitySafety')}</p>
            </>
          ) : null}
          {section.steps.map((step, stepIndex) => (
            <JourneyStepRow
              expanded={expandedId === step.id}
              key={step.id}
              locale={locale}
              nudged={nudgeId === step.id}
              offset={NODE_OFFSETS[stepIndex % NODE_OFFSETS.length]}
              onMarkDone={onMarkDone}
              onTap={onStepTap}
              step={step}
              t={t}
            />
          ))}
        </>
      )}

      <div
        className={section.done ? 'journeyMilestone isDone' : 'journeyMilestone'}
        style={{transform: `rotate(${sectionIndex % 2 ? 0.6 : -0.6}deg)`}}
      >
        <span aria-hidden="true">{section.done ? '🏁' : '◌'}</span>
        <div>
          <small>{t('milestoneLabel', {n: sectionIndex + 1})}</small>
          <strong>{t(section.milestoneKey)}</strong>
        </div>
        {section.done ? <em>{t('milestoneUnlocked')}</em> : null}
      </div>
    </section>
  );
}

// ── Step row ──────────────────────────────────────────────────────────────────

function JourneyStepRow({
  expanded, locale, nudged, offset, onMarkDone, onTap, step, t,
}: {
  expanded: boolean;
  locale: string;
  nudged: boolean;
  offset: number;
  onMarkDone: (step: JourneyStep) => void;
  onTap: (step: JourneyStep) => void;
  step: JourneyStep;
  t: DrumTFunc;
}) {
  const isManual = step.kind === 'manual';
  const title = isManual ? step.title : t(step.title);
  const sub = nudged
    ? t('lockedNudge')
    : isManual
      ? step.sub
      : step.subLiteral ?? t(step.sub, step.subParams ?? {});

  const nodeClass = [
    'journeyNode',
    step.done ? 'isDone' : '',
    step.current ? 'isCurrent' : '',
    step.locked ? 'isLocked' : '',
    isManual ? 'isManual' : '',
  ].filter(Boolean).join(' ');

  const cardClass = [
    'journeyStepCard',
    step.done ? 'isDone' : '',
    step.current ? 'isCurrent' : '',
    step.locked ? 'isLocked' : '',
  ].filter(Boolean).join(' ');

  const ariaState = step.locked ? ` (${t('stepLockedAria')})` : '';
  const doneDate = step.entry
    ? new Date(step.entry.at).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-GB', {day: 'numeric', month: 'short'})
    : null;

  return (
    <div className="journeyStepRow" style={{marginLeft: offset}}>
      <button aria-label={`${title}${ariaState}`} className={nodeClass} onClick={() => onTap(step)} type="button">
        {step.done ? '✓' : step.locked ? '🔒' : step.emoji}
      </button>

      <div className="journeyStepBody">
        <button className={cardClass} onClick={() => onTap(step)} type="button">
          <span className="journeyStepHead">
            <strong>{title}</strong>
            {step.current && !step.done ? (
              <em className="journeyNowChip">{t('now')}</em>
            ) : null}
          </span>
          <span className="journeyStepSub">{sub}</span>
          {isManual && step.done ? (
            <span className="journeyStepNote">
              {step.entry?.note ? (
                <>
                  <q>{step.entry.note}</q>
                  <small>{t('realityDoneAt', {date: doneDate ?? ''})} · {t('noteEdit')}</small>
                </>
              ) : (
                <small>{t('realityDoneAt', {date: doneDate ?? ''})} · {t('noteAdd')}</small>
              )}
            </span>
          ) : null}
        </button>

        {isManual && !step.done && expanded ? (
          <div className="journeyManualPanel">
            {step.hint ? (
              <p><strong>{t('manualHintLabel')}</strong> {step.hint}</p>
            ) : null}
            <button className="journeyMarkDoneBtn" onClick={() => onMarkDone(step)} type="button">
              ✓ {t('markDone')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ── Impression note sheet ─────────────────────────────────────────────────────

function NoteSheet({
  locale, onClose, onCompleteWithoutNote, onSave, onUndo, sheet, t,
}: {
  locale: string;
  onClose: () => void;
  onCompleteWithoutNote: () => void;
  onSave: (note: string) => void;
  onUndo: () => void;
  sheet: {pathId: string; stepId: string; title: string};
  t: DrumTFunc;
}) {
  const entry = useJourneyStore((s) => s.manual[`${sheet.pathId}:${sheet.stepId}`]);
  const [draft, setDraft] = useState(entry?.note ?? '');
  void locale;

  return (
    <div className="journeySheetBackdrop" onClick={onClose} role="presentation">
      <section
        aria-label={t('noteTitle')}
        aria-modal="true"
        className="journeySheet"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <button aria-label={t('noteAriaClose')} className="journeySheetClose" onClick={onClose} type="button">×</button>
        <small className="journeySheetStep">{entry ? '✓' : '○'} {sheet.title}</small>
        <h2>{t('noteTitle')}</h2>
        <p>{t('noteLead')}</p>
        <textarea
          autoFocus
          maxLength={600}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('notePlaceholder')}
          rows={4}
          value={draft}
        />
        <div className="journeySheetActions">
          <button className="journeySheetSave" onClick={() => onSave(draft)} type="button">
            {entry ? t('noteSave') : t('noteSaveAndComplete')}
          </button>
          {!entry ? (
            <button className="journeySheetSkip" onClick={onCompleteWithoutNote} type="button">
              {t('noteCompleteWithoutNote')}
            </button>
          ) : null}
          <button className="journeySheetSkip" onClick={onClose} type="button">
            {t('noteSkip')}
          </button>
        </div>
        {entry ? (
          <button className="journeySheetUndo" onClick={onUndo} type="button">
            {t('noteUndo')}
          </button>
        ) : null}
      </section>
    </div>
  );
}
