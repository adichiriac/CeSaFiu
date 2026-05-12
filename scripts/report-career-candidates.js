#!/usr/bin/env node
/**
 * Print a candidate-career longlist report before promoting items to careers.json.
 */
const {loadCandidateData, loadCanonicalData} = require('./data-source');

const data = loadCanonicalData();
const careers = data.careers ?? [];
const candidates = loadCandidateData();

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

function weightedScore(candidate) {
  return Math.round(
    0.35 * candidate.marketScoreRo +
      0.25 * candidate.marketScoreEu +
      0.2 * candidate.futureScore +
      0.1 * candidate.accessibilityScore +
      0.1 * diversityScore(candidate)
  );
}

function diversityScore(candidate) {
  const domainSize = candidates.filter((item) => item.domain === candidate.domain).length;
  if (domainSize <= 4) return 90;
  if (domainSize <= 8) return 75;
  if (domainSize <= 12) return 60;
  return 45;
}

const existingIds = new Set(careers.map((career) => career.id));
const duplicateCandidates = candidates.filter((candidate) => existingIds.has(candidate.id));
const promotableCandidates = candidates.filter((candidate) => candidate.reviewStatus !== 'reject');

console.log('Career Candidate Report');
console.log('=======================');
console.log(`Current careers: ${careers.length}`);
console.log(`Candidate careers: ${candidates.length}`);
console.log(`Projected total if promoted: ${careers.length + promotableCandidates.length - duplicateCandidates.length}`);

console.log('\nReview status distribution');
console.log(formatRows(countBy(candidates, (candidate) => [candidate.reviewStatus])));

console.log('\nDomain distribution');
console.log(formatRows(countBy(candidates, (candidate) => [candidate.domain]), 30));

console.log('\nSuggested path distribution');
console.log(formatRows(countBy(candidates, (candidate) => [candidate.suggestedPathType])));

console.log('\nSuggested RIASEC primary distribution');
console.log(formatRows(countBy(candidates, (candidate) => [candidate.suggestedRiasec?.[0]])));

console.log('\nTop candidate priorities');
console.log(
  candidates
    .map((candidate) => ({candidate, score: weightedScore(candidate)}))
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id))
    .slice(0, 30)
    .map(({candidate, score}) => {
      const refs = candidate.sourceRefs?.slice(0, 2).join(' + ') ?? 'no refs';
      return `  ${String(score).padStart(3)}  ${candidate.id} — ${candidate.name} (${candidate.domain}; ${refs})`;
    })
    .join('\n')
);

if (duplicateCandidates.length) {
  console.log('\nDuplicate candidate ids already in careers.json');
  console.log(duplicateCandidates.map((candidate) => `  - ${candidate.id}`).join('\n'));
}
