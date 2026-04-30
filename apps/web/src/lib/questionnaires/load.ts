import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import type {QuestionnaireDefinition, QuestionnaireSlug} from './types';

type PrototypeBig5Item = {
  id: string;
  dim: string;
  text: string;
  r?: boolean;
};

type PrototypeVocationalItem = {
  id: string;
  a: {
    text: string;
    code: string;
  };
  b: {
    text: string;
    code: string;
  };
};

type PrototypeData = {
  personality: {
    name: string;
    subtitle: string;
    items: PrototypeBig5Item[];
    dimensions: Record<string, {name: string; short: string; high: string; low: string}>;
  };
  ipipNeo60: PrototypeData['personality'];
  vocational: {
    name: string;
    subtitle: string;
    items: PrototypeVocationalItem[];
    codes: Record<string, {name: string; short: string; desc: string}>;
  };
};

type ScenarioArchetype = {
  title: string;
  share: string;
  tagline: string;
  desc: string;
};

type ScenarioQuestion = {
  q: string;
  opts: Array<{
    t: string;
    s: Record<string, number>;
  }>;
};

const rootDir = path.resolve(process.cwd(), '../..');

const sharedCopy = {
  backLabel: 'Înapoi',
  homeLabel: 'Landing',
  restartLabel: 'Refă testul',
  resultEyebrow: 'Rezultat local',
  resultTitle: 'Ce iese din răspunsurile tale',
  saveNote: 'Rezultatul este salvat doar local, în browserul tău.'
};

export function getQuestionnaire(slug: string): QuestionnaireDefinition | null {
  if (!isQuestionnaireSlug(slug)) {
    return null;
  }

  if (slug === 'scenarii') {
    return getScenarioQuestionnaire();
  }

  const prototypeData = readPrototypeData();

  if (slug === 'personalitate') {
    return buildBig5Questionnaire(slug, prototypeData.personality, {
      title: 'Personalitate (scurt)',
      subtitle: 'Big Five · 15 itemi · 4 min',
      eyebrow: 'Test personalitate'
    });
  }

  if (slug === 'ipip-neo-60') {
    return buildBig5Questionnaire(slug, prototypeData.ipipNeo60, {
      title: 'IPIP-NEO-60',
      subtitle: 'Validat științific · 60 itemi · 12 min',
      eyebrow: 'IPIP-NEO-60 · Big Five'
    });
  }

  return {
    slug,
    kind: 'choice',
    title: 'Vocațional',
    subtitle: 'Holland · 5 min',
    eyebrow: 'Vocațional · Holland',
    ...sharedCopy,
    questions: prototypeData.vocational.items.map((item) => ({
      id: item.id,
      prompt: 'Care îți sună mai distractiv?',
      options: [
        {id: 'a', label: item.a.text, code: item.a.code},
        {id: 'b', label: item.b.text, code: item.b.code}
      ]
    })),
    dimensions: Object.fromEntries(
      Object.entries(prototypeData.vocational.codes).map(([key, value]) => [
        key,
        {
          key,
          title: value.name,
          short: value.short,
          tagline: value.short,
          description: value.desc
        }
      ])
    )
  };
}

function buildBig5Questionnaire(
  slug: 'personalitate' | 'ipip-neo-60',
  source: PrototypeData['personality'],
  labels: Pick<QuestionnaireDefinition, 'title' | 'subtitle' | 'eyebrow'>
): QuestionnaireDefinition {
  return {
    slug,
    kind: 'likert',
    ...labels,
    ...sharedCopy,
    questions: source.items.map((item) => ({
      id: item.id,
      prompt: item.text,
      dim: item.dim,
      reverse: Boolean(item.r),
      options: [
        {id: '1', label: 'Total fals'},
        {id: '2', label: 'Cam fals'},
        {id: '3', label: 'Neutru'},
        {id: '4', label: 'Cam adevărat'},
        {id: '5', label: 'Total adevărat'}
      ]
    })),
    dimensions: Object.fromEntries(
      Object.entries(source.dimensions).map(([key, value]) => [
        key,
        {
          key,
          title: value.name,
          short: value.short,
          tagline: value.high,
          description: `${value.high} Dacă scorul e mai jos, profilul tău se duce mai mult spre: ${value.low}`
        }
      ])
    )
  };
}

function getScenarioQuestionnaire(): QuestionnaireDefinition {
  const source = readScenarioData();

  return {
    slug: 'scenarii',
    kind: 'scenario',
    title: 'Scenarii reale',
    subtitle: 'Pilot winner · 12 situații · 5 min',
    eyebrow: 'Pilot winner · Varianta 1',
    ...sharedCopy,
    questions: source.questions.map((question, questionIndex) => ({
      id: `s${questionIndex + 1}`,
      prompt: question.q,
      options: question.opts.map((option, optionIndex) => ({
        id: String.fromCharCode(97 + optionIndex),
        label: option.t,
        score: option.s
      }))
    })),
    dimensions: Object.fromEntries(
      Object.entries(source.archetypes).map(([key, value]) => [
        key,
        {
          key,
          title: value.title,
          short: value.share,
          tagline: value.tagline,
          description: value.desc
        }
      ])
    )
  };
}

function readPrototypeData(): PrototypeData {
  const file = path.join(rootDir, 'cesafiu_prototype_v2/data.js');
  const code = readFileSync(file, 'utf8');
  const context = {window: {} as {QUIZ_DATA?: PrototypeData}};
  vm.runInNewContext(code, context, {filename: file});

  if (!context.window.QUIZ_DATA) {
    throw new Error('Failed to load prototype questionnaire data.');
  }

  return context.window.QUIZ_DATA;
}

function readScenarioData(): {archetypes: Record<string, ScenarioArchetype>; questions: ScenarioQuestion[]} {
  const file = path.join(rootDir, 'quiz-a.html');
  const html = readFileSync(file, 'utf8');
  const archetypes = extractConst<Record<string, ScenarioArchetype>>(html, 'ARCHETYPES');
  const questions = extractConst<ScenarioQuestion[]>(html, 'QUESTIONS');
  return {archetypes, questions};
}

function extractConst<T>(source: string, name: string): T {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Missing ${name} in quiz-a.html`);
  }

  const valueStart = start + marker.length;
  const valueEnd = source.indexOf('\n};', valueStart);
  const arrayEnd = source.indexOf('\n];', valueStart);
  const end = name === 'QUESTIONS' ? arrayEnd + 2 : valueEnd + 2;
  const expression = source.slice(valueStart, end);
  const context = {result: undefined as T | undefined};
  vm.runInNewContext(`result = ${expression}`, context);

  if (!context.result) {
    throw new Error(`Failed to parse ${name}`);
  }

  return context.result;
}

function isQuestionnaireSlug(slug: string): slug is QuestionnaireSlug {
  return slug === 'scenarii' || slug === 'personalitate' || slug === 'ipip-neo-60' || slug === 'vocational';
}
