'use client';

/**
 * Ce Să Fiu? — Drumul tău store (Zustand + localStorage persist)
 *
 * Holds everything the journey needs that ISN'T derivable from other state:
 *  - chosenCareerId: the career the student picked as objective #1
 *  - seenUniDetail / seenShareCard: lightweight "did this once" flags
 *  - manual: self-reported reality-check completions, keyed `${pathId}:${stepId}`,
 *    each with an optional impression note ("Cum a fost? Ce te-a surprins?")
 *  - rewards: APPEND-ONLY ledger of earned XP/badges. Idempotent by id, so
 *    derived steps can be re-logged safely on every visit. What rewards
 *    translate into is intentionally open — the ledger is the contract.
 *
 * All local-first (v1): impression notes are personal reflections from minors;
 * keeping them on-device means no new server-side processing. Account sync is
 * a separate, future decision (see docs/JOURNEY-DRUMUL-TAU-PLAN.md §M4).
 */

import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';

import {manualKey, type ManualEntry} from '@/lib/journey/types';

export {manualKey};
export type {ManualEntry};

export type RewardEvent = {
  id: string; // unique + stable, e.g. 'step:quiz', 'step:facultate:open-day', 'milestone:m2'
  type: 'step' | 'milestone' | 'journey';
  xp: number;
  badgeId?: string;
  at: string; // ISO timestamp
};

type JourneyStore = {
  chosenCareerId: string | null;
  /** Institution ids whose detail page the student opened ("checked admission"). */
  admissionViewedUniIds: string[];
  seenShareCard: boolean;
  manual: Record<string, ManualEntry>;
  rewards: RewardEvent[];

  setChosenCareer: (id: string | null) => void;
  markAdmissionViewed: (uniId: string) => void;
  markShareCardSeen: () => void;
  /** Wipe all journey data: completions, impression notes, rewards, flags. */
  resetJourney: () => void;
  completeManualStep: (pathId: string, stepId: string) => void;
  undoManualStep: (pathId: string, stepId: string) => void;
  saveNote: (pathId: string, stepId: string, note: string) => void;
  /** Append a reward if its id isn't in the ledger yet. Returns true when newly added. */
  logReward: (event: Omit<RewardEvent, 'at'>) => boolean;
  totalXp: () => number;
};

export const useJourneyStore = create<JourneyStore>()(
  persist(
    (set, get) => ({
      chosenCareerId: null,
      admissionViewedUniIds: [],
      seenShareCard: false,
      manual: {},
      rewards: [],

      setChosenCareer: (id) => set({chosenCareerId: id}),

      markAdmissionViewed: (uniId) => {
        const current = get().admissionViewedUniIds;
        if (current.includes(uniId)) return;
        // Cap the list — only the saved∩viewed intersection matters downstream.
        set({admissionViewedUniIds: [...current, uniId].slice(-30)});
      },

      resetJourney: () =>
        set({
          chosenCareerId: null,
          admissionViewedUniIds: [],
          seenShareCard: false,
          manual: {},
          rewards: [],
        }),

      markShareCardSeen: () => {
        if (!get().seenShareCard) set({seenShareCard: true});
      },

      completeManualStep: (pathId, stepId) => {
        const key = manualKey(pathId, stepId);
        if (get().manual[key]) return;
        set((state) => ({
          manual: {...state.manual, [key]: {at: new Date().toISOString()}},
        }));
      },

      undoManualStep: (pathId, stepId) => {
        const key = manualKey(pathId, stepId);
        set((state) => {
          if (!state.manual[key]) return state;
          const next = {...state.manual};
          delete next[key];
          return {
            manual: next,
            // The earned reward is also withdrawn so it can be re-earned honestly.
            rewards: state.rewards.filter((r) => r.id !== `step:${key}`),
          };
        });
      },

      saveNote: (pathId, stepId, note) => {
        const key = manualKey(pathId, stepId);
        set((state) => {
          const entry = state.manual[key];
          if (!entry) return state;
          const trimmed = note.trim();
          return {
            manual: {
              ...state.manual,
              [key]: trimmed ? {...entry, note: trimmed} : {at: entry.at},
            },
          };
        });
      },

      logReward: (event) => {
        if (get().rewards.some((r) => r.id === event.id)) return false;
        set((state) => ({
          rewards: [...state.rewards, {...event, at: new Date().toISOString()}],
        }));
        return true;
      },

      totalXp: () => get().rewards.reduce((sum, r) => sum + r.xp, 0),
    }),
    {
      name: 'cesafiu:journey',
      storage: createJSONStorage(() => {
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
