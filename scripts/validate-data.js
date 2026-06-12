#!/usr/bin/env node
/**
 * Validate the canonical /data source before building app artifacts.
 */
const {loadCandidateData, loadCanonicalData} = require('./data-source');

const data = loadCanonicalData();
const candidateCareers = loadCandidateData();
const errors = [];
const warnings = [];
const CAREER_STATUSES = new Set(['active', 'draft', 'deprecated']);
const CANDIDATE_STATUSES = new Set(['candidate', 'promote', 'promoted', 'merge', 'reject']);
const RIASEC_CODES = new Set(['R', 'I', 'A', 'S', 'E', 'C']);
const OPTIONAL_CAREER_FIELDS = [
  'corCode',
  'escoUri',
  'iscoGroup',
  'marketScoreRo',
  'marketScoreEu',
  'futureScore',
  'accessibilityScore',
  'sourceRefs',
  'lastReviewed',
];

function requireArray(name) {
  if (!Array.isArray(data[name])) {
    errors.push(`${name} must be an array`);
    return [];
  }
  return data[name];
}

function checkUniqueIds(name, items) {
  const seen = new Set();
  for (const item of items) {
    if (!item || typeof item.id !== 'string' || !item.id.trim()) {
      errors.push(`${name} item is missing a string id`);
      continue;
    }
    if (seen.has(item.id)) {
      errors.push(`${name} has duplicate id: ${item.id}`);
    }
    seen.add(item.id);
  }
  return seen;
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function validateOptionalScore(item, key, label) {
  const value = item[key];
  if (value === undefined) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    errors.push(`${label} ${item.id} has invalid ${key}; expected number 0-100`);
  }
}

function validateRequiredScore(item, key, label) {
  const value = item[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    errors.push(`${label} ${item.id} has invalid ${key}; expected number 0-100`);
  }
}

function validateRiasec(item, key, label) {
  const value = item[key];
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label} ${item.id} is missing ${key}`);
    return;
  }
  for (const code of value) {
    if (!RIASEC_CODES.has(code)) {
      errors.push(`${label} ${item.id} has invalid ${key} code: ${code}`);
    }
  }
}

const careers = requireArray('careers');
const paths = requireArray('paths');
const universities = requireArray('universities');
const programs = requireArray('programs');

const careerIds = checkUniqueIds('careers', careers);
const pathIds = checkUniqueIds('paths', paths);
const universityIds = checkUniqueIds('universities', universities);
checkUniqueIds('programs', programs);
checkUniqueIds('questions', requireArray('questions'));

for (const career of careers) {
  if (!career.name) errors.push(`career ${career.id} is missing name`);
  if (!career.pathType) errors.push(`career ${career.id} is missing pathType`);
  if (!Array.isArray(career.riasec) || career.riasec.length === 0) {
    errors.push(`career ${career.id} is missing riasec`);
  }
  if (career.pathType && !pathIds.has(career.pathType) && career.pathType !== 'mixt') {
    errors.push(`career ${career.id} has unknown pathType: ${career.pathType}`);
  }
  if (career.status && !CAREER_STATUSES.has(career.status)) {
    errors.push(`career ${career.id} has invalid status: ${career.status}`);
  }
  ['marketScoreRo', 'marketScoreEu', 'futureScore', 'accessibilityScore'].forEach((key) =>
    validateOptionalScore(career, key, 'career')
  );
  if (career.sourceRefs !== undefined && (!Array.isArray(career.sourceRefs) || career.sourceRefs.some((ref) => typeof ref !== 'string' || !ref.trim()))) {
    errors.push(`career ${career.id} has invalid sourceRefs; expected non-empty string array`);
  }
  if (career.lastReviewed !== undefined && !isValidDateString(career.lastReviewed)) {
    errors.push(`career ${career.id} has invalid lastReviewed; expected YYYY-MM-DD`);
  }
}

for (const program of programs) {
  if (!program.name) errors.push(`program ${program.id} is missing name`);
  if (!universityIds.has(program.universityId)) {
    errors.push(`program ${program.id} references missing universityId: ${program.universityId}`);
  }
  if (!Array.isArray(program.careerIds) || program.careerIds.length === 0) {
    errors.push(`program ${program.id} must reference at least one careerId`);
  } else {
    for (const careerId of program.careerIds) {
      if (!careerIds.has(careerId)) {
        errors.push(`program ${program.id} references missing careerId: ${careerId}`);
      }
    }
  }
}

const careerCoverage = Object.fromEntries(
  OPTIONAL_CAREER_FIELDS.map((field) => [field, careers.filter((career) => career[field] !== undefined).length])
);
const missingMarketMetadata = careers.filter(
  (career) => career.marketScoreRo === undefined || career.marketScoreEu === undefined || career.futureScore === undefined
).length;
if (missingMarketMetadata > 0) {
  warnings.push(`${missingMarketMetadata}/${careers.length} careers are missing one or more market/future scores`);
}
if (careerCoverage.sourceRefs < careers.length) {
  warnings.push(`${careers.length - careerCoverage.sourceRefs}/${careers.length} careers are missing sourceRefs`);
}
if (careerCoverage.lastReviewed < careers.length) {
  warnings.push(`${careers.length - careerCoverage.lastReviewed}/${careers.length} careers are missing lastReviewed`);
}

checkUniqueIds('career candidates', candidateCareers);

for (const candidate of candidateCareers) {
  if (!candidate.name) errors.push(`career candidate ${candidate.id} is missing name`);
  if (!candidate.domain) errors.push(`career candidate ${candidate.id} is missing domain`);
  if (!candidate.suggestedPathType) errors.push(`career candidate ${candidate.id} is missing suggestedPathType`);
  validateRiasec(candidate, 'suggestedRiasec', 'career candidate');
  ['marketScoreRo', 'marketScoreEu', 'futureScore', 'accessibilityScore'].forEach((key) =>
    validateRequiredScore(candidate, key, 'career candidate')
  );
  if (!Array.isArray(candidate.sourceRefs) || candidate.sourceRefs.some((ref) => typeof ref !== 'string' || !ref.trim())) {
    errors.push(`career candidate ${candidate.id} has invalid sourceRefs; expected non-empty string array`);
  }
  if (!candidate.reviewStatus || !CANDIDATE_STATUSES.has(candidate.reviewStatus)) {
    errors.push(`career candidate ${candidate.id} has invalid reviewStatus: ${candidate.reviewStatus}`);
  }
  if (careerIds.has(candidate.id) && candidate.reviewStatus === 'candidate') {
    errors.push(`active career candidate duplicates existing career id: ${candidate.id}`);
  }
}

const activeCandidateCount = candidateCareers.filter((candidate) => candidate.reviewStatus === 'candidate').length;
if (activeCandidateCount > 0 && activeCandidateCount < 85) {
  warnings.push(`${activeCandidateCount} active career candidates remain; target longlist is 85+ before top-200 selection`);
}

if (errors.length) {
  console.error(`Data validation failed with ${errors.length} error(s):`);
  errors.slice(0, 80).forEach((error) => console.error(`- ${error}`));
  if (errors.length > 80) {
    console.error(`...and ${errors.length - 80} more`);
  }
  process.exit(1);
}

console.log(
  `Data OK: ${careers.length} careers, ${candidateCareers.length} candidates, ${universities.length} institutions, ${programs.length} programs, ${paths.length} paths`
);
if (warnings.length) {
  console.warn(`Data warnings (${warnings.length}):`);
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}
