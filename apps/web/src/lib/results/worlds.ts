/**
 * Archetypes V2 — Layer 2: Career Worlds ("Lumi de carieră / Triburi").
 *
 * Worlds are an editorial exploration layer ORTHOGONAL to the 30 RIASEC-pair
 * archetypes (see archetypes.ts). They group careers.json into ~15 recognisable
 * "shelves" for teenagers. They do NOT participate in matching — careers keep
 * their riasec/signals/traits/big5 tags for /api/match, and worlds are derived
 * by aggregating over already-matched careers.
 *
 * See docs/ARCHETYPES-V2-PLAN.md (Stratul 2 + "Cum se leagă cele două straturi").
 *
 * Aggregation contract (review-pinned, 2026-06-11):
 *   - weight per career = raw/maxRaw from the matcher (NOT the calibrated
 *     0-100 score: FLOOR=25 would let the weakest career contribute ~26% and
 *     flatten world differences).
 *   - worldScore += weight / numberOfWorldsOnCareer (mass split, no double count)
 *   - a world is shown only with ≥2 contributing careers AND
 *     worldScore ≥ 50% of the leading world
 *   - below MIN_CONFIDENCE the chips are hidden (single-source results are
 *     compressed and noisy).
 */

export type WorldId =
  | 'digital-builders'
  | 'ai-minds'
  | 'life-explorers'
  | 'healers'
  | 'planet-guardians'
  | 'storytellers'
  | 'visual-creators'
  | 'makers'
  | 'world-builders'
  | 'founders'
  | 'numbers-people'
  | 'people-people'
  | 'protectors'
  | 'adventurers'
  | 'justice-civic';

export type World = {
  id: WorldId;
  nameRo: string;
  nameEn: string;
  taglineRo: string;
  taglineEn: string;
  glyph: string;
};

export const WORLDS: Record<WorldId, World> = {
  'digital-builders': {
    id: 'digital-builders',
    nameRo: 'Constructorii Digitali',
    nameEn: 'Digital Builders',
    taglineRo: 'Software, web, gaming, infrastructură — lumea construită din cod.',
    taglineEn: 'Software, web, gaming, infrastructure — the world built from code.',
    glyph: '⌘',
  },
  'ai-minds': {
    id: 'ai-minds',
    nameRo: 'Mințile AI',
    nameEn: 'AI & Machine Minds',
    taglineRo: 'Lumea care construiește, antrenează și supraveghează inteligența artificială.',
    taglineEn: 'The world that builds, trains and oversees artificial intelligence.',
    glyph: '◉',
  },
  'life-explorers': {
    id: 'life-explorers',
    nameRo: 'Exploratorii Vieții',
    nameEn: 'Life Explorers',
    taglineRo: 'Life sciences, biotech, genomică — lumea care descifrează cum funcționează viața.',
    taglineEn: 'Life sciences, biotech, genomics — the world decoding how life works.',
    glyph: '❋',
  },
  healers: {
    id: 'healers',
    nameRo: 'Vindecătorii',
    nameEn: 'The Healers',
    taglineRo: 'Sănătate clinică și terapii — oamenii care au grijă de oameni.',
    taglineEn: 'Clinical health and therapies — people who care for people.',
    glyph: '♥',
  },
  'planet-guardians': {
    id: 'planet-guardians',
    nameRo: 'Gardienii Planetei',
    nameEn: 'Planet Guardians',
    taglineRo: 'Climă, energie verde, mediu — joburile care țin planeta locuibilă.',
    taglineEn: 'Climate, green energy, environment — jobs that keep the planet livable.',
    glyph: '❂',
  },
  storytellers: {
    id: 'storytellers',
    nameRo: 'Povestitorii',
    nameEn: 'The Storytellers',
    taglineRo: 'Media, jurnalism, creator economy — cine ține microfonul.',
    taglineEn: 'Media, journalism, the creator economy — whoever holds the mic.',
    glyph: '✎',
  },
  'visual-creators': {
    id: 'visual-creators',
    nameRo: 'Creatorii Vizuali',
    nameEn: 'Visual Creators',
    taglineRo: 'Design, artă digitală, imagine — frumosul care comunică.',
    taglineEn: 'Design, digital art, image — beauty that communicates.',
    glyph: '◈',
  },
  makers: {
    id: 'makers',
    nameRo: 'Artizanii',
    nameEn: 'The Makers',
    taglineRo: 'Meșteșug, mâini, gust — lucruri reale, făcute cu mâna.',
    taglineEn: 'Craft, hands, taste — real things, made by hand.',
    glyph: '⚒',
  },
  'world-builders': {
    id: 'world-builders',
    nameRo: 'Constructorii Lumii Fizice',
    nameEn: 'World Builders',
    taglineRo: 'Inginerie, infrastructură, robotică — lumea fizică în funcțiune.',
    taglineEn: 'Engineering, infrastructure, robotics — the physical world, running.',
    glyph: '⚙',
  },
  founders: {
    id: 'founders',
    nameRo: 'Fondatorii',
    nameEn: 'The Founders',
    taglineRo: 'Business, startup, growth, vânzări — lumea construitului de la zero.',
    taglineEn: 'Business, startups, growth, sales — the world of building from zero.',
    glyph: '✺',
  },
  'numbers-people': {
    id: 'numbers-people',
    nameRo: 'Oamenii Numerelor',
    nameEn: 'The Numbers People',
    taglineRo: 'Finanțe, date, ordine — lumea în care cifrele spun povestea.',
    taglineEn: 'Finance, data, order — the world where the numbers tell the story.',
    glyph: '∆',
  },
  'people-people': {
    id: 'people-people',
    nameRo: 'Oameni pentru Oameni',
    nameEn: 'The People People',
    taglineRo: 'Educație, îngrijire, social — lumea care crește și susține oameni.',
    taglineEn: 'Education, care, social work — the world that grows and supports people.',
    glyph: '✦',
  },
  protectors: {
    id: 'protectors',
    nameRo: 'Protectorii',
    nameEn: 'The Protectors',
    taglineRo: 'Apărare, ordine, siguranță publică — lumea care stă între pericol și oameni.',
    taglineEn: 'Defence, order, public safety — the world standing between danger and people.',
    glyph: '🛡',
  },
  adventurers: {
    id: 'adventurers',
    nameRo: 'Aventurierii',
    nameEn: 'The Adventurers',
    taglineRo: 'Turism, sport, mobilitate, scenă — joburile care nu stau la birou.',
    taglineEn: 'Travel, sport, mobility, the stage — jobs that never sit still.',
    glyph: '➳',
  },
  'justice-civic': {
    id: 'justice-civic',
    nameRo: 'Apărătorii Dreptății',
    nameEn: 'Justice & Civic Systems',
    taglineRo: 'Drept, politici publice, administrație — regulile care țin societatea dreaptă.',
    taglineEn: 'Law, public policy, administration — the rules that keep society fair.',
    glyph: '⚖',
  },
};

export const WORLD_IDS = Object.keys(WORLDS) as WorldId[];

// ── World aggregation over matched careers ────────────────────────────────────

export type WorldScoreEntry = {
  /** careers.json id */
  careerId: string;
  /** raw/maxRaw from the matcher, in [0,1]. NOT the calibrated 0-100 score. */
  weight: number;
};

export type WorldScore = {
  world: World;
  /** Sum of split weights; relative value, only meaningful within one result. */
  score: number;
  /** Number of matched careers contributing to this world. */
  careerCount: number;
};

export type DeriveWorldsOptions = {
  /** How many top matches to aggregate over (plan: 12–20). */
  topN?: number;
  /** Max worlds to return for display. */
  maxWorlds?: number;
  /** A world needs at least this many contributing careers. */
  minCareers?: number;
  /** A world needs ≥ this share of the leading world's score. */
  minShareOfLeader?: number;
  /** Below this matcher confidence, return [] (hide chips). */
  minConfidence?: number;
};

const DEFAULTS: Required<DeriveWorldsOptions> = {
  topN: 16,
  maxWorlds: 3,
  minCareers: 2,
  minShareOfLeader: 0.5,
  minConfidence: 0.4,
};

/**
 * Aggregate matched careers into 2–3 displayable Worlds.
 *
 * @param entries Matched careers ordered by raw score (descending), with
 *                weight = raw/maxRaw. Callers should pass the raw ordering,
 *                not the MMR-diversified display ordering.
 * @param careerWorlds The career→worlds sidecar map.
 * @param confidence Matcher confidence in [0,1].
 */
export function deriveWorlds(
  entries: WorldScoreEntry[],
  careerWorlds: Record<string, WorldId[]>,
  confidence: number,
  options: DeriveWorldsOptions = {},
): WorldScore[] {
  const opts = {...DEFAULTS, ...options};
  if (confidence < opts.minConfidence) return [];

  const scores = new Map<WorldId, {score: number; careerCount: number}>();

  for (const entry of entries.slice(0, opts.topN)) {
    const worlds = careerWorlds[entry.careerId];
    if (!worlds || worlds.length === 0) continue;
    const split = Math.max(0, Math.min(1, entry.weight)) / worlds.length;
    for (const id of worlds) {
      const cur = scores.get(id) ?? {score: 0, careerCount: 0};
      cur.score += split;
      cur.careerCount += 1;
      scores.set(id, cur);
    }
  }

  const ranked = [...scores.entries()]
    .map(([id, s]) => ({world: WORLDS[id], score: s.score, careerCount: s.careerCount}))
    .sort((a, b) => b.score - a.score);

  const leader = ranked[0]?.score ?? 0;
  if (leader <= 0) return [];

  return ranked
    .filter((w) => w.careerCount >= opts.minCareers && w.score >= leader * opts.minShareOfLeader)
    .slice(0, opts.maxWorlds);
}
