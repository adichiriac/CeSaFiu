export type QuestionnaireSlug = 'scenarii' | 'personalitate' | 'ipip-neo-60' | 'vocational' | 'vocational-deep';

export type QuestionnaireKind = 'scenario' | 'likert' | 'choice';

export type ScenarioScore = Record<string, number>;

export type QuestionOption = {
  id: string;
  label: string;
  tag?: string;
  score?: ScenarioScore;
  code?: string;
  riasec?: string[];
  path?: string;
  traits?: string[];
  signals?: string[];
};

export type QuestionItem = {
  id: string;
  prompt: string;
  tag?: string;
  options: QuestionOption[];
  dim?: string;
  reverse?: boolean;
  signals?: string[];
};

export type ResultDimension = {
  key: string;
  title: string;
  short?: string;
  tagline?: string;
  description: string;
};

export type QuestionnaireDefinition = {
  slug: QuestionnaireSlug;
  kind: QuestionnaireKind;
  title: string;
  subtitle: string;
  eyebrow: string;
  backLabel: string;
  homeLabel: string;
  restartLabel: string;
  resultEyebrow: string;
  resultTitle: string;
  saveNote: string;
  questions: QuestionItem[];
  dimensions: Record<string, ResultDimension>;
};

export type QuestionnaireAnswer = string | number;
