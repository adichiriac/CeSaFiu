'use client';

/**
 * Ce Să Fiu? — Saved universities store (Zustand + localStorage persist)
 *
 * Replaces the ad-hoc readers/writers that lived in browse-client.tsx and
 * profile-client.tsx so any surface (browse, profil, drum) shares one
 * reactive source of truth.
 *
 * Backward compatibility: the localStorage value stays a PLAIN JSON ARRAY
 * of institution ids (`["uni-1","uni-2"]`) — the exact format written before
 * this store existed — via a custom storage adapter. No migration needed.
 */

import {create} from 'zustand';
import {createJSONStorage, persist, type StateStorage} from 'zustand/middleware';

const SAVED_UNI_KEY = 'cesafiu:saved-universities';

type UniStore = {
  savedUniIds: string[];
  saveUni: (id: string) => void;
  unsaveUni: (id: string) => void;
  toggleUni: (id: string) => void;
  isUniSaved: (id: string) => boolean;
};

/** Persists only the array, in the legacy plain-array format. */
const plainArrayStorage: StateStorage = {
  getItem: () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(SAVED_UNI_KEY);
      const ids = raw ? (JSON.parse(raw) as unknown) : [];
      const savedUniIds = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [];
      return JSON.stringify({state: {savedUniIds}, version: 0});
    } catch {
      return null;
    }
  },
  setItem: (_name, value) => {
    if (typeof window === 'undefined') return;
    try {
      const parsed = JSON.parse(value) as {state?: {savedUniIds?: string[]}};
      window.localStorage.setItem(SAVED_UNI_KEY, JSON.stringify(parsed.state?.savedUniIds ?? []));
    } catch {
      // Never let persistence break the UI.
    }
  },
  removeItem: () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(SAVED_UNI_KEY);
  },
};

export const useUniStore = create<UniStore>()(
  persist(
    (set, get) => ({
      savedUniIds: [],

      saveUni: (id) =>
        set((state) => ({
          savedUniIds: state.savedUniIds.includes(id) ? state.savedUniIds : [...state.savedUniIds, id],
        })),

      unsaveUni: (id) =>
        set((state) => ({
          savedUniIds: state.savedUniIds.filter((x) => x !== id),
        })),

      toggleUni: (id) => {
        if (get().savedUniIds.includes(id)) {
          get().unsaveUni(id);
        } else {
          get().saveUni(id);
        }
      },

      isUniSaved: (id) => get().savedUniIds.includes(id),
    }),
    {
      name: SAVED_UNI_KEY,
      storage: createJSONStorage(() => plainArrayStorage),
    },
  ),
);
