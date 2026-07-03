#!/usr/bin/env node
// review-data.js — generates the periodic data-review report for
// institutions + programs: stale admission deadlines, missing URLs,
// missing/old lastReviewed stamps, incomplete admission info.
//
// Complements (does not replace):
//   validate-data.js         — structural integrity (blocking)
//   check-data-freshness.js  — lastReviewed staleness thresholds
//   check-links.js           — URL health (run separately; folded in here
//                              if a report from the last 30 days exists)
//
// Usage: node scripts/review-data.js
//        node scripts/review-data.js --strict   # exit 1 if any CRITICAL
//
// Writes reports/data-review-YYYY-MM-DD.md. Process: docs/DATA-REVIEW-PROCESS.md

const fs = require('fs');
const path = require('path');
const {loadCanonicalData, repoRoot} = require('./data-source');

// RO admission cycles wrap each September: from Sept, "current cycle" is next
// calendar year's intake. A deadlineYear older than the current cycle is stale.
function currentCycleYear(now = new Date()) {
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
}

function findRecentLinkReport(maxAgeDays = 30) {
  const dir = path.join(repoRoot, 'reports');
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => /^link-check-\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse();
  if (!files.length) return null;
  const latest = files[0];
  const date = latest.match(/(\d{4}-\d{2}-\d{2})/)[1];
  const ageDays = (Date.now() - new Date(date).getTime()) / 86400000;
  if (ageDays > maxAgeDays) return null;
  return {date, ...JSON.parse(fs.readFileSync(path.join(dir, latest), 'utf8'))};
}

function main() {
  const strict = process.argv.includes('--strict');
  const data = loadCanonicalData();
  const programs = data.programs || [];
  const institutions = data.universities || [];
  const cycle = currentCycleYear();

  // findings: {severity: CRITICAL|WARN|INFO, kind, id, issue}
  const findings = [];
  const add = (severity, kind, id, issue) => findings.push({severity, kind, id, issue});

  // --- Programs ---
  for (const p of programs) {
    const a = p.admission || {};
    if (!p.admission) add('CRITICAL', 'program', p.id, 'no admission object');
    if (a.deadlineYear && a.deadlineYear < cycle)
      add('CRITICAL', 'program', p.id, `admission.deadlineYear=${a.deadlineYear} < current cycle ${cycle} — verify + update`);
    if (p.admission && !a.deadlineYear)
      add('WARN', 'program', p.id, `admission.deadline="${a.deadline || '?'}" has no deadlineYear — staleness undetectable`);
    if (p.admission && !a.tuition) add('INFO', 'program', p.id, 'admission.tuition missing');
    if (!p.url) add('WARN', 'program', p.id, 'no url — user cannot verify the program');
    if (!p.lastReviewed) add('WARN', 'program', p.id, 'no lastReviewed stamp');
  }

  // --- Institutions ---
  for (const i of institutions) {
    if (!i.url) add('WARN', 'institution', i.id, 'no url');
    if (!i.lastReviewed) add('INFO', 'institution', i.id, 'no lastReviewed stamp');
  }

  // --- Fold in recent link-check results ---
  const linkReport = findRecentLinkReport();
  if (linkReport) {
    for (const r of linkReport.results) {
      if (r.status === 'BROKEN') add('CRITICAL', r.kind, r.id, `dead link: ${r.url} (${r.error || r.code})`);
      if (r.status === 'HOME-REDIRECT')
        add('CRITICAL', r.kind, r.id, `link collapses to homepage: ${r.url} → ${r.finalUrl}`);
      if (r.status === 'CROSS-DOMAIN')
        add('WARN', r.kind, r.id, `link redirects off-domain: ${r.url} → ${r.finalUrl}`);
    }
  }

  // --- Report ---
  const date = new Date().toISOString().slice(0, 10);
  const bySeverity = (s) => findings.filter((f) => f.severity === s);
  const counts = {
    CRITICAL: bySeverity('CRITICAL').length,
    WARN: bySeverity('WARN').length,
    INFO: bySeverity('INFO').length,
  };

  const lines = [
    `# Data review — ${date}`,
    '',
    `Admission cycle under review: **${cycle}**. Programs: ${programs.length} · Institutions: ${institutions.length}.`,
    linkReport
      ? `Link-check folded in (from ${linkReport.date}).`
      : '⚠️ No link-check report from the last 30 days — run `npm run data:links` first for full coverage.',
    '',
    `**CRITICAL: ${counts.CRITICAL}** · WARN: ${counts.WARN} · INFO: ${counts.INFO}`,
    '',
  ];
  for (const severity of ['CRITICAL', 'WARN', 'INFO']) {
    const rows = bySeverity(severity);
    if (!rows.length) continue;
    lines.push(`## ${severity} (${rows.length})`, '');
    // Group by issue type so 300 identical warnings read as one section.
    const groups = new Map();
    for (const f of rows) {
      const key = f.issue.replace(/[=:"].*$/, '').trim();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f);
    }
    for (const [key, items] of groups) {
      lines.push(`### ${key} (${items.length})`, '');
      for (const f of items.slice(0, 400)) lines.push(`- \`${f.kind}/${f.id}\` — ${f.issue}`);
      lines.push('');
    }
  }
  lines.push(
    '## Review protocol',
    '',
    'For each CRITICAL item: open the institution site, verify the current fact, update `data/*.json`, and stamp `lastReviewed` with today\'s date. See docs/DATA-REVIEW-PROCESS.md.',
    ''
  );

  const dir = path.join(repoRoot, 'reports');
  fs.mkdirSync(dir, {recursive: true});
  const mdPath = path.join(dir, `data-review-${date}.md`);
  fs.writeFileSync(mdPath, lines.join('\n'));

  console.log(`CRITICAL: ${counts.CRITICAL} · WARN: ${counts.WARN} · INFO: ${counts.INFO}`);
  console.log(`Report: ${path.relative(repoRoot, mdPath)}`);
  if (strict && counts.CRITICAL > 0) process.exit(1);
}

main();
