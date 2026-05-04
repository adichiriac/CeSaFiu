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
  code: string;
  text: string;
  signals?: string[];
};

type PrototypeVocationalDeepItem = {
  id: string;
  code: string;
  text: string;
  signals?: string[];
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

type PrototypeVocationalDeepData = {
  vocational: {
    codes: Record<string, {name: string; short: string; desc: string}>;
  };
  vocationalDeep: {
    name: string;
    subtitle: string;
    items: PrototypeVocationalDeepItem[];
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
  tag?: string;
  opts: Array<{
    t: string;
    s: Record<string, number>;
    m?: {
      riasec?: string[];
      path?: string;
      traits?: string[];
      signals?: string[];
    };
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

const scenarioMatcherProfiles: Record<
  string,
  {
    riasec: string[];
    path: string;
    traits: string[];
    signals: string[];
  }
> = {
  constructor: {
    riasec: ['R', 'I'],
    path: 'profesional',
    traits: ['build', 'tech'],
    signals: ['technical.mechanical', 'technical.systems', 'practical.repair']
  },
  analist: {
    riasec: ['I', 'C'],
    path: 'facultate',
    traits: ['analyze', 'tech'],
    signals: ['investigative.data', 'investigative.research', 'investigative.diagnostic']
  },
  ajutor: {
    riasec: ['S', 'A'],
    path: 'facultate',
    traits: ['social', 'analyze'],
    signals: ['social.care', 'social.teaching', 'social.counseling']
  },
  creator: {
    riasec: ['A', 'E'],
    path: 'creator',
    traits: ['create', 'visual'],
    signals: ['creative.visual', 'creative.video', 'creative.writing']
  },
  leader: {
    riasec: ['E', 'S'],
    path: 'antreprenor',
    traits: ['lead', 'social'],
    signals: ['business.operations', 'business.entrepreneurship', 'business.marketing']
  },
  explorator: {
    riasec: ['I', 'A'],
    path: 'mixt',
    traits: ['analyze', 'create'],
    signals: ['investigative.research', 'creative.writing', 'technical.software']
  }
};

const scenarioOptionTags: Record<string, string> = {
  constructor: '#BUILDER',
  analist: '#THINKER',
  ajutor: '#ALLY',
  creator: '#CREATOR',
  leader: '#LEADER',
  explorator: '#EXPLORER'
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

  if (slug === 'vocational') {
    return buildVocationalShortQuestionnaire(readPhase1VocationalData());
  }

  if (slug === 'vocational-deep') {
    return buildVocationalDeepQuestionnaire(readVocationalDeepData());
  }

  return null;
}

function buildVocationalShortQuestionnaire(source: PrototypeData['vocational']): QuestionnaireDefinition {
  return {
    slug: 'vocational',
    kind: 'likert',
    title: 'Vocațional (scurt)',
    subtitle: 'Cod Holland · 20 itemi · 4 min',
    eyebrow: 'Vocațional · Cod Holland',
    ...sharedCopy,
    questions: source.items.map((item) => ({
      id: item.id,
      prompt: item.text,
      dim: item.code,
      signals: item.signals,
      options: [
        {id: '1', label: 'Foarte puțin'},
        {id: '2', label: 'Puțin'},
        {id: '3', label: 'Indiferent'},
        {id: '4', label: 'Mult'},
        {id: '5', label: 'Foarte mult'}
      ]
    })),
    dimensions: Object.fromEntries(
      Object.entries(source.codes).map(([key, value]) => [
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

function buildVocationalDeepQuestionnaire(source: PrototypeVocationalDeepData): QuestionnaireDefinition {
  return {
    slug: 'vocational-deep',
    kind: 'likert',
    title: 'Vocațional complet',
    subtitle: 'O*NET · 60 itemi · 8-10 min',
    eyebrow: 'O*NET · Vocațional complet',
    ...sharedCopy,
    questions: source.vocationalDeep.items.map((item) => ({
      id: item.id,
      prompt: item.text,
      dim: item.code,
      signals: item.signals,
      options: [
        {id: '1', label: 'Foarte puțin'},
        {id: '2', label: 'Puțin'},
        {id: '3', label: 'Indiferent'},
        {id: '4', label: 'Mult'},
        {id: '5', label: 'Foarte mult'}
      ]
    })),
    dimensions: Object.fromEntries(
      Object.entries(source.vocational.codes).map(([key, value]) => [
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
      tag: question.tag,
      options: question.opts.map((option, optionIndex) => {
        const matcherSignals = option.m ?? buildScenarioMatcherSignals(option.s);
        return {
          id: String.fromCharCode(97 + optionIndex),
          label: option.t,
          tag: buildScenarioOptionTag(option.s),
          score: option.s,
          ...matcherSignals
        };
      })
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

function readPhase1VocationalData(): PrototypeData['vocational'] {
  const file = path.join(rootDir, 'cesafiu_prototype_v3/project/data.js');
  const code = readFileSync(file, 'utf8');
  const context = {window: {} as {QUIZ_DATA?: PrototypeData}};
  vm.runInNewContext(code, context, {filename: file});

  if (!context.window.QUIZ_DATA?.vocational) {
    throw new Error('Failed to load Phase 1 public vocational questionnaire data.');
  }

  return context.window.QUIZ_DATA.vocational;
}

function readVocationalDeepData(): PrototypeVocationalDeepData {
  const file = path.join(rootDir, 'cesafiu_prototype_v3/project/data.js');
  const code = readFileSync(file, 'utf8');
  const context = {window: {} as {QUIZ_DATA?: PrototypeVocationalDeepData}};
  vm.runInNewContext(code, context, {filename: file});

  if (!context.window.QUIZ_DATA?.vocationalDeep || !context.window.QUIZ_DATA?.vocational?.codes) {
    throw new Error('Failed to load full vocational questionnaire data.');
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
  return slug === 'scenarii' || slug === 'personalitate' || slug === 'ipip-neo-60' || slug === 'vocational' || slug === 'vocational-deep';
}

function buildScenarioMatcherSignals(scores: Record<string, number>) {
  const ranked = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => scenarioMatcherProfiles[key])
    .filter(Boolean);

  const primary = ranked[0];
  const secondary = ranked[1];

  return {
    riasec: unique([...(primary?.riasec ?? []), ...(secondary?.riasec ?? [])]),
    path: primary?.path,
    traits: unique([...(primary?.traits ?? []), ...(secondary?.traits ?? [])]),
    signals: unique([...(primary?.signals ?? []), ...(secondary?.signals ?? [])])
  };
}

function buildScenarioOptionTag(scores: Record<string, number>) {
  const primary = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];
  return primary ? scenarioOptionTags[primary] : undefined;
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
