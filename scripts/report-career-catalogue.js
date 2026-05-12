#!/usr/bin/env node
/**
 * Print a compact catalogue coverage report for editorial planning.
 */
const {loadCanonicalData} = require('./data-source');

const data = loadCanonicalData();
const careers = data.careers ?? [];
const programs = data.programs ?? [];

function countBy(items, getKeys) {
  const counts = new Map();
  for (const item of items) {
    const keys = getKeys(item).filter(Boolean);
    for (const key of keys.length ? keys : ['(none)']) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function formatRows(rows, limit = 20) {
  return rows
    .slice(0, limit)
    .map(([key, count]) => `  ${String(count).padStart(3)}  ${key}`)
    .join('\n');
}

const programCountsByCareer = new Map();
for (const program of programs) {
  for (const careerId of program.careerIds ?? []) {
    programCountsByCareer.set(careerId, (programCountsByCareer.get(careerId) ?? 0) + 1);
  }
}

const orphanCareers = careers.filter((career) => !programCountsByCareer.has(career.id));
const metadataFields = [
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

console.log('Career Catalogue Report');
console.log('=======================');
console.log(`Careers: ${careers.length}`);
console.log(`Programs: ${programs.length}`);
console.log(`Careers with at least one program: ${careers.length - orphanCareers.length}`);
console.log(`Careers without programs: ${orphanCareers.length}`);

console.log('\nPath distribution');
console.log(formatRows(countBy(careers, (career) => [career.pathType])));

console.log('\nRIASEC primary distribution');
console.log(formatRows(countBy(careers, (career) => [career.riasec?.[0]])));

console.log('\nBig Five anchor distribution');
console.log(formatRows(countBy(careers, (career) => career.big5 ?? [])));

console.log('\nMetadata coverage');
for (const field of metadataFields) {
  const present = careers.filter((career) => career[field] !== undefined).length;
  console.log(`  ${String(present).padStart(3)}/${careers.length}  ${field}`);
}

console.log('\nTop careers by linked program count');
console.log(
  [...programCountsByCareer.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([careerId, count]) => `  ${String(count).padStart(3)}  ${careerId}`)
    .join('\n')
);

if (orphanCareers.length) {
  console.log('\nCareers without linked programs');
  console.log(orphanCareers.slice(0, 40).map((career) => `  - ${career.id} (${career.name})`).join('\n'));
  if (orphanCareers.length > 40) {
    console.log(`  ...and ${orphanCareers.length - 40} more`);
  }
}
