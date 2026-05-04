/** Data types for careers, institutions, and programs (from prototype data.js). */

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
    tuition?: { state?: number; private?: number };
  };
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
