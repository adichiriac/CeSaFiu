/**
 * Ce Să Fiu? — Career match scoring algorithm
 *
 * TypeScript port of the scoring engine from cesafiu_prototype_v3/project/app.jsx.
 * Multi-axis cosine similarity across five signal sources:
 *   1. RIASEC (Holland Code)     — strongest validated career-matching framework
 *   2. Path-type bias            — facultate / autodidact / antreprenor / etc.
 *   3. Traits (7-bucket legacy)  — build/tech/analyze/social/lead/create/visual
 *   4. Signals (concrete activity families: software, care, visual, sales...)
 *   5. Big Five (personality)    — added when personality/IPIP-NEO-60 taken
 *
 * Honest 0-100 mapping — no floor compression.
 * Top-N diversified via MMR so the user doesn't see four near-clones of #1.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

export const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'] as const;
export const PATH_KEYS = [
  'facultate',
  'autodidact',
  'antreprenor',
  'profesional',
  'freelance',
  'creator',
  'mixt',
] as const;
export const TRAIT_KEYS = ['build', 'tech', 'analyze', 'social', 'lead', 'create', 'visual'] as const;
export const SIGNAL_KEYS = [
  'creative.visual', 'creative.writing', 'creative.music', 'creative.video',
  'creative.performance', 'creative.craft', 'creative.game',
  'technical.software', 'technical.hardware', 'technical.mechanical',
  'technical.electrical', 'technical.construction', 'technical.energy', 'technical.systems',
  'investigative.data', 'investigative.science', 'investigative.lab',
  'investigative.diagnostic', 'investigative.research', 'investigative.security',
  'social.teaching', 'social.care', 'social.counseling', 'social.community',
  'social.customer', 'social.coaching',
  'business.sales', 'business.marketing', 'business.entrepreneurship',
  'business.product', 'business.finance', 'business.operations', 'business.negotiation',
  'order.admin', 'order.compliance', 'order.quality', 'order.procurement',
  'order.logistics', 'order.documentation', 'order.law_enforcement',
  'practical.repair', 'practical.install', 'practical.food', 'practical.beauty',
  'practical.transport', 'practical.agriculture', 'practical.manual_craft',
  'health.clinical', 'health.nursing', 'health.dental', 'health.pharma',
  'health.therapy', 'health.emergency',
] as const;
export const BIG5_KEYS = ['O', 'C', 'E', 'A', 'N', 'S'] as const;

export type RiasecKey = typeof RIASEC_KEYS[number];
export type PathKey = typeof PATH_KEYS[number];
export type TraitKey = typeof TRAIT_KEYS[number];
export type SignalKey = typeof SIGNAL_KEYS[number];
export type Big5Key = typeof BIG5_KEYS[number];

export type Tally = Record<string, number>;

export type UserProfile = {
  riasec: Tally;
  paths: Tally;
  traits: Tally;
  big5: Tally;
  signals: Tally;
  sources: string[];
};

export type CareerProfile = {
  riasec: Tally;
  paths: Tally;
  traits: Tally;
  big5: Tally;
  signals: Tally;
};

export type Weights = {
  riasec: number;
  paths: number;
  traits: number;
  signals: number;
  big5: number;
};

export type MatchExplanation = {
  text: string;
  axes: {
    riasec: number;
    paths: number;
    traits: number;
    signals: number;
    big5: number | null;
  };
  riasecHit: string[];
  pathHit: boolean;
};

export type CareerMatch = {
  career: Career;
  score: number;
  why: MatchExplanation | string;
};

export type MatchResult = CareerMatch[] & {
  confidence: number;
  sources: string[];
  userProfile: UserProfile;
  nextTest: NextTestSuggestion | null;
};

export type NextTestSuggestion = {
  kind: 'vocational' | 'vocational-deep' | 'personality' | 'ipip-neo' | 'quick';
  reason: string;
};

/** The career shape as it comes from data.js (prototype). */
export type Career = {
  id: string;
  name: string;
  tagline: string;
  color: string;
  emoji: string;
  pathType: string;
  traits: string[];
  riasec: string[];
  big5: string[];
  signals?: string[];
  salary: string;
  demand: string;
  vibe: string;
  description: string;
  day: string[];
  skills: string[];
  paths: string[];
  schools?: string[];
};

/** Answer option from a scenario quiz question. */
export type QuizAnswerOption = {
  id: string;
  label?: string;
  riasec?: string[];
  path?: string;
  traits?: string[];
  signals?: string[];
};

/** Deep scores from personality/IPIP-NEO-60 tests (percentage 0-100 per Big5 dimension). */
export type Big5Scores = Record<string, number>;

/** Vocational/Holland scores. */
export type VocationalScores = {
  raw: Record<string, number>;
  signalsRaw?: Record<string, number>;
};

/** Full input to computeMatches. */
export type MatchInput = {
  /** Scenario quiz answers: questionId → full option object */
  answers: Record<string, QuizAnswerOption>;
  careers: Career[];
  deepScores?: {
    personality?: Big5Scores;
    ipipNeo60?: Big5Scores;
    vocational?: VocationalScores;
    vocationalDeep?: VocationalScores;
  };
};

// Vocational scaling constants (matches prototype)
const VOCATIONAL_LIGHT_CENTER = 9;
const VOCATIONAL_LIGHT_SCALE = 1.5;

// ── Math helpers ──────────────────────────────────────────────────────────────

function vecFromTallyKeys(tally: Tally, keys: readonly string[]): number[] {
  return keys.map((k) => tally[k] ?? 0);
}

function l2(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}

function cosine(a: number[], b: number[]): number {
  const na = l2(a);
  const nb = l2(b);
  if (na === 0 || nb === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot / (na * nb);
}

function addSignals(tally: Tally, signals: string[] | undefined, weight: number): void {
  (signals ?? []).forEach((signal) => {
    if (!(SIGNAL_KEYS as readonly string[]).includes(signal)) return;
    tally[signal] = (tally[signal] ?? 0) + weight;
  });
}

// ── Career signal inference ────────────────────────────────────────────────────

export function inferCareerSignals(career: Career): string[] {
  const signals = new Set<string>(career.signals ?? []);
  const haystack = [
    career.id, career.name, career.tagline, career.vibe, career.description,
    ...(career.skills ?? []), ...(career.paths ?? []), ...(career.schools ?? []),
  ].join(' ').toLowerCase();

  const add = (...items: string[]) => items.forEach((item) => signals.add(item));

  if (/software|developer|program|cod|mobile|devops|sysadmin|qa|tester|cloud|it support|network|sdet|github/.test(haystack)) add('technical.software', 'technical.systems');
  if (/cyber|securitate|osint|forensic|ameninț/.test(haystack)) add('investigative.security', 'technical.systems');
  if (/data|statistic|machine learning|analytics|sql|python|dashboard|cohort|metric/.test(haystack)) add('investigative.data');
  if (/research|cercet|doctorat|academic|metodolog|astronom|biolog|experiment|științific/.test(haystack)) add('investigative.research', 'investigative.science');
  if (/laborator|chimie|farma|biotech|hplc|gc|probe|microscop/.test(haystack)) add('investigative.lab');
  if (/diagnostic|diagnoz|defect|testare|bug|qa/.test(haystack)) add('investigative.diagnostic');

  if (/design|figma|vizual|grafic|ilustra|arhitect|foto|brand|moodboard|ux|ui|revit|autocad|croitor|modă/.test(haystack)) add('creative.visual');
  if (/scris|writing|copy|editor|jurnalist|reporter|traduc|liter|conținut|content|seo|storytelling|podcast/.test(haystack)) add('creative.writing');
  if (/muzic|dj|orchestr|cor|instrument|audio/.test(haystack)) add('creative.music');
  if (/video|youtube|stream|film|reels|montaj|premiere|davinci|creator/.test(haystack)) add('creative.video');
  if (/actor|perform|teatru|scenă|dans|stand-up|animator/.test(haystack)) add('creative.performance');
  if (/ceramic|bijut|tatu|craft|atelier|lemn|floral|florar|manual|patiser|cofetar/.test(haystack)) add('creative.craft');
  if (/game|joc|unity|unreal/.test(haystack)) add('creative.game');

  if (/mecanic|auto|motor|cnc|utilaj|solidworks|catia|sudor|strung|frez/.test(haystack)) add('technical.mechanical', 'practical.repair');
  if (/electric|electro|pcb|embedded|fpga|rf|telecom|plc|scada|eplan|anre/.test(haystack)) add('technical.electrical', 'technical.hardware');
  if (/construc|șantier|zidar|instalaț|instalator|hvac|frigotehnist|faianță|gaze/.test(haystack)) add('technical.construction', 'practical.install');
  if (/energie|energetic|fotovoltaic|solar|pv|smart grid|bater/.test(haystack)) add('technical.energy');
  if (/hardware|electron|pcb|microcontrol|iot|robot/.test(haystack)) add('technical.hardware');

  if (/profesor|preda|educator|învățător|pedagog|mentor|logoped|training|instructor/.test(haystack)) add('social.teaching');
  if (/asistent|îngrijitor|bătrân|copii|vulnerabil|pacient|nursing|smurd|paramedic|veterinar/.test(haystack)) add('social.care');
  if (/psiholog|terapeut|consilier|counsel|coaching|cbt|emdr/.test(haystack)) add('social.counseling');
  if (/community|comunitate|ong|voluntar|facilitare|impact social/.test(haystack)) add('social.community');
  if (/client|customer|recepționer|ospătar|casier|retail|hotel|front office|support/.test(haystack)) add('social.customer');
  if (/antrenor|fitness|sport|coach|kineto|fizio/.test(haystack)) add('social.coaching');

  if (/sales|vânz|negoci|account executive|imobiliar|pitch|parteneriat/.test(haystack)) add('business.sales', 'business.negotiation');
  if (/marketing|brand|seo|growth|ads|media|campanie|audien|funnel/.test(haystack)) add('business.marketing');
  if (/founder|antreprenor|startup|business|e-commerce|dtc|firmă proprie|salon propriu|studio propriu/.test(haystack)) add('business.entrepreneurship');
  if (/product manager|produs|roadmap|discovery|prioritizare|prd/.test(haystack)) add('business.product');
  if (/bancar|finan|contabil|bursă|p&l|roas|cost|buget/.test(haystack)) add('business.finance');
  if (/operațiuni|logistic|supply|depozit|inventar|manager proiect|pm|procurement|achiziții/.test(haystack)) add('business.operations');

  if (/admin|office|asistent manager|document|dosar|contract|procedur|calendar|raport/.test(haystack)) add('order.admin', 'order.documentation');
  if (/compliance|reglement|norme|legal|drept|avocat|aml|kyc|anre|iscir|f-gas/.test(haystack)) add('order.compliance');
  if (/quality|calitate|qa|test cases|verific|control|haccp|gmp/.test(haystack)) add('order.quality');
  if (/achiziții|procurement|buyer|rfp|rfq|furnizor/.test(haystack)) add('order.procurement');
  if (/logistic|depozit|stoc|curier|livr|transport|tir|rută/.test(haystack)) add('order.logistics');
  if (/polițist|jandarm|armată|militar|ofițer|subofițer|mapn|mai|isu|pompier|sri|intelligence|apărare|securitate națională|law enforcement|ordre public/.test(haystack)) add('order.law_enforcement');

  if (/repar|service|mecanic|diagnoz|frigorific|auto|lock|electrocasnic/.test(haystack)) add('practical.repair');
  if (/bucătar|chef|patiser|cofetar|restaurant|horeca|mâncare|farfurii/.test(haystack)) add('practical.food');
  if (/coafor|frizer|make-up|manichiur|cosmetician|beauty|skincare|salon/.test(haystack)) add('practical.beauty');
  if (/șofer|curier|livrator|tir|transport|camion|scuter/.test(haystack)) add('practical.transport');
  if (/agronom|horticult|agricultur|ferm|plante|animale/.test(haystack)) add('practical.agriculture');
  if (/manual|atelier|tâmplar|dulgher|ceramic|bijut|croitor|sudor/.test(haystack)) add('practical.manual_craft');

  if (/medic|clinic|spital|pacient|diagnostic|chirurg|radiolog|cardio/.test(haystack)) add('health.clinical');
  if (/asistent medical|nursing|îngrijitor|pacient|postliceal sanitar/.test(haystack)) add('health.nursing');
  if (/stomatolog|dentar|dinți|tehnician dentar/.test(haystack)) add('health.dental');
  if (/farmacist|farma|medicament|pharma/.test(haystack)) add('health.pharma');
  if (/psihoterapeut|terapeut|kineto|fizio|logoped|recuperare|masaj|maseur/.test(haystack)) add('health.therapy');
  if (/paramedic|smurd|pompier|urgență|salvamont/.test(haystack)) add('health.emergency');

  // Coarse fallback so every career has at least a useful signal vector.
  if (signals.size === 0) {
    (career.traits ?? []).forEach((trait) => {
      if (trait === 'tech') add('technical.systems');
      if (trait === 'analyze') add('investigative.research');
      if (trait === 'social') add('social.customer');
      if (trait === 'lead') add('business.operations');
      if (trait === 'create') add('creative.visual');
      if (trait === 'build') add('practical.manual_craft');
    });
  }

  return Array.from(signals).filter((s) => (SIGNAL_KEYS as readonly string[]).includes(s));
}

// ── Profile builders ──────────────────────────────────────────────────────────

export function buildUserProfile(
  answers: Record<string, QuizAnswerOption>,
  deepScores?: MatchInput['deepScores'],
): UserProfile {
  const riasec: Tally = {};
  const paths: Tally = {};
  const traits: Tally = {};
  const big5: Tally = {};
  const signals: Tally = {};

  // 1. Scenario quiz answers
  Object.values(answers ?? {}).forEach((opt) => {
    if (!opt) return;
    (opt.riasec ?? []).forEach((c) => { riasec[c] = (riasec[c] ?? 0) + 1; });
    if (opt.path) { paths[opt.path] = (paths[opt.path] ?? 0) + 1; }
    (opt.traits ?? []).forEach((t) => { traits[t] = (traits[t] ?? 0) + 1; });
    addSignals(signals, opt.signals, 1);
  });

  // 2. Vocational (Holland) test
  const vocDeep = deepScores?.vocationalDeep;
  const vocLight = deepScores?.vocational;
  if (vocDeep?.raw) {
    Object.entries(vocDeep.raw).forEach(([code, val]) => {
      const contribution = Math.max(0, (val - 3) * 6);
      riasec[code] = (riasec[code] ?? 0) + contribution;
    });
    if (vocDeep.signalsRaw) {
      Object.entries(vocDeep.signalsRaw).forEach(([signal, val]) => {
        addSignals(signals, [signal], val);
      });
    }
  } else if (vocLight?.raw) {
    const lightTotal = Object.values(vocLight.raw).reduce((sum, value) => sum + value, 0);
    const isForcedChoiceLight = lightTotal <= 12.5;
    Object.entries(vocLight.raw).forEach(([code, val]) => {
      const contribution = isForcedChoiceLight
        ? Math.max(0, (val - 2) * 4.5)
        : Math.max(0, (val - VOCATIONAL_LIGHT_CENTER) * VOCATIONAL_LIGHT_SCALE);
      riasec[code] = (riasec[code] ?? 0) + contribution;
    });
    if (vocLight.signalsRaw) {
      Object.entries(vocLight.signalsRaw).forEach(([signal, val]) => {
        addSignals(signals, [signal], val);
      });
    }
  }

  // 3. Big Five — IPIP-NEO-60 wins over short test
  const big5Source = deepScores?.ipipNeo60 ?? deepScores?.personality;
  if (big5Source) {
    BIG5_KEYS.forEach((k) => {
      if (k === 'S') return; // computed below
      if (typeof big5Source[k] === 'number') big5[k] = big5Source[k];
    });
    if (typeof big5.N === 'number') big5.S = 100 - big5.N;
  }

  // 4. Track sources
  const sources: string[] = [];
  if (Object.keys(answers ?? {}).length > 0) sources.push('quick');
  if (vocDeep?.raw) sources.push('vocational-deep');
  else if (vocLight?.raw) sources.push('vocational');
  if (deepScores?.ipipNeo60) sources.push('ipip-neo-60');
  else if (deepScores?.personality) sources.push('personality-15');

  return { riasec, paths, traits, big5, signals, sources };
}

export function buildCareerProfile(career: Career): CareerProfile {
  const riasec: Tally = {};
  const paths: Tally = {};
  const traits: Tally = {};
  const big5: Tally = {};
  const signals: Tally = {};

  // RIASEC codes primary→tertiary; weight 3/2/1
  (career.riasec ?? []).forEach((c, i) => { riasec[c] = i < 3 ? (3 - i) : 1; });
  if (career.pathType) { paths[career.pathType] = 1; }
  if (career.pathType === 'mixt') { paths.facultate = 0.5; paths.autodidact = 0.5; }
  (career.traits ?? []).forEach((t) => { traits[t] = 1; });
  addSignals(signals, inferCareerSignals(career), 1);
  (career.big5 ?? []).forEach((k) => {
    if ((BIG5_KEYS as readonly string[]).includes(k)) big5[k] = 1;
  });

  return { riasec, paths, traits, big5, signals };
}

// ── Weights (sample-size-aware) ───────────────────────────────────────────────

export function getWeights(userProfile: UserProfile): Weights {
  const sources = userProfile.sources ?? [];
  const hasBig5 = Object.keys(userProfile.big5 ?? {}).length > 0;
  const hasVocDeep = sources.includes('vocational-deep');
  const hasVocLight = sources.includes('vocational') || hasVocDeep;

  if (hasBig5 && hasVocDeep)  return { riasec: 0.55, paths: 0.10, traits: 0.05, signals: 0.15, big5: 0.15 };
  if (hasBig5 && hasVocLight) return { riasec: 0.50, paths: 0.15, traits: 0.05, signals: 0.15, big5: 0.15 };
  if (hasBig5)                return { riasec: 0.45, paths: 0.20, traits: 0.05, signals: 0.15, big5: 0.15 };
  if (hasVocDeep)             return { riasec: 0.55, paths: 0.15, traits: 0.15, signals: 0.15, big5: 0.00 };
  if (hasVocLight)            return { riasec: 0.50, paths: 0.20, traits: 0.15, signals: 0.15, big5: 0.00 };
  return { riasec: 0.45, paths: 0.25, traits: 0.15, signals: 0.15, big5: 0.00 };
}

function big5Cosine(userBig5: Tally, careerBig5: Tally): number {
  const userVec = BIG5_KEYS.map((k) => {
    const v = userBig5[k];
    if (typeof v !== 'number') return 0;
    return Math.max(0, (v / 100) - 0.5);
  });
  const careerVec = BIG5_KEYS.map((k) => careerBig5[k] ?? 0);
  return cosine(userVec, careerVec);
}

function rawScore(userProfile: UserProfile, careerProfile: CareerProfile, weights: Weights): number {
  const sR = cosine(vecFromTallyKeys(userProfile.riasec, RIASEC_KEYS), vecFromTallyKeys(careerProfile.riasec, RIASEC_KEYS));
  const sP = cosine(vecFromTallyKeys(userProfile.paths, PATH_KEYS),   vecFromTallyKeys(careerProfile.paths, PATH_KEYS));
  const sT = cosine(vecFromTallyKeys(userProfile.traits, TRAIT_KEYS), vecFromTallyKeys(careerProfile.traits, TRAIT_KEYS));
  const sS = cosine(vecFromTallyKeys(userProfile.signals, SIGNAL_KEYS), vecFromTallyKeys(careerProfile.signals, SIGNAL_KEYS));
  let sB = 0;
  if (weights.big5 > 0 && Object.keys(careerProfile.big5 ?? {}).length > 0) {
    sB = big5Cosine(userProfile.big5, careerProfile.big5);
  }
  return weights.riasec * sR + weights.paths * sP + weights.traits * sT + weights.signals * sS + weights.big5 * sB;
}

export function explainMatch(
  userProfile: UserProfile,
  career: Career,
  careerProfile: CareerProfile,
  weights: Weights,
): MatchExplanation {
  const top2riasec = Object.entries(userProfile.riasec ?? {})
    .sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const topPath = Object.entries(userProfile.paths ?? {}).sort((a, b) => b[1] - a[1])[0];
  const riasecHit = (career.riasec ?? []).filter((c) => top2riasec.includes(c));
  const pathHit = Boolean(topPath && career.pathType === topPath[0]);

  const sR = cosine(vecFromTallyKeys(userProfile.riasec, RIASEC_KEYS), vecFromTallyKeys(careerProfile.riasec, RIASEC_KEYS));
  const sP = cosine(vecFromTallyKeys(userProfile.paths, PATH_KEYS),   vecFromTallyKeys(careerProfile.paths, PATH_KEYS));
  const sT = cosine(vecFromTallyKeys(userProfile.traits, TRAIT_KEYS), vecFromTallyKeys(careerProfile.traits, TRAIT_KEYS));
  const sS = cosine(vecFromTallyKeys(userProfile.signals, SIGNAL_KEYS), vecFromTallyKeys(careerProfile.signals, SIGNAL_KEYS));
  const sB = (weights.big5 > 0 && Object.keys(careerProfile.big5 ?? {}).length > 0)
    ? big5Cosine(userProfile.big5, careerProfile.big5) : null;

  const bits: string[] = [];
  if (riasecHit.length) bits.push(`RIASEC ${riasecHit.join('+')}`);
  if (pathHit) bits.push(`drum ${topPath[0]}`);
  if (sB !== null && sB > 0.4) bits.push('Big Five aliniate');

  return {
    text: bits.length ? bits.join(' · ') : 'profil mixt',
    axes: { riasec: sR, paths: sP, traits: sT, signals: sS, big5: sB },
    riasecHit,
    pathHit,
  };
}

// ── Next-test suggestion ──────────────────────────────────────────────────────

function suggestNextTest(sources: string[]): NextTestSuggestion | null {
  const hasQuick = sources.includes('quick');
  const hasVoc = sources.includes('vocational') || sources.includes('vocational-deep');
  const hasBig5 = sources.includes('personality-15') || sources.includes('ipip-neo-60');

  if (!hasQuick) return { kind: 'quick', reason: 'Începe cu Scenarii reale pentru primele cariere.' };
  if (!hasVoc) return { kind: 'vocational', reason: 'Adaugă testul vocațional pentru matches mai precise (+33% acuratețe).' };
  if (!hasBig5) return { kind: 'ipip-neo', reason: 'Adaugă Big Five pentru fit motivațional (+25% acuratețe).' };
  return null;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function computeMatches(input: MatchInput): MatchResult {
  const { answers, careers, deepScores } = input;
  const userProfile = buildUserProfile(answers, deepScores);

  const noAnswers =
    Object.keys(userProfile.riasec).length === 0 &&
    Object.keys(userProfile.paths).length === 0 &&
    Object.keys(userProfile.traits).length === 0 &&
    Object.keys(userProfile.signals).length === 0 &&
    Object.keys(userProfile.big5).length === 0;

  const weights = getWeights(userProfile);

  // 1. Raw scores
  const scored = careers.map((c) => {
    const cp = buildCareerProfile(c);
    const raw = rawScore(userProfile, cp, weights);
    const why = explainMatch(userProfile, c, cp, weights);
    return { career: c, careerProfile: cp, raw, why };
  });

  if (noAnswers) {
    const empty = Object.assign(
      scored.map((s) => ({ career: s.career, score: 0, why: '' as const })),
      { confidence: 0, sources: [] as string[], userProfile, nextTest: suggestNextTest([]) },
    );
    return empty as unknown as MatchResult;
  }

  // 2. Calibrate 0-100
  const maxRaw = Math.max(...scored.map((s) => s.raw), 0.001);
  const breadth = userProfile.sources.length;
  const FLOOR = 25;
  const CEIL = breadth >= 3 ? 95 : breadth === 2 ? 88 : 80;
  const calibrated = scored.map((s) => ({
    ...s,
    score: Math.round(FLOOR + Math.pow(s.raw / maxRaw, 0.85) * (CEIL - FLOOR)),
  }));

  // 3. Sort + MMR diversification
  const sorted = calibrated.slice().sort((a, b) => b.raw - a.raw);
  const picked = [sorted[0]];
  const pool = sorted.slice(1);
  const LAMBDA = 0.7;
  const TOP_N = 6;

  while (picked.length < TOP_N && pool.length) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      const candVec = vecFromTallyKeys(cand.careerProfile.riasec, RIASEC_KEYS);
      let maxSim = 0;
      picked.forEach((p) => {
        const pv = vecFromTallyKeys(p.careerProfile.riasec, RIASEC_KEYS);
        maxSim = Math.max(maxSim, cosine(candVec, pv));
      });
      const mmr = LAMBDA * cand.raw - (1 - LAMBDA) * maxSim;
      if (mmr > bestVal) { bestVal = mmr; bestIdx = i; }
    }
    picked.push(pool.splice(bestIdx, 1)[0]);
  }
  picked.sort((a, b) => b.score - a.score);
  const tail = pool.sort((a, b) => b.raw - a.raw);
  const allMatches = [...picked, ...tail].map(({ career, score, why }) => ({ career, score, why }));

  // 4. Confidence
  const top1 = picked[0]?.raw ?? 0;
  const top3 = picked[2]?.raw ?? 0;
  const spread = top1 > 0 ? (top1 - top3) / top1 : 0;
  const breadthBase = breadth >= 3 ? 0.70 : breadth === 2 ? 0.40 : 0.10;
  const spreadBonus = Math.min(0.30, spread * 1.5);
  const confidence = Math.min(1, breadthBase + spreadBonus);

  return Object.assign(allMatches, {
    confidence,
    sources: userProfile.sources,
    userProfile,
    nextTest: suggestNextTest(userProfile.sources),
  }) as unknown as MatchResult;
}
