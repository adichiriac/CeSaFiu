'use client';

import type {
  QuestionItem,
  QuestionnaireAnswer,
  QuestionnaireDefinition,
  ResultDimension
} from '@/lib/questionnaires/types';
import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';

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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuestionnaireAnswer>>({});
  const [isComplete, setIsComplete] = useState(false);
  const question = definition.questions[questionIndex];
  const result = useMemo(() => computeResult(definition, answers), [answers, definition]);
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / definition.questions.length) * 100);

  useEffect(() => {
    if (!isComplete) {
      return;
    }

    const payload = {
      slug: definition.slug,
      completedAt: new Date().toISOString(),
      answers,
      result: result.map(({key, score}) => ({key, score}))
    };
    try {
      localStorage.setItem(`cesafiu:test:${definition.slug}:latest`, JSON.stringify(payload));
    } catch {
      // Local-only persistence is a convenience, not a blocker for seeing results.
    }
  }, [answers, definition.slug, isComplete, result]);

  function choose(option: QuestionnaireAnswer) {
    const nextAnswers = {...answers, [question.id]: option};
    setAnswers(nextAnswers);

    if (questionIndex === definition.questions.length - 1) {
      setIsComplete(true);
      return;
    }

    setQuestionIndex((current) => current + 1);
  }

  function goBack() {
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
    setAnswers({});
    setQuestionIndex(0);
    setIsComplete(false);
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
          <div className="testActions">
            <button className="button buttonSecondary" onClick={restart} type="button">
              {definition.restartLabel}
            </button>
            <Link className="button buttonPrimary" href={`/${locale}`}>
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

        <div className="questionMeta">
          <p className="testEyebrow">{definition.eyebrow}</p>
          <span>
            {questionIndex + 1}/{definition.questions.length}
          </span>
        </div>

        <h1 id="question-title">{question.prompt}</h1>

        <div className={definition.kind === 'likert' ? 'likertOptions' : 'questionOptions'}>
          {question.options.map((option) => (
            <button
              className={isSelected(answers[question.id], option.id) ? 'questionOption isSelected' : 'questionOption'}
              key={option.id}
              onClick={() => choose(definition.kind === 'likert' ? Number(option.id) : option.id)}
              type="button"
            >
              <span>{option.id.toUpperCase()}</span>
              <strong>{option.label}</strong>
            </button>
          ))}
        </div>

        <div className="testActions">
          <button className="button buttonSecondary" disabled={questionIndex === 0} onClick={goBack} type="button">
            {definition.backLabel}
          </button>
          <Link className="button buttonPrimary" href={`/${locale}`}>
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
  return question.options.find((option) => option.id === answer);
}
