/** Drumul tău — shared types for the journey engine and screen. */

export type ManualEntry = {
  at: string; // ISO timestamp of completion
  note?: string; // impression note, editable later
};

/** Storage key for a manual completion: `${pathId}:${stepId}`. */
export function manualKey(pathId: string, stepId: string): string {
  return `${pathId}:${stepId}`;
}

/** One reality-check step as defined in /data/journey-paths.json. */
export type JourneyPathStep = {
  id: string;
  emoji: string;
  title: string;
  title_en?: string;
  sub: string;
  sub_en?: string;
  hint?: string;
  hint_en?: string;
};

/** Per-path journey config from /data/journey-paths.json. */
export type JourneyPathConfig = {
  usesInstitutions: boolean;
  steps: JourneyPathStep[];
};

export type JourneyPathsData = Record<string, JourneyPathConfig>;

/** Where a step sends the user when tapped. The client maps this to hrefs/actions. */
export type StepTarget =
  | {kind: 'test'; slug: string}
  | {kind: 'browse'; section: 'careers' | 'paths' | 'unis'}
  | {kind: 'career'; id: string}
  | {kind: 'share'}
  | {kind: 'manual'; pathId: string; stepId: string};

export type JourneyStep = {
  /** Globally unique, stable — also the reward refId ('step:<id>'). */
  id: string;
  emoji: string;
  /** For derived steps: i18n key in the 'drum' namespace. For manual steps: literal text. */
  title: string;
  /** For derived steps: i18n key, unless subLiteral is set. For manual steps: literal text. */
  sub: string;
  /** Literal text that overrides the sub key (e.g. the chosen career's name). */
  subLiteral?: string;
  /** Interpolation values for the sub i18n key (e.g. {count} for saved counters). */
  subParams?: Record<string, number>;
  hint?: string;
  done: boolean;
  /** derived = computed from app state; manual = self-reported with note. */
  kind: 'derived' | 'manual';
  /** Only sequential (derived-chain) steps can be locked. */
  locked: boolean;
  /** The single pulsing "ACUM →" step. */
  current: boolean;
  target: StepTarget;
  xp: number;
  /** Manual steps carry their completion entry (timestamp + note). */
  entry?: ManualEntry;
};

export type JourneySection = {
  id: string;
  /** i18n key inside the 'drum' namespace, e.g. 'sectionDiscover'. */
  titleKey: string;
  /** i18n key for the milestone label. */
  milestoneKey: string;
  steps: JourneyStep[];
  done: boolean;
  /** Section shown but gated (S3 before a path is chosen). */
  gated: boolean;
  badgeId: string;
};

export type JourneyObjective = {
  id: string;
  name: string;
  emoji: string;
  /** true = picked by the student, false = suggested from test results. */
  chosen: boolean;
} | null;

export type JourneyState = {
  sections: JourneySection[];
  steps: JourneyStep[];
  doneCount: number;
  totalCount: number;
  pct: number;
  xpEarned: number;
  xpTotal: number;
  currentId: string | null;
  objective: JourneyObjective;
  complete: boolean;
};

export type DeriveInput = {
  testsDone: {scenarii: boolean; vocational: boolean; personalitate: boolean};
  chosenCareer: {id: string; name: string; emoji: string} | null;
  topMatch: {id: string; name: string; emoji: string} | null;
  savedPath: {id: string; name: string | null} | null;
  savedAltCount: number;
  savedUniCount: number;
  /** True when the student opened the detail page of a uni they have saved (viewed ∩ saved ≠ ∅). */
  admissionChecked: boolean;
  seenShareCard: boolean;
  manual: Record<string, ManualEntry>;
  /** Config for the chosen path (null when no path chosen yet). */
  pathConfig: JourneyPathConfig | null;
  /** 'ro' | 'en' — picks localized strings out of journey-paths.json. */
  locale: string;
};
