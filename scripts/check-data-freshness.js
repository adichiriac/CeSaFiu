#!/usr/bin/env node
// check-data-freshness.js — flags Career/Program/Institution records whose
// `lastReviewed` is older than the threshold. Per DATA-ARCHITECTURE.md, RO
// admission cycles wrap each September; programs should be re-verified
// within 12 months of that. RIASEC profiles drift slower; biennial is fine.
//
// Usage: node scripts/check-data-freshness.js
//        node scripts/check-data-freshness.js --strict   # fail on any warning
//        node scripts/check-data-freshness.js --quiet    # only summary
//
// This is intentionally NOT blocking (no exit-1 by default) — its job is
// to surface stale data for the next maintenance pass, not gate commits.

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'cesafiu_prototype_v1', 'project', 'data.js');
const THRESHOLDS_MONTHS = {
  programs: 12,        // admission scores change yearly
  careers: 24,         // labor-market drift is slower
  universities: 24,    // institution metadata is mostly stable
};

function parseDataJs() {
  const code = fs.readFileSync(DATA_PATH, 'utf8');
  const window = {};
  // eslint-disable-next-line no-eval
  eval(code);
  return window.QUIZ_DATA;
}

function monthsAgo(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  const ms = Date.now() - d.getTime();
  return ms / (1000 * 60 * 60 * 24 * 30.44);
}

function check() {
  const args = new Set(process.argv.slice(2));
  const strict = args.has('--strict');
  const quiet = args.has('--quiet');

  const data = parseDataJs();
  const findings = { programs: [], careers: [], universities: [] };

  ['programs', 'careers', 'universities'].forEach((kind) => {
    const items = data[kind] || [];
    const threshold = THRESHOLDS_MONTHS[kind];
    items.forEach((item) => {
      const months = monthsAgo(item.lastReviewed);
      if (months > threshold) {
        findings[kind].push({
          id: item.id,
          name: item.name,
          lastReviewed: item.lastReviewed || '(never)',
          monthsStale: months === Infinity ? null : Math.round(months),
        });
      }
    });
  });

  let totalStale = 0;
  Object.entries(findings).forEach(([kind, list]) => {
    totalStale += list.length;
    const total = (data[kind] || []).length;
    if (!quiet || list.length > 0) {
      console.log(`\n${kind.toUpperCase()}: ${list.length} stale of ${total} (threshold ${THRESHOLDS_MONTHS[kind]} months)`);
    }
    if (!quiet) {
      list.slice(0, 20).forEach((f) => {
        const age = f.monthsStale === null ? 'no lastReviewed' : `${f.monthsStale} months old`;
        console.log(`  ${f.id.padEnd(36)} ${age.padEnd(20)} ${f.name || ''}`);
      });
      if (list.length > 20) console.log(`  …and ${list.length - 20} more`);
    }
  });

  console.log(`\nTotal stale: ${totalStale}`);
  if (strict && totalStale > 0) {
    console.error('--strict set; exiting with code 1');
    process.exit(1);
  }
}

check();
