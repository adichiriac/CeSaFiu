/**
 * Drumul tău — server-side loader for /data/journey-paths.json.
 * Server-only — never import from client components (pass via page props).
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';

import type {JourneyPathsData} from './types';

const rootDir = path.resolve(process.cwd(), '../..');

let _cached: JourneyPathsData | null = null;

export function getJourneyPaths(): JourneyPathsData {
  if (_cached) return _cached;

  const raw = JSON.parse(
    readFileSync(path.join(rootDir, 'data', 'journey-paths.json'), 'utf8'),
  ) as Record<string, unknown>;

  // Strip non-path keys (e.g. "_comment").
  const data: JourneyPathsData = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('_')) continue;
    data[key] = value as JourneyPathsData[string];
  }

  _cached = data;
  return data;
}
