/** Data types for careers, institutions, and programs from the canonical /data source. */

export type { Career } from '@/lib/matcher';

export type Institution = {
  id: string;
  name: string;
  city: string;
  tier: string;
  kind: string; // 'universitate' | 'institut' | 'academie' | 'postliceala' | 'profesionala'
  tags: string[];
  domains?: string[];
  notes?: string;
  url?: string;
};

/** Rich, per-faculty admission criteria (formula, calendar, fees, seats…).
 *  Every field is optional except competitionType/formula — programs range from a
 *  one-line `dosar` (media Bac) to a full `test-grila` with subjects and a timeline. */
export type AdmissionDetail = {
  competitionType: string; // 'test-grila' | 'dosar' | 'mixt' | 'proba-aptitudini' | 'examen-scris'
  formula: string;
  testStructure?: string;
  subjects?: string[];
  minGrade?: number;
  minGradeNote?: string;
  tiebreak?: string[];
  seats?: Record<string, number | string>;
  calendar?: Record<string, string>;
  fees?: { application?: number | null; currency?: string; note?: string } & Record<string, unknown>;
  specialConditions?: string;
  level?: string;
  verification: {
    source?: string;
    sourceUrl?: string;
    sourceName?: string;
    lastVerified?: string;
    pendingFields?: string[];
  };
};

export type Program = {
  id: string;
  name: string;
  universityId: string;
  pathType: string;
  duration: string;
  durationYears: number;
  language: string[];
  url?: string;
  riasec: string[];
  careerIds: string[];
  tags: string[];
  notes?: string;
  admission?: {
    exam?: string;
    deadline?: string;
    deadlineYear?: number;
    lastYearMin?: number;
    // Historically an object; enriched data uses a free-text string ("~3.000 lei/an").
    tuition?: string | { state?: number; private?: number };
  };
  admissionDetail?: AdmissionDetail;
  lastReviewed?: string;
};

export type PathEntry = {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
};

export type CareersData = {
  careers: import('@/lib/matcher').Career[];
  institutions: Institution[];
  programs: Program[];
  paths: PathEntry[];
};
