/**
 * Phase D — Shareable card archetypes.
 *
 * Maps the user's top-2 RIASEC letters to a curated archetype label + glyph.
 * The mapping is deterministic and tied to interest dimensions only — not to
 * trait-level competencies. Labels are framed in interest-attraction language
 * ("te atrag rolurile X") rather than competence claims, so the free quiz does
 * not overpromise relative to the paid IPIP-NEO-60 bundle.
 *
 * Names and taglines are co-located here (not in next-intl messages) because:
 *   1. They are tightly coupled to the RIASEC pair data model, not UI copy.
 *   2. RIASEC_PLAIN in results-client.tsx follows the same hardcoded pattern.
 *   3. 30 pairs × 2 fields × N locales would bloat message files.
 *
 * See docs/VIRAL-PHASE-D-PLAN.md §3 for the curation decisions.
 */

export type Locale = 'ro' | 'en';

export type ArchetypeData = {
  pair: string;   // e.g. "RI" — top1+top2 RIASEC letters; "??" if no signal
  name: string;   // localized archetype label (uppercase)
  tag: string;    // localized one-line description
  glyph: string;  // unicode glyph for the card
};

const VALID_LETTERS = new Set(['R', 'I', 'A', 'S', 'E', 'C']);

/** Unicode glyph per pair. Picked for visual variety on the card. */
const ARCHETYPE_GLYPHS: Record<string, string> = {
  RI: '⚒', RA: '✦', RS: '⚡', RE: '✺', RC: '⚙',
  IR: '◇', IA: '◊', IS: '✦', IE: '✺', IC: '∆',
  AR: '✦', AI: '◇', AS: '★', AE: '✺', AC: '◈',
  SR: '♥', SI: '✦', SA: '◊', SE: '⚡', SC: '★',
  ER: '✺', EI: '∆', EA: '★', ES: '✦', EC: '⚡',
  CR: '⚙', CI: '∆', CA: '◈', CS: '★', CE: '⚡',
};

const DEFAULT_GLYPH = '✦';

/**
 * RO labels. Names are uppercase. Taglines stay in the
 * interest-attraction register ("te atrag rolurile între X și Y") — never make
 * trait-level claims the test cannot support.
 */
const ARCHETYPES_RO: Record<string, {name: string; tag: string}> = {
  RI: {name: 'CONSTRUCTORUL',        tag: 'Te atrag rolurile între logică și acțiune practică.'},
  RA: {name: 'MEȘTEȘUGARUL',         tag: 'Te atrag rolurile între gust și manualitate.'},
  RS: {name: 'ANTRENORUL',           tag: 'Te atrag rolurile între acțiune și oameni.'},
  RE: {name: 'FONDATORUL',           tag: 'Te atrag rolurile între acțiune și antreprenoriat.'},
  RC: {name: 'INGINERUL',            tag: 'Te atrag rolurile între sisteme și execuție.'},
  IR: {name: 'EXPLORATORUL',         tag: 'Te atrag rolurile între curiozitate și experiment practic.'},
  IA: {name: 'GÂNDITORUL CREATIV',   tag: 'Te atrag rolurile între idei și estetică.'},
  IS: {name: 'PROFESORUL',           tag: 'Te atrag rolurile între cunoaștere și oameni.'},
  IE: {name: 'INOVATORUL',           tag: 'Te atrag rolurile între idei și inițiativă.'},
  IC: {name: 'ANALISTUL',            tag: 'Te atrag rolurile între date și structură.'},
  AR: {name: 'ARTISTUL TANGIBIL',    tag: 'Te atrag rolurile între estetică și materialitate.'},
  AI: {name: 'CERCETĂTORUL ARTISTIC',tag: 'Te atrag rolurile între curiozitate și expresie.'},
  AS: {name: 'POVESTITORUL',         tag: 'Te atrag rolurile între narațiune și oameni.'},
  AE: {name: 'PERFORMERUL',          tag: 'Te atrag rolurile între expresie și public.'},
  AC: {name: 'DESIGNERUL',           tag: 'Te atrag rolurile între estetică și ordine.'},
  SR: {name: 'OPERATORUL SOCIAL',    tag: 'Te atrag rolurile între oameni și activitate practică.'},
  SI: {name: 'EDUCATORUL',           tag: 'Te atrag rolurile între oameni și cunoaștere.'},
  SA: {name: 'INTERPRETUL SOCIAL',   tag: 'Te atrag rolurile între oameni și expresie creativă.'},
  SE: {name: 'CONECTORUL DE OAMENI', tag: 'Te atrag rolurile între oameni: HR, sales, organizare echipe.'},
  SC: {name: 'ORGANIZATORUL',        tag: 'Te atrag rolurile între oameni și structură.'},
  ER: {name: 'ANTREPRENORUL',        tag: 'Te atrag rolurile între inițiativă și execuție practică.'},
  EI: {name: 'STRATEGUL',            tag: 'Te atrag rolurile între decizie și analiză.'},
  EA: {name: 'PRODUCĂTORUL',         tag: 'Te atrag rolurile între inițiativă și expresie creativă.'},
  ES: {name: 'CONECTORUL',           tag: 'Te atrag rolurile între inițiativă și oameni.'},
  EC: {name: 'MANAGERUL',            tag: 'Te atrag rolurile între decizie și structură.'},
  CR: {name: 'TEHNICIANUL',          tag: 'Te atrag rolurile între execuție și sisteme.'},
  CI: {name: 'AUDITORUL',            tag: 'Te atrag rolurile între date și verificare.'},
  CA: {name: 'EDITORUL',             tag: 'Te atrag rolurile între structură și estetică.'},
  CS: {name: 'CONSILIERUL',          tag: 'Te atrag rolurile între structură și oameni.'},
  CE: {name: 'OPERATORUL',           tag: 'Te atrag rolurile între structură și acțiune.'},
};

const ARCHETYPES_EN: Record<string, {name: string; tag: string}> = {
  RI: {name: 'THE BUILDER',          tag: 'You\'re drawn to roles between logic and hands-on action.'},
  RA: {name: 'THE CRAFTSPERSON',     tag: 'You\'re drawn to roles between taste and manual making.'},
  RS: {name: 'THE COACH',            tag: 'You\'re drawn to roles between action and people.'},
  RE: {name: 'THE FOUNDER',          tag: 'You\'re drawn to roles between action and entrepreneurship.'},
  RC: {name: 'THE ENGINEER',         tag: 'You\'re drawn to roles between systems and execution.'},
  IR: {name: 'THE EXPLORER',         tag: 'You\'re drawn to roles between curiosity and practical experiment.'},
  IA: {name: 'THE CREATIVE THINKER', tag: 'You\'re drawn to roles between ideas and aesthetics.'},
  IS: {name: 'THE TEACHER',          tag: 'You\'re drawn to roles between knowledge and people.'},
  IE: {name: 'THE INNOVATOR',        tag: 'You\'re drawn to roles between ideas and initiative.'},
  IC: {name: 'THE ANALYST',          tag: 'You\'re drawn to roles between data and structure.'},
  AR: {name: 'THE TANGIBLE ARTIST',  tag: 'You\'re drawn to roles between aesthetics and materiality.'},
  AI: {name: 'THE ART RESEARCHER',   tag: 'You\'re drawn to roles between curiosity and expression.'},
  AS: {name: 'THE STORYTELLER',      tag: 'You\'re drawn to roles between narrative and people.'},
  AE: {name: 'THE PERFORMER',        tag: 'You\'re drawn to roles between expression and audience.'},
  AC: {name: 'THE DESIGNER',         tag: 'You\'re drawn to roles between aesthetics and order.'},
  SR: {name: 'THE SOCIAL OPERATOR',  tag: 'You\'re drawn to roles between people and hands-on activity.'},
  SI: {name: 'THE EDUCATOR',         tag: 'You\'re drawn to roles between people and knowledge.'},
  SA: {name: 'THE SOCIAL INTERPRETER',tag: 'You\'re drawn to roles between people and creative expression.'},
  SE: {name: 'THE PEOPLE CONNECTOR', tag: 'You\'re drawn to roles between people: HR, sales, team organising.'},
  SC: {name: 'THE ORGANISER',        tag: 'You\'re drawn to roles between people and structure.'},
  ER: {name: 'THE ENTREPRENEUR',     tag: 'You\'re drawn to roles between initiative and practical execution.'},
  EI: {name: 'THE STRATEGIST',       tag: 'You\'re drawn to roles between decision-making and analysis.'},
  EA: {name: 'THE PRODUCER',         tag: 'You\'re drawn to roles between initiative and creative expression.'},
  ES: {name: 'THE CONNECTOR',        tag: 'You\'re drawn to roles between initiative and people.'},
  EC: {name: 'THE MANAGER',          tag: 'You\'re drawn to roles between decision-making and structure.'},
  CR: {name: 'THE TECHNICIAN',       tag: 'You\'re drawn to roles between execution and systems.'},
  CI: {name: 'THE AUDITOR',          tag: 'You\'re drawn to roles between data and verification.'},
  CA: {name: 'THE EDITOR',           tag: 'You\'re drawn to roles between structure and aesthetics.'},
  CS: {name: 'THE ADVISOR',          tag: 'You\'re drawn to roles between structure and people.'},
  CE: {name: 'THE OPERATIONS LEAD',  tag: 'You\'re drawn to roles between structure and action.'},
};

const DEFAULT_RO = {name: 'VOIAJORUL',  tag: 'Călătoria abia începe. Fă mai multe teste ca să se contureze.'};
const DEFAULT_EN = {name: 'THE TRAVELER', tag: 'The journey is just starting. Take more tests for a clearer signal.'};

/**
 * Compute the top-2 RIASEC pair from a tally. Returns "??" if the tally is
 * empty or invalid — the caller falls back to the default archetype.
 */
export function topRiasecPair(riasec: Record<string, number> | null | undefined): string {
  if (!riasec) return '??';
  const sorted = Object.entries(riasec)
    .filter(([k, v]) => VALID_LETTERS.has(k) && v > 0)
    .sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return '??';
  const top1 = sorted[0][0];
  const top2 = sorted[1]?.[0] ?? top1;
  return top1 + top2;
}

/**
 * Resolve a full archetype payload for a given RIASEC tally and locale.
 */
export function deriveArchetype(
  riasec: Record<string, number> | null | undefined,
  locale: Locale
): ArchetypeData {
  const pair = topRiasecPair(riasec);
  const table = locale === 'en' ? ARCHETYPES_EN : ARCHETYPES_RO;
  const fallback = locale === 'en' ? DEFAULT_EN : DEFAULT_RO;
  const entry = table[pair] ?? fallback;
  const glyph = ARCHETYPE_GLYPHS[pair] ?? DEFAULT_GLYPH;
  return {pair, name: entry.name, tag: entry.tag, glyph};
}
