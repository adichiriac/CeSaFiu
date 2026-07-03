'use client';

/**
 * Ce Să Fiu? — shared career-match hook (Explore redesign, plan §4 M0)
 *
 * Same source of truth as the rezultate page: stored test results from
 * localStorage → POST /api/match. Cached at module level so browse and
 * rezultate don't refetch on every SPA navigation; a full page reload
 * naturally invalidates it. The cache is keyed by the request body, so
 * finishing another test (which changes stored results) triggers a refetch.
 */

import {useEffect, useState} from 'react';
import {buildMatchRequest, readStoredResults} from '@/stores/quiz-store';
import type {CareerMatch, MatchResult, NextTestSuggestion, UserProfile} from '@/lib/matcher';
import type {WorldId} from '@/lib/results/worlds';

export type MatchesStatus = 'loading' | 'no-data' | 'ready' | 'error';

export type MatchesState = {
  status: MatchesStatus;
  /** Assembled MatchResult (matches array + confidence/sources/userProfile/nextTest/worlds). Null unless ready. */
  result: MatchResult | null;
};

type MatchApiResponse = {
  matches: CareerMatch[];
  confidence: number;
  sources: string[];
  userProfile: UserProfile;
  nextTest: NextTestSuggestion | null;
  worlds?: WorldId[];
};

let cacheKey: string | null = null;
let cachePromise: Promise<MatchResult> | null = null;

function assemble(data: MatchApiResponse): MatchResult {
  return Object.assign(data.matches ?? [], {
    confidence: data.confidence,
    sources: data.sources,
    userProfile: data.userProfile,
    nextTest: data.nextTest,
    worlds: data.worlds ?? [],
  }) as unknown as MatchResult;
}

function fetchMatches(body: unknown, key: string): Promise<MatchResult> {
  if (cacheKey === key && cachePromise) return cachePromise;
  cacheKey = key;
  cachePromise = fetch('/api/match', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: key,
  })
    .then((r) => {
      if (!r.ok) throw new Error(`match api ${r.status}`);
      return r.json() as Promise<MatchApiResponse>;
    })
    .then(assemble)
    .catch((error) => {
      // Don't poison the cache with a failure — allow the next mount to retry.
      if (cacheKey === key) {
        cacheKey = null;
        cachePromise = null;
      }
      throw error;
    });
  return cachePromise;
}

/**
 * Read the user's career matches. Returns `no-data` (result null) when no
 * test has been completed yet — callers render their empty state, never spin.
 */
export function useMatches(): MatchesState {
  const [state, setState] = useState<MatchesState>({status: 'loading', result: null});

  useEffect(() => {
    let cancelled = false;

    const stored = readStoredResults();
    if (!Object.values(stored).some(Boolean)) {
      setState({status: 'no-data', result: null});
      return;
    }

    const body = buildMatchRequest(stored);
    const key = JSON.stringify(body);

    fetchMatches(body, key)
      .then((result) => {
        if (!cancelled) setState({status: 'ready', result});
      })
      .catch(() => {
        if (!cancelled) setState({status: 'error', result: null});
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
