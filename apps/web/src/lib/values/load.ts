import {readFileSync} from 'node:fs';
import path from 'node:path';
import type {WorkValuesDefinition} from './types';

const rootDir = path.resolve(process.cwd(), '../..');

/** Server-only loader for data/work-values.json. */
export function getWorkValuesDefinition(): WorkValuesDefinition {
  const file = path.join(rootDir, 'data', 'work-values.json');
  return JSON.parse(readFileSync(file, 'utf8')) as WorkValuesDefinition;
}
