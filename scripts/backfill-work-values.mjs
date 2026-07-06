/**
 * Backfill estimated O*NET-style work-values vectors into data/careers.json.
 *
 * No career has an O*NET crosswalk yet, so ALL vectors are heuristic estimates
 * (workValuesSource: 'estimated') derived from riasec / pathType / traits /
 * demand / text signals — the profile SHAPE matters (the matcher ipsative-
 * centers before cosine), not absolute levels. Replace with real O*NET
 * occupation ratings when the corCode/escoUri→SOC crosswalk lands (V4 plan,
 * docs/WORK-VALUES-PLAN.md §matching).
 *
 * Idempotent: recomputes every career whose workValuesSource is missing or
 * 'estimated'; never touches a career with workValuesSource 'onet' | 'manual'.
 *
 * Run: node scripts/backfill-work-values.mjs
 */

import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const careersPath = path.join(rootDir, 'data', 'careers.json');

const VALUE_KEYS = ['achievement', 'independence', 'recognition', 'relationships', 'support', 'conditions'];

/** RIASEC → value deltas, applied ×1.0 / ×0.7 / ×0.4 by code position. */
const RIASEC_DELTAS = {
  R: {achievement: 2, independence: 2, recognition: -4, relationships: -2, support: 4, conditions: 8},
  I: {achievement: 10, independence: 8, recognition: 2, relationships: -4, support: 0, conditions: 0},
  A: {achievement: 10, independence: 12, recognition: 4, relationships: -2, support: -8, conditions: -6},
  S: {achievement: 4, independence: -4, recognition: 0, relationships: 14, support: 4, conditions: 0},
  E: {achievement: 8, independence: 6, recognition: 14, relationships: 2, support: -4, conditions: 0},
  C: {achievement: -2, independence: -8, recognition: 0, relationships: 0, support: 10, conditions: 10},
};

const PATH_DELTAS = {
  freelance: {independence: 15, support: -10, conditions: -5, recognition: 3},
  creator: {independence: 15, support: -10, conditions: -6, recognition: 5, achievement: 4},
  antreprenor: {independence: 15, recognition: 8, achievement: 8, support: -12, conditions: -8},
  profesional: {conditions: 8, support: 6, relationships: 2, independence: -2},
  facultate: {recognition: 4, achievement: 4},
  autodidact: {independence: 8},
  mixt: {independence: 4},
};

const TRAIT_DELTAS = {
  lead: {recognition: 8, independence: 2},
  social: {relationships: 8},
  create: {achievement: 4, independence: 4},
  analyze: {achievement: 4},
  build: {achievement: 2, conditions: 2},
  tech: {achievement: 2, conditions: 2},
  visual: {independence: 2},
};

/** Text-pattern nudges for sectors the structured fields under-describe. */
const TEXT_RULES = [
  // Public sector / uniformed: strong employer backing + security, low autonomy.
  {re: /polițist|jandarm|militar|ofițer|pompier|funcționar public|isu|mapn|sri/i, d: {support: 8, conditions: 8, independence: -8, relationships: 2}},
  // Education: service + stability.
  {re: /profesor|învățător|educator|pedagog|logoped/i, d: {relationships: 6, conditions: 4, support: 4, recognition: -2}},
  // Health: service under institutional structure.
  {re: /medic|asistent medical|spital|farmacist|stomatolog|paramedic|smurd/i, d: {relationships: 6, achievement: 4, conditions: 4, recognition: 2}},
  // Law / finance: prestige + advancement ladders.
  {re: /avocat|jurist|notar|judecător|bancar|audit|consultant/i, d: {recognition: 8, achievement: 4, conditions: 2}},
  // Care / NGO: service dominant, compensation secondary.
  {re: /ong|voluntar|social worker|asistent social|îngrijitor/i, d: {relationships: 10, conditions: -4, recognition: -4}},
];

const DEMAND_DELTAS = [
  {re: /extremă|foarte mare|creștere accelerată/i, d: {conditions: 5}},
  {re: /^mare$|în creștere/i, d: {conditions: 3}},
  {re: /saturată/i, d: {conditions: -4}},
];

function estimate(career) {
  const v = Object.fromEntries(VALUE_KEYS.map((k) => [k, 50]));
  const apply = (deltas, factor = 1) => {
    for (const [key, delta] of Object.entries(deltas ?? {})) {
      v[key] += delta * factor;
    }
  };

  (career.riasec ?? []).forEach((code, i) => {
    apply(RIASEC_DELTAS[code], [1, 0.7, 0.4][i] ?? 0.3);
  });
  apply(PATH_DELTAS[career.pathType]);
  (career.traits ?? []).forEach((t) => apply(TRAIT_DELTAS[t]));

  const haystack = [career.id, career.name, career.tagline, career.description].join(' ');
  for (const rule of TEXT_RULES) {
    if (rule.re.test(haystack)) apply(rule.d);
  }
  for (const rule of DEMAND_DELTAS) {
    if (rule.re.test(career.demand ?? '')) {
      apply(rule.d);
      break;
    }
  }

  for (const key of VALUE_KEYS) {
    v[key] = Math.round(Math.min(90, Math.max(10, v[key])));
  }
  return v;
}

const careers = JSON.parse(readFileSync(careersPath, 'utf8'));
let updated = 0;
let skipped = 0;

for (const career of careers) {
  if (career.workValuesSource && career.workValuesSource !== 'estimated') {
    skipped += 1;
    continue;
  }
  career.workValues = estimate(career);
  career.workValuesSource = 'estimated';
  updated += 1;
}

writeFileSync(careersPath, `${JSON.stringify(careers, null, 2)}\n`);
console.log(`work values: ${updated} estimated, ${skipped} kept (non-estimated source), ${careers.length} total`);
