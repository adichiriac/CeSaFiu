/**
 * Ce Să Fiu? — Careers data loader
 *
 * Reads careers, institutions, and programs from the prototype data.js.
 * This is the Phase 1/Phase 2 bridge: in Phase 3 this will be replaced
 * by Supabase queries, but the same exported functions are the contract.
 *
 * Server-only — never imported from client components.
 */
import {readFileSync} from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

import type {Career} from '@/lib/matcher';
import type {CareersData, Institution, PathEntry, Program} from './types';

// Resolve path relative to the monorepo root (two levels up from apps/web)
const rootDir = path.resolve(process.cwd(), '../..');
const DATA_FILE = path.join(rootDir, 'cesafiu_prototype_v3/project/data.js');

type RawData = {
  careers: Career[];
  universities: Institution[];
  programs: Program[];
  paths: PathEntry[];
};

let _cached: RawData | null = null;

function loadRaw(): RawData {
  if (_cached) return _cached;

  const code = readFileSync(DATA_FILE, 'utf8');
  const context = {window: {} as {QUIZ_DATA?: RawData & Record<string, unknown>}};
  vm.runInNewContext(code, context, {filename: DATA_FILE});

  if (!context.window.QUIZ_DATA) {
    throw new Error('Failed to load QUIZ_DATA from data.js');
  }

  _cached = {
    careers: context.window.QUIZ_DATA.careers ?? [],
    universities: context.window.QUIZ_DATA.universities ?? [],
    programs: context.window.QUIZ_DATA.programs ?? [],
    paths: context.window.QUIZ_DATA.paths ?? [],
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
