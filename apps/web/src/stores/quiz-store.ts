'use client';

/**
 * Ce Să Fiu? — Quiz state store (Zustand + localStorage persist)
 *
 * Tracks:
 *  - savedCareerIds: careers the user explicitly saved ("Salvează vibe-ul")
 *  - lastMatchResult: the most recent /api/match response (for returning to results)
 *
 * Server data (quiz answers, personality scores) lives in the browser's
 * own localStorage keys set by questionnaire-client.tsx — this store only
 * tracks user intent / UI state that needs to survive page navigation.
 */

import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

type QuizStore = {
  savedCareerIds: string[];
  savedPath: {path_id: string; path_name: string | null} | null;
  setSavedCareers: (ids: string[]) => void;
  setSavedPath: (path: {path_id: string; path_name: string | null} | null) => void;
  saveCareer: (id: string) => void;
  unsaveCareer: (id: string) => void;
  isSaved: (id: string) => boolean;
  toggleSave: (id: string) => void;
  clearSaved: () => void;
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      savedCareerIds: [],
      savedPath: null,

      setSavedCareers: (ids) =>
        set({
          savedCareerIds: Array.from(new Set(ids)),
        }),

      setSavedPath: (path) => set({savedPath: path}),

      saveCareer: (id) =>
        set((state) => ({
          savedCareerIds: state.savedCareerIds.includes(id)
            ? state.savedCareerIds
            : [...state.savedCareerIds, id],
        })),

      unsaveCareer: (id) =>
        set((state) => ({
          savedCareerIds: state.savedCareerIds.filter((c) => c !== id),
        })),

      isSaved: (id) => get().savedCareerIds.includes(id),

      toggleSave: (id) => {
        if (get().isSaved(id)) {
          get().unsaveCareer(id);
        } else {
          get().saveCareer(id);
        }
      },

      clearSaved: () => set({savedCareerIds: [], savedPath: null}),
    }),
    {
      name: 'cesafiu:saved-careers',
      storage: createJSONStorage(() => {
        // Guard for SSR (localStorage is not available on the server)
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          };
        }
        return localStorage;
      }),
    },
  ),
);

// ── localStorage helpers for quiz results (used by results page) ──────────────

export type StoredTestResult = {
  slug: string;
  completedAt: string;
  answers: Record<string, unknown>;
  result: Array<{key: string; score: number}>;
  vocationalRaw?: Record<string, number>;
  vocationalSignalsRaw?: Record<string, number>;
  vocationalDeepRaw?: Record<string, number>;
  vocationalDeepSignalsRaw?: Record<string, number>;
};

const TEST_SLUGS = ['scenarii', 'personalitate', 'ipip-neo-60', 'vocational', 'vocational-deep'] as const;

/**
 * Read all completed test results from localStorage.
 * Returns whatever has been saved by questionnaire-client.tsx.
 */
export function readStoredResults(): Record<string, StoredTestResult | null> {
  if (typeof window === 'undefined') return {};

  const out: Record<string, StoredTestResult | null> = {};
  for (const slug of TEST_SLUGS) {
    try {
      const raw = localStorage.getItem(`cesafiu:test:${slug}:latest`);
      out[slug] = raw ? (JSON.parse(raw) as StoredTestResult) : null;
    } catch {
      out[slug] = null;
    }
  }
  return out;
}

/**
 * Convert stored test results into the shape expected by POST /api/match.
 *
 * The 'scenarii' quiz stores the raw option ID (e.g. 'a', 'b').
 * The questionnaire-client must store the full option objects for 'scenarii'
 * so we can reconstruct riasec/traits/path/signals here.
 * For personality/ipip-neo-60 we derive Big5 percentages from the stored scores.
 * For vocational we pass the per-code tallies as 'raw'.
 */
export function buildMatchRequest(stored: Record<string, StoredTestResult | null>): {
  scenariiAnswers?: Record<string, {id: string; riasec?: string[]; path?: string; traits?: string[]; signals?: string[]}>;
  personalityScores?: Record<string, number>;
  ipipNeo60Scores?: Record<string, number>;
  vocationalRaw?: Record<string, number>;
  vocationalSignalsRaw?: Record<string, number>;
  vocationalDeepRaw?: Record<string, number>;
  vocationalDeepSignalsRaw?: Record<string, number>;
} {
  const req: ReturnType<typeof buildMatchRequest> = {};

  // Scenarii answers: stored as full option objects (see questionnaire-client update)
  const scenarii = stored['scenarii'];
  if (scenarii?.answers) {
    req.scenariiAnswers = scenarii.answers as Record<string, {
      id: string; riasec?: string[]; path?: string; traits?: string[]; signals?: string[];
    }>;
  }

  // Personality: result contains [{key:'O', score:72}, ...] — pass as percentages
  const personality = stored['personalitate'];
  if (personality?.result) {
    req.personalityScores = Object.fromEntries(personality.result.map(({key, score}) => [key, score]));
  }

  // IPIP-NEO-60: same structure
  const ipip = stored['ipip-neo-60'];
  if (ipip?.result) {
    req.ipipNeo60Scores = Object.fromEntries(ipip.result.map(({key, score}) => [key, score]));
  }

  // Vocational: result contains [{key:'R', score:60}, ...]
  // We convert back to raw tallies (score is already in 0-100, reuse as approximate raw)
  const vocational = stored['vocational'];
  if (vocational?.vocationalRaw) {
    req.vocationalRaw = vocational.vocationalRaw;
    req.vocationalSignalsRaw = vocational.vocationalSignalsRaw;
  } else if (vocational?.result) {
    req.vocationalRaw = Object.fromEntries(vocational.result.map(({key, score}) => [key, score / 10]));
  }

  const vocationalDeep = stored['vocational-deep'];
  if (vocationalDeep?.vocationalDeepRaw) {
    req.vocationalDeepRaw = vocationalDeep.vocationalDeepRaw;
    req.vocationalDeepSignalsRaw = vocationalDeep.vocationalDeepSignalsRaw;
  }

  return req;
}
