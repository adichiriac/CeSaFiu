'use client';

/**
 * „Valorile tale” — O*NET Work Importance Locator card sort.
 *
 * Sequential UI (the 390px-safe variant from docs/WORK-VALUES-PLAN.md):
 * one card at a time, 5 column buttons with live counters, a full column
 * (4/4) locks, and a review board at the end lets the user swap two cards
 * before scoring. The forced distribution IS the instrument — keep it.
 */

import Link from 'next/link';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {recordReferralTestCompleted} from '@/lib/referrals/client';
import {trackEvent} from '@/lib/analytics/umami';
import {buildMatchRequest, readStoredResults} from '@/stores/quiz-store';
import ThemeToggle from '@/components/theme-toggle';
import {
  scoreWorkValues,
  toPercent,
  WORK_VALUE_KEYS,
  type WorkValuesAssignments,
  type WorkValuesDefinition,
  type WorkValueKey,
} from '@/lib/values/types';

const SLUG = 'valori';
const STORAGE_KEY = `cesafiu:test:${SLUG}:latest`;
const DRAFT_KEY = `cesafiu:test:${SLUG}:draft`;
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type ValuesClientProps = {
  brandCe: string;
  brandRest: string;
  locale: string;
  definition: WorkValuesDefinition;
};

type Phase = 'intro' | 'sort' | 'review' | 'result';

type Draft = {
  slug: string;
  assignments: WorkValuesAssignments;
  updatedAt: string;
};

type MatchEntry = {
  career: {id: string; name: string; emoji: string};
  score: number;
};

type RecalcState = {
  climbers: Array<{id: string; name: string; emoji: string; delta: number; score: number}>;
};

export default function ValuesClient({brandCe, brandRest, definition, locale}: ValuesClientProps) {
  const t = useTranslations('valori');
  const [phase, setPhase] = useState<Phase>('intro');
  const [assignments, setAssignments] = useState<WorkValuesAssignments>({});
  const [resumeDraft, setResumeDraft] = useState<Draft | null>(null);
  const [swapSource, setSwapSource] = useState<string | null>(null);
  const [recalc, setRecalc] = useState<RecalcState | null>(null);
  const startedRef = useRef(false);

  const items = definition.items;
  const total = items.length;
  const assignedCount = Object.keys(assignments).length;
  const currentItem = useMemo(
    () => items.find((item) => !(item.id in assignments)) ?? null,
    [items, assignments],
  );
  const currentIndex = Math.min(assignedCount, total - 1);
  const progress = Math.round((assignedCount / total) * 100);

  const columnCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const column of definition.columns) counts[column.points] = 0;
    for (const points of Object.values(assignments)) {
      counts[points] = (counts[points] ?? 0) + 1;
    }
    return counts;
  }, [assignments, definition.columns]);

  // ── Draft resilience (same pattern as questionnaire-client) ───────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as Draft;
      if (draft.slug !== SLUG) return;
      if (Date.now() - new Date(draft.updatedAt).getTime() > DRAFT_MAX_AGE_MS) {
        localStorage.removeItem(DRAFT_KEY);
        return;
      }
      const validIds = new Set(items.map((item) => item.id));
      const valid = Object.fromEntries(
        Object.entries(draft.assignments ?? {}).filter(([id]) => validIds.has(id)),
      );
      if (Object.keys(valid).length > 0) {
        setResumeDraft({...draft, assignments: valid});
      }
    } catch {
      // Draft persistence is best-effort.
    }
  }, []);

  useEffect(() => {
    if (phase === 'result' || assignedCount === 0) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({slug: SLUG, assignments, updatedAt: new Date().toISOString()}),
      );
    } catch {
      // best-effort
    }
  }, [assignments, assignedCount, phase]);

  // ── Actions ────────────────────────────────────────────────────────────────
  function start() {
    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent('values_start');
    }
    setPhase('sort');
  }

  function resumeFromDraft() {
    if (!resumeDraft) return;
    startedRef.current = true;
    setAssignments(resumeDraft.assignments);
    setResumeDraft(null);
    setPhase(Object.keys(resumeDraft.assignments).length >= total ? 'review' : 'sort');
  }

  function discardDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setResumeDraft(null);
  }

  function assign(points: number) {
    if (!currentItem) return;
    if ((columnCounts[points] ?? 0) >= definition.cardsPerColumn) return;
    if (typeof navigator !== 'undefined') navigator.vibrate?.(10);
    const next = {...assignments, [currentItem.id]: points};
    setAssignments(next);
    if (Object.keys(next).length >= total) {
      setPhase('review');
    }
  }

  function undoLast() {
    const ids = Object.keys(assignments);
    if (ids.length === 0) return;
    // Items are presented in definition order — the last assigned one is the
    // highest-index assigned item.
    const lastAssigned = [...items].reverse().find((item) => item.id in assignments);
    if (!lastAssigned) return;
    const next = {...assignments};
    delete next[lastAssigned.id];
    setAssignments(next);
    if (phase === 'review') setPhase('sort');
  }

  function toggleSwap(itemId: string) {
    if (swapSource === null) {
      setSwapSource(itemId);
      return;
    }
    if (swapSource === itemId) {
      setSwapSource(null);
      return;
    }
    const a = assignments[swapSource];
    const b = assignments[itemId];
    if (typeof a !== 'number' || typeof b !== 'number') {
      setSwapSource(null);
      return;
    }
    setAssignments({...assignments, [swapSource]: b, [itemId]: a});
    setSwapSource(null);
    if (typeof navigator !== 'undefined') navigator.vibrate?.(10);
  }

  function finish() {
    const scores = scoreWorkValues(definition, assignments);
    const percents = Object.fromEntries(
      WORK_VALUE_KEYS.map((key) => [key, toPercent(definition, scores[key])]),
    ) as Record<WorkValueKey, number>;

    const payload = {
      slug: SLUG,
      completedAt: new Date().toISOString(),
      answers: assignments,
      result: WORK_VALUE_KEYS.map((key) => ({key, score: percents[key]})).sort(
        (a, b) => b.score - a.score,
      ),
      workValuesRaw: scores,
      workValues: percents,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Local-only persistence is a convenience, not a blocker.
    }
    trackEvent('values_complete');
    void recordCompleted();
    void computeRecalc();
    setPhase('result');
  }

  /**
   * The visible matcher effect: re-score with vs. without the values vector
   * and surface the careers that climbed. Only meaningful when at least one
   * other test exists — with values alone there is no "before" to compare.
   */
  async function computeRecalc() {
    try {
      const stored = readStoredResults();
      const before = buildMatchRequest({...stored, valori: null});
      if (Object.keys(before).length === 0) return;
      const after = buildMatchRequest(stored);

      const [beforeRes, afterRes] = await Promise.all(
        [before, after].map((body) =>
          fetch('/api/match', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
          }).then((r) => r.json() as Promise<{matches: MatchEntry[]}>),
        ),
      );

      const beforeRank = new Map((beforeRes.matches ?? []).map((m, i) => [m.career.id, i]));
      const climbers = (afterRes.matches ?? [])
        .map((m, rank) => {
          const prev = beforeRank.get(m.career.id);
          return {
            id: m.career.id,
            name: m.career.name,
            emoji: m.career.emoji,
            score: m.score,
            rank,
            delta: typeof prev === 'number' ? prev - rank : 0,
          };
        })
        .filter((c) => c.delta > 0 && c.rank < 6)
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3);

      if (climbers.length > 0) {
        setRecalc({climbers});
        trackEvent('values_recalc_shown', {count: climbers.length});
      }
    } catch {
      // The reveal is a bonus, never a blocker for the result screen.
    }
  }

  function restart() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
    setAssignments({});
    setSwapSource(null);
    setRecalc(null);
    setPhase('sort');
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (resumeDraft) {
    const draftCount = Object.keys(resumeDraft.assignments).length;
    return (
      <Shell brandCe={brandCe} brandRest={brandRest} definition={definition} locale={locale} progress={Math.round((draftCount / total) * 100)} counter={`${Math.min(draftCount + 1, total)} / ${total}`}>
        <p className="testEyebrow">{t('resumeEyebrow')}</p>
        <h1>{t('resumeTitle')}</h1>
        <p className="localSaveNote">{t('resumeBody', {current: Math.min(draftCount + 1, total), total})}</p>
        <button className="button buttonPrimary" onClick={resumeFromDraft} style={{display: 'block', width: '100%', textAlign: 'center', marginBottom: 12}} type="button">
          {t('resumeContinue')}
        </button>
        <div className="testActions">
          <button className="button buttonSecondary" onClick={discardDraft} type="button">
            {t('resumeRestart')}
          </button>
          <Link className="button buttonSecondary" href={`/${locale}`}>
            {t('homeLabel')}
          </Link>
        </div>
      </Shell>
    );
  }

  if (phase === 'intro') {
    return (
      <Shell brandCe={brandCe} brandRest={brandRest} definition={definition} locale={locale} progress={0} counter={`0 / ${total}`}>
        <p className="testEyebrow">{t('eyebrow')}</p>
        <h1>{definition.name}</h1>
        <p className="valoriIntroLead">{t('introLead')}</p>
        <div className="valoriForcedNote">
          <strong>{t('forcedNoteTitle')}</strong>
          <p>{definition.forcedChoiceNote}</p>
        </div>
        <button className="button buttonPrimary" onClick={start} style={{display: 'block', width: '100%', textAlign: 'center', marginBottom: 12}} type="button">
          {t('startCTA')}
        </button>
        <div className="testActions">
          <Link className="button buttonSecondary" href={`/${locale}`}>
            {t('homeLabel')}
          </Link>
        </div>
        <p className="localSaveNote">{definition.disclaimer}</p>
      </Shell>
    );
  }

  if (phase === 'sort' && currentItem) {
    return (
      <Shell brandCe={brandCe} brandRest={brandRest} definition={definition} locale={locale} progress={progress} counter={`${currentIndex + 1} / ${total}`}>
        <p className="testEyebrow">{t('eyebrow')}</p>
        <p className="questionHint">{definition.framing}</p>
        <div className="valoriCard" key={currentItem.id}>
          <h1>{currentItem.text}</h1>
        </div>
        <div aria-label={t('columnsAria')} className="valoriColumns" role="group">
          {definition.columns.map((column) => {
            const count = columnCounts[column.points] ?? 0;
            const full = count >= definition.cardsPerColumn;
            return (
              <button
                className={full ? 'valoriColumnBtn isFull' : 'valoriColumnBtn'}
                disabled={full}
                key={column.points}
                onClick={() => assign(column.points)}
                type="button"
              >
                <strong>{column.label}</strong>
                <span className={full ? 'valoriColumnCount isFull' : 'valoriColumnCount'}>
                  {full ? t('columnFull') : `${count} / ${definition.cardsPerColumn}`}
                </span>
              </button>
            );
          })}
        </div>
        <div className="testActions">
          <button className="button buttonSecondary" disabled={assignedCount === 0} onClick={undoLast} type="button">
            {t('backLabel')}
          </button>
          <Link className="button buttonPrimary" href={`/${locale}`}>
            {t('homeLabel')}
          </Link>
        </div>
        <p className="autosaveNote">{t('autosaveNote')}</p>
      </Shell>
    );
  }

  if (phase === 'review') {
    return (
      <Shell brandCe={brandCe} brandRest={brandRest} definition={definition} locale={locale} progress={100} counter={`${total} / ${total}`}>
        <p className="testEyebrow">{t('reviewEyebrow')}</p>
        <h1>{t('reviewTitle')}</h1>
        <p className="questionHint">{t('reviewHint')}</p>
        <div className="valoriBoard">
          {definition.columns.map((column) => (
            <div className="valoriBoardColumn" key={column.points}>
              <div className="valoriBoardColumnHead">
                <strong>{column.label}</strong>
                <span>{t('columnPoints', {points: column.points})}</span>
              </div>
              {items
                .filter((item) => assignments[item.id] === column.points)
                .map((item) => (
                  <button
                    className={swapSource === item.id ? 'valoriBoardCard isPicked' : 'valoriBoardCard'}
                    key={item.id}
                    onClick={() => toggleSwap(item.id)}
                    type="button"
                  >
                    {item.text}
                  </button>
                ))}
            </div>
          ))}
        </div>
        {swapSource ? <p aria-live="polite" className="valoriSwapHint">{t('swapHint')}</p> : null}
        <button className="button buttonPrimary" onClick={finish} style={{display: 'block', width: '100%', textAlign: 'center', margin: '16px 0 12px'}} type="button">
          {t('finishCTA')}
        </button>
        <div className="testActions">
          <button className="button buttonSecondary" onClick={undoLast} type="button">
            {t('backLabel')}
          </button>
          <Link className="button buttonSecondary" href={`/${locale}`}>
            {t('homeLabel')}
          </Link>
        </div>
      </Shell>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  const scores = scoreWorkValues(definition, assignments);
  const ranked = WORK_VALUE_KEYS.map((key) => ({
    key,
    meta: definition.values[key],
    raw: scores[key],
    percent: toPercent(definition, scores[key]),
  })).sort((a, b) => b.raw - a.raw);
  const top2 = ranked.slice(0, 2);

  return (
    <Shell brandCe={brandCe} brandRest={brandRest} definition={definition} locale={locale} progress={100} counter={`${total} / ${total}`}>
      <p className="testEyebrow">{t('resultEyebrow')}</p>
      <h1>{t('resultTitle')}</h1>

      <div className="valoriTopValues">
        {top2.map((entry, index) => (
          <article className={index === 0 ? 'valoriTopValue isFirst' : 'valoriTopValue'} key={entry.key}>
            <span className="valoriTopRank">{index + 1}</span>
            <div>
              <strong>{entry.meta.name}</strong>
              <small>{entry.meta.short}</small>
              <p>{entry.meta.desc}</p>
            </div>
          </article>
        ))}
      </div>

      {recalc ? (
        <div className="valoriRecalcCard">
          <strong>{t('recalcTitle')}</strong>
          <p>{t('recalcBody', {count: recalc.climbers.length})}</p>
          <div className="valoriRecalcList">
            {recalc.climbers.map((climber) => (
              <div className="valoriRecalcRow" key={climber.id}>
                <span aria-hidden="true">{climber.emoji}</span>
                <b>{climber.name}</b>
                <em>{t('recalcUp', {delta: climber.delta})}</em>
                <i>{climber.score}%</i>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="valoriBars">
        {ranked.map((entry) => (
          <div className="valoriBarRow" key={entry.key}>
            <span className="valoriBarLabel">{entry.meta.name}</span>
            <div aria-label={`${entry.meta.name}: ${entry.raw} / ${definition.scoring.max}`} className="valoriBarTrack" role="img">
              <div className="valoriBarFill" style={{width: `${entry.percent}%`}} />
            </div>
            <b>{entry.raw}</b>
          </div>
        ))}
      </div>
      <p className="valoriScaleNote">{t('scaleNote', {min: definition.scoring.min, max: definition.scoring.max})}</p>

      <Link className="button buttonPrimary" href={`/${locale}/rezultate`} style={{display: 'block', textAlign: 'center', marginBottom: 12}}>
        {t('resultsCTA')}
      </Link>
      <div className="testActions">
        <button className="button buttonSecondary" onClick={restart} type="button">
          {t('restartLabel')}
        </button>
        <Link className="button buttonSecondary" href={`/${locale}`}>
          {t('homeLabel')}
        </Link>
      </div>

      <p className="localSaveNote">{t('saveNote')}</p>
      <p className="valoriAttribution">{definition.attribution}</p>
      <p className="valoriAttribution">{definition.disclaimer}</p>
    </Shell>
  );
}

// ── Shared shell (header + progress, same visual family as the other tests) ──

function Shell({
  brandCe,
  brandRest,
  children,
  counter,
  definition,
  locale,
  progress,
}: {
  brandCe: string;
  brandRest: string;
  children: React.ReactNode;
  counter: string;
  definition: WorkValuesDefinition;
  locale: string;
  progress: number;
}) {
  const t = useTranslations('valori');
  return (
    <main className="questionnairePage">
      <section className="questionnairePanel" aria-label={definition.name}>
        <header className="questionnaireHeader gameHeader">
          <div className="gameHeaderTop">
            <Link className="miniBrand" href={`/${locale}`}>
              <span>{brandCe}</span>
              <strong>{brandRest}</strong>
            </Link>
            <div className="gameHeaderActions">
              <ThemeToggle />
              <div className="gameCounterBadge">{counter}</div>
            </div>
          </div>
          <div className="gameMissionRow">
            <div className="gameMissionLeft">
              <span className="gameMissionLabel">
                <span aria-hidden="true" className="gamePulseDot" />
                {t('missionLabel')}
              </span>
              <span className="gamePercentage">{t('progressCompleted', {progress})}</span>
            </div>
          </div>
          <div aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} className="gameProgressTrack" role="progressbar">
            <div className="gameProgressFill" style={{width: `${progress}%`}}>
              <span aria-hidden="true" className="gameProgressShimmer" />
            </div>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

async function recordCompleted() {
  const supabase = getSupabaseBrowserClient();
  const {data} = supabase ? await supabase.auth.getSession() : {data: {session: null}};
  await recordReferralTestCompleted(SLUG, data.session?.access_token);
}
