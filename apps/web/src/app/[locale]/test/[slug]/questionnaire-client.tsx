'use client';

import type {
  QuestionItem,
  QuestionnaireAnswer,
  QuestionnaireDefinition,
  ResultDimension
} from '@/lib/questionnaires/types';
import Link from 'next/link';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {QuizAnswerOption} from '@/lib/matcher';
import {useRouter} from 'next/navigation';
import type {MouseEvent} from 'react';

type QuestionnaireClientProps = {
  brandCe: string;
  brandRest: string;
  locale: string;
  definition: QuestionnaireDefinition;
};

type RankedResult = ResultDimension & {
  score: number;
};

export default function QuestionnaireClient({brandCe, brandRest, definition, locale}: QuestionnaireClientProps) {
  const tQ = useTranslations('questionnaire');
  const router = useRouter();
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionnaireAnswer>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const question = definition.questions[questionIndex];
  const result = useMemo(() => computeResult(definition, answers), [answers, definition]);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / definition.questions.length) * 100);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    // For the 'scenarii' quiz we store the full option objects (with riasec/traits/signals)
    // so that /api/match can reconstruct the user profile server-side.
    // For all other quizzes we store the raw answers (option IDs or Likert numbers).
    let storedAnswers: Record<string, unknown> = answers;
    if (definition.slug === 'scenarii') {
      const fullOptions: Record<string, QuizAnswerOption> = {};
      for (const q of definition.questions) {
        const selectedId = answers[q.id] as string | undefined;
        if (!selectedId) continue;
        const opt = q.options.find((o) => o.id === selectedId);
        if (opt) {
          fullOptions[q.id] = {
            id: opt.id,
            label: opt.label,
            riasec: opt.riasec,
            path: opt.path,
            traits: opt.traits,
            signals: opt.signals,
          };
        }
      }
      storedAnswers = fullOptions;
    }

    const payload = {
      slug: definition.slug,
      completedAt: new Date().toISOString(),
      answers: storedAnswers,
      result: result.map(({key, score}) => ({key, score})),
      ...(definition.slug === 'vocational' ? computeVocationalLightPayload(definition, answers) : {}),
      ...(definition.slug === 'vocational-deep' ? computeVocationalDeepPayload(definition, answers) : {})
    };
    try {
      localStorage.setItem(`cesafiu:test:${definition.slug}:latest`, JSON.stringify(payload));
      if (definition.slug === 'scenarii') {
        router.push(`/${locale}/rezultate`);
      }
    } catch {
      // Local-only persistence is a convenience, not a blocker for seeing results.
    }
  }, [answers, definition.questions, definition.slug, isComplete, locale, result, router]);

  function choose(option: QuestionnaireAnswer, optionId: string) {
    if (isAdvancing) {
      return;
    }

    const nextAnswers = {...answers, [question.id]: option};
    setAnswers(nextAnswers);
    setPendingOptionId(optionId);
    setIsAdvancing(true);

    const isLast = questionIndex === definition.questions.length - 1;
    advanceTimerRef.current = setTimeout(() => {
      setIsAdvancing(false);
      setPendingOptionId(null);

      if (isLast) {
        setIsComplete(true);
        return;
      }

      setQuestionIndex((current) => current + 1);
    }, 260);
  }

  function goBack() {
    if (isAdvancing) {
      return;
    }

    if (isComplete) {
      setIsComplete(false);
      setQuestionIndex(definition.questions.length - 1);
      return;
    }

    if (questionIndex > 0) {
      setQuestionIndex((current) => current - 1);
    }
  }

  function restart() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    setAnswers({});
    setQuestionIndex(0);
    setIsComplete(false);
    setPendingOptionId(null);
    setIsAdvancing(false);
  }

  if (isComplete) {
    return (
      <main className="questionnairePage">
        <section className="questionnairePanel resultPanel" aria-labelledby="result-title">
          <QuestionnaireHeader brandCe={brandCe} brandRest={brandRest} definition={definition} locale={locale} progress={100} />
          <p className="testEyebrow">{definition.resultEyebrow}</p>
          <h1 id="result-title">{definition.resultTitle}</h1>
          <div className="resultList">
            {result.slice(0, 3).map((item, index) => (
              <article className="resultCard" key={item.key}>
                <span>{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.tagline ?? item.short}</p>
                  <p>{item.description}</p>
                </div>
                <b>{item.score}%</b>
              </article>
            ))}
          </div>
          <p className="localSaveNote">{definition.saveNote}</p>

          {/* Primary CTA: go to career results */}
          <Link
            className="button buttonPrimary"
            href={`/${locale}/rezultate`}
            style={{display: 'block', textAlign: 'center', marginBottom: 12}}
          >
            {tQ('resultsCTA')}
          </Link>

          <div className="testActions">
            <button className="button buttonSecondary" onClick={restart} type="button">
              {definition.restartLabel}
            </button>
            <Link className="button buttonSecondary" href={`/${locale}`}>
              {definition.homeLabel}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="questionnairePage">
      <section className="questionnairePanel" aria-labelledby="question-title">
        <QuestionnaireHeader brandCe={brandCe} brandRest={brandRest} definition={definition} locale={locale} progress={progress} />

        <div className={isAdvancing ? 'questionStage isAdvancing' : 'questionStage'}>
          <div className="questionMeta">
            <div className="questionMetaLabels">
              <p className="testEyebrow">{definition.eyebrow}</p>
              {question.tag ? <span className="questionTraitTag">{question.tag}</span> : null}
            </div>
            <span>
              {questionIndex + 1}/{definition.questions.length}
            </span>
          </div>

          <h1 id="question-title">{question.prompt}</h1>

          <div className={definition.kind === 'likert' ? 'likertOptions' : 'questionOptions'}>
            {question.options.map((option) => {
              const selected = isSelected(answers[question.id], option.id);
              const checked = isAdvancing && pendingOptionId === option.id;
              const optionClass = [
                'questionOption',
                selected ? 'isSelected' : '',
                isAdvancing ? 'isLocked' : '',
                checked ? 'isChecked' : ''
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  className={optionClass}
                  disabled={isAdvancing}
                  key={option.id}
                  onClick={() => choose(definition.kind === 'likert' ? Number(option.id) : option.id, option.id)}
                  type="button"
                >
                  <span>{option.id.toUpperCase()}</span>
                  <div className="questionOptionBody">
                    <strong>{option.label}</strong>
                    {option.tag ? <small className="questionOptionTag">{option.tag}</small> : null}
                  </div>
                  {checked ? <i aria-hidden="true" className="questionOptionCheck">✓</i> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="testActions">
          <button className="button buttonSecondary" disabled={questionIndex === 0 || isAdvancing} onClick={goBack} type="button">
            {definition.backLabel}
          </button>
          <Link
            aria-disabled={isAdvancing}
            className="button buttonPrimary"
            href={`/${locale}`}
            onClick={(event) => preventWhileAdvancing(event, isAdvancing)}
          >
            {definition.homeLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}

function QuestionnaireHeader({
  brandCe,
  brandRest,
  definition,
  locale,
  progress
}: {
  brandCe: string;
  brandRest: string;
  definition: QuestionnaireDefinition;
  locale: string;
  progress: number;
}) {
  return (
    <header className="questionnaireHeader">
      <Link className="miniBrand" href={`/${locale}`}>
        <span>{brandCe}</span>
        <strong>{brandRest}</strong>
      </Link>
      <div className="testProgress" aria-label={definition.subtitle}>
        <div style={{width: `${progress}%`}} />
      </div>
      <p>{definition.subtitle}</p>
    </header>
  );
}

function isSelected(current: QuestionnaireAnswer | undefined, optionId: string) {
  return String(current) === optionId;
}

function computeResult(definition: QuestionnaireDefinition, answers: Record<string, QuestionnaireAnswer>): RankedResult[] {
  if (definition.kind === 'likert') {
    return computeLikertResult(definition, answers);
  }

  if (definition.kind === 'choice') {
    return computeChoiceResult(definition, answers);
  }

  return computeScenarioResult(definition, answers);
}

function computeScenarioResult(
  definition: QuestionnaireDefinition,
  answers: Record<string, QuestionnaireAnswer>
): RankedResult[] {
  const scores = Object.fromEntries(Object.keys(definition.dimensions).map((key) => [key, 0]));
  let total = 0;

  for (const question of definition.questions) {
    const selected = findSelectedOption(question, answers[question.id]);
    if (!selected?.score) {
      continue;
    }

    for (const [key, value] of Object.entries(selected.score)) {
      scores[key] = (scores[key] ?? 0) + value;
      total += value;
    }
  }

  return rankScores(definition, scores, Math.max(total, 1));
}

function computeChoiceResult(
  definition: QuestionnaireDefinition,
  answers: Record<string, QuestionnaireAnswer>
): RankedResult[] {
  const scores = Object.fromEntries(Object.keys(definition.dimensions).map((key) => [key, 0]));

  for (const question of definition.questions) {
    const selected = findSelectedOption(question, answers[question.id]);
    if (selected?.code) {
      scores[selected.code] = (scores[selected.code] ?? 0) + 1;
    }
  }

  return rankScores(definition, scores, definition.questions.length);
}

function computeLikertResult(
  definition: QuestionnaireDefinition,
  answers: Record<string, QuestionnaireAnswer>
): RankedResult[] {
  const sums = Object.fromEntries(Object.keys(definition.dimensions).map((key) => [key, 0]));
  const counts = Object.fromEntries(Object.keys(definition.dimensions).map((key) => [key, 0]));

  for (const question of definition.questions) {
    if (!question.dim) {
      continue;
    }

    const raw = Number(answers[question.id] ?? 3);
    const value = question.reverse ? 6 - raw : raw;
    sums[question.dim] = (sums[question.dim] ?? 0) + value;
    counts[question.dim] = (counts[question.dim] ?? 0) + 1;
  }

  return Object.entries(definition.dimensions)
    .map(([key, dimension]) => ({
      ...dimension,
      score: Math.round(((sums[key] ?? 0) / Math.max((counts[key] ?? 1) * 5, 1)) * 100)
    }))
    .sort((a, b) => b.score - a.score);
}

function computeVocationalLightPayload(
  definition: QuestionnaireDefinition,
  answers: Record<string, QuestionnaireAnswer>
): {
  vocationalRaw: Record<string, number>;
  vocationalSignalsRaw: Record<string, number>;
} {
  const raw: Record<string, number> = {R: 0, I: 0, A: 0, S: 0, E: 0, C: 0};
  const signalsRaw: Record<string, number> = {};

  for (const question of definition.questions) {
    if (!question.dim) {
      continue;
    }

    const value = Number(answers[question.id] ?? 3);
    raw[question.dim] = (raw[question.dim] ?? 0) + value;

    if (Array.isArray(question.signals) && value > 3) {
      for (const signal of question.signals) {
        signalsRaw[signal] = (signalsRaw[signal] ?? 0) + (value - 3);
      }
    }
  }

  return {
    vocationalRaw: raw,
    vocationalSignalsRaw: signalsRaw
  };
}

function computeVocationalDeepPayload(
  definition: QuestionnaireDefinition,
  answers: Record<string, QuestionnaireAnswer>
): {
  vocationalDeepRaw: Record<string, number>;
  vocationalDeepSignalsRaw: Record<string, number>;
} {
  const sums: Record<string, number> = {R: 0, I: 0, A: 0, S: 0, E: 0, C: 0};
  const counts: Record<string, number> = {R: 0, I: 0, A: 0, S: 0, E: 0, C: 0};
  const signalsRaw: Record<string, number> = {};

  for (const question of definition.questions) {
    if (!question.dim) {
      continue;
    }

    const value = Number(answers[question.id] ?? 3);
    sums[question.dim] = (sums[question.dim] ?? 0) + value;
    counts[question.dim] = (counts[question.dim] ?? 0) + 1;

    if (Array.isArray(question.signals) && value > 3) {
      for (const signal of question.signals) {
        signalsRaw[signal] = (signalsRaw[signal] ?? 0) + (value - 3);
      }
    }
  }

  const raw = Object.fromEntries(
    Object.keys(sums).map((key) => [
      key,
      counts[key] > 0 ? Number((sums[key] / counts[key]).toFixed(3)) : 3
    ])
  );

  return {
    vocationalDeepRaw: raw,
    vocationalDeepSignalsRaw: signalsRaw
  };
}

function rankScores(
  definition: QuestionnaireDefinition,
  scores: Record<string, number>,
  denominator: number
): RankedResult[] {
  return Object.entries(definition.dimensions)
    .map(([key, dimension]) => ({
      ...dimension,
      score: Math.round(((scores[key] ?? 0) / denominator) * 100)
    }))
    .sort((a, b) => b.score - a.score);
}

function findSelectedOption(question: QuestionItem, answer: QuestionnaireAnswer | undefined) {
  return question.options.find((option) => option.id === String(answer));
}

function preventWhileAdvancing(event: MouseEvent<HTMLAnchorElement>, isAdvancing: boolean) {
  if (isAdvancing) {
    event.preventDefault();
  }
}
