/**
 * Ce Să Fiu? — Careers data loader
 *
 * Reads careers, institutions, and programs from the canonical /data JSON
 * source. The prototype data.js is now a generated compatibility artifact.
 * In Phase 3 this can be replaced by Supabase queries, but the same exported
 * functions are the contract.
 *
 * Server-only — never imported from client components.
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';

import type {Career} from '@/lib/matcher';
import type {CareersData, Institution, PathEntry, Program} from './types';

// Resolve path relative to the monorepo root (two levels up from apps/web)
const rootDir = path.resolve(process.cwd(), '../..');
const DATA_DIR = path.join(rootDir, 'data');

type RawData = {
  careers: Career[];
  universities: Institution[];
  programs: Program[];
  paths: PathEntry[];
};

let _cached: RawData | null = null;

function readJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(path.join(DATA_DIR, fileName), 'utf8')) as T;
}

function loadRaw(): RawData {
  if (_cached) return _cached;

  _cached = {
    careers: readJson<Career[]>('careers.json'),
    universities: readJson<Institution[]>('institutions.json'),
    programs: readJson<Program[]>('programs.json'),
    paths: readJson<PathEntry[]>('paths.json'),
  };

  return _cached;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function getAllCareers(): Career[] {
  return loadRaw().careers;
}

export function getCareerById(id: string): Career | undefined {
  return loadRaw().careers.find((c) => c.id === id);
}

export function getAllInstitutions(): Institution[] {
  return loadRaw().universities;
}

export function getInstitutionById(id: string): Institution | undefined {
  return loadRaw().universities.find((i) => i.id === id);
}

export function getAllPrograms(): Program[] {
  return loadRaw().programs;
}

export function getProgramsForCareer(careerId: string): Array<Program & {institution?: Institution}> {
  const raw = loadRaw();
  const programs = raw.programs.filter((p) => p.careerIds?.includes(careerId));
  return programs.map((p) => ({
    ...p,
    institution: raw.universities.find((u) => u.id === p.universityId),
  }));
}

export function getProgramsForInstitution(universityId: string): Array<Program & {careers: Career[]}> {
  const raw = loadRaw();
  const programs = raw.programs.filter((p) => p.universityId === universityId);
  return programs.map((p) => ({
    ...p,
    careers: (p.careerIds ?? [])
      .map((id) => raw.careers.find((c) => c.id === id))
      .filter(Boolean) as Career[],
  }));
}

export function getAllPaths(): PathEntry[] {
  return loadRaw().paths;
}

export function getCareersData(): CareersData {
  const raw = loadRaw();
  return {
    careers: raw.careers,
    institutions: raw.universities,
    programs: raw.programs,
    paths: raw.paths,
  };
}
