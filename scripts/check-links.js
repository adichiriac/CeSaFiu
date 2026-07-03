#!/usr/bin/env node
// check-links.js — validates every URL in institutions.json and programs.json.
//
// Detects the failure modes users actually hit:
//   BROKEN        — 4xx/5xx, DNS failure, timeout
//   HOME-REDIRECT — deep link silently redirects to the site homepage
//                   (the "clicked and landed on the wrong page" symptom)
//   CROSS-DOMAIN  — redirects to a different domain (site moved / expired)
//   REDIRECT      — same-domain path change (usually fine; update the URL)
//   OK            — 2xx at the requested path
//
// Usage: node scripts/check-links.js            # full run, writes report
//        node scripts/check-links.js --strict   # exit 1 if BROKEN > 0
//        node scripts/check-links.js --only=umfiasi.ro   # filter by substring
//
// Requires Node >= 18 (global fetch). Run locally — needs open internet.
// Writes reports/link-check-YYYY-MM-DD.{md,json}.

const fs = require('fs');
const path = require('path');
const {loadCanonicalData, repoRoot} = require('./data-source');

const TIMEOUT_MS = 15000;
const CONCURRENCY = 8;
const MAX_REDIRECTS = 5;
const UA =
  'Mozilla/5.0 (compatible; CeSaFiuLinkCheck/1.0; +https://cesafiu.ro) data maintenance bot';

function collectTargets(data) {
  const targets = [];
  for (const inst of data.universities || []) {
    if (inst.url) targets.push({kind: 'institution', id: inst.id, name: inst.name, url: inst.url});
  }
  for (const prog of data.programs || []) {
    if (prog.url)
      targets.push({
        kind: 'program',
        id: prog.id,
        name: prog.name,
        universityId: prog.universityId,
        url: prog.url,
      });
  }
  return targets;
}

async function fetchOnce(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      method,
      redirect: 'manual',
      signal: controller.signal,
      headers: {'user-agent': UA, accept: 'text/html,*/*'},
    });
  } finally {
    clearTimeout(timer);
  }
}

// Follow redirects manually so we can report the chain and the final URL.
async function probe(url) {
  let current = url;
  const chain = [];
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res;
    try {
      res = await fetchOnce(current, 'HEAD');
      // Some servers reject or mis-handle HEAD — retry that hop with GET
      // before classifying the URL as broken.
      if (res.status >= 400) {
        res = await fetchOnce(current, 'GET');
      }
    } catch (err) {
      // Network-level failure on HEAD can also be method-related; one GET retry.
      try {
        res = await fetchOnce(current, 'GET');
      } catch (err2) {
        return {status: 'BROKEN', code: null, finalUrl: current, chain, error: shortErr(err2)};
      }
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return {status: 'BROKEN', code: res.status, finalUrl: current, chain, error: 'redirect without location'};
      const next = new URL(loc, current).href;
      chain.push({from: current, to: next, code: res.status});
      current = next;
      continue;
    }
    if (res.status >= 200 && res.status < 300) {
      return classifySuccess(url, current, chain, res.status);
    }
    return {status: 'BROKEN', code: res.status, finalUrl: current, chain, error: `HTTP ${res.status}`};
  }
  return {status: 'BROKEN', code: null, finalUrl: current, chain, error: 'too many redirects'};
}

function classifySuccess(originalUrl, finalUrl, chain, code) {
  if (chain.length === 0) return {status: 'OK', code, finalUrl, chain};
  const orig = new URL(originalUrl);
  const fin = new URL(finalUrl);
  const stripWww = (h) => h.replace(/^www\./, '');
  const origPathDepth = orig.pathname.replace(/\/+$/, '');
  const finPath = fin.pathname.replace(/\/+$/, '');
  if (stripWww(orig.hostname) !== stripWww(fin.hostname)) {
    return {status: 'CROSS-DOMAIN', code, finalUrl, chain};
  }
  // Deep link collapsed to homepage → almost always a dead page swallowed by the CMS.
  if (origPathDepth !== '' && finPath === '') {
    return {status: 'HOME-REDIRECT', code, finalUrl, chain};
  }
  return {status: 'REDIRECT', code, finalUrl, chain};
}

function shortErr(err) {
  if (err.name === 'AbortError') return 'timeout';
  return (err.cause && err.cause.code) || err.message || String(err);
}

async function runPool(targets) {
  const results = [];
  let i = 0;
  let done = 0;
  async function worker() {
    while (i < targets.length) {
      const t = targets[i++];
      const r = await probe(t.url);
      results.push({...t, ...r});
      done++;
      if (done % 20 === 0) process.stderr.write(`  ${done}/${targets.length}\n`);
    }
  }
  await Promise.all(Array.from({length: CONCURRENCY}, worker));
  return results;
}

const ORDER = ['BROKEN', 'HOME-REDIRECT', 'CROSS-DOMAIN', 'REDIRECT', 'OK'];

function writeReports(results) {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(repoRoot, 'reports');
  fs.mkdirSync(dir, {recursive: true});

  const jsonPath = path.join(dir, `link-check-${date}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({date, results}, null, 2));

  const counts = Object.fromEntries(ORDER.map((s) => [s, results.filter((r) => r.status === s).length]));
  const lines = [
    `# Link check — ${date}`,
    '',
    `Checked ${results.length} URLs. ` + ORDER.map((s) => `${s}: ${counts[s]}`).join(' · '),
    '',
  ];
  for (const status of ORDER) {
    if (status === 'OK') continue;
    const rows = results.filter((r) => r.status === status);
    if (!rows.length) continue;
    lines.push(`## ${status} (${rows.length})`, '');
    lines.push('| kind | id | url | detail |', '|---|---|---|---|');
    for (const r of rows.sort((a, b) => a.id.localeCompare(b.id))) {
      const detail = r.error || (r.finalUrl !== r.url ? `→ ${r.finalUrl}` : `HTTP ${r.code}`);
      lines.push(`| ${r.kind} | \`${r.id}\` | ${r.url} | ${detail} |`);
    }
    lines.push('');
  }
  lines.push(
    '## What to do',
    '',
    '- **BROKEN / HOME-REDIRECT**: find the new page on the university site, update `url` in `data/`, stamp `lastReviewed`. If the program no longer exists, mark it and escalate to a data review.',
    '- **CROSS-DOMAIN**: verify the new domain is really the institution (rebrands happen; so do domain squats), then update.',
    '- **REDIRECT**: cosmetic — update the URL to the final destination when touching the record anyway.',
    ''
  );
  const mdPath = path.join(dir, `link-check-${date}.md`);
  fs.writeFileSync(mdPath, lines.join('\n'));
  return {jsonPath, mdPath, counts};
}

async function main() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const only = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1];

  if (typeof fetch !== 'function') {
    console.error('Node >= 18 required (global fetch not found).');
    process.exit(2);
  }

  const data = loadCanonicalData();
  let targets = collectTargets(data);
  if (only) targets = targets.filter((t) => t.url.includes(only));
  console.log(`Checking ${targets.length} URLs (${CONCURRENCY} parallel, ${TIMEOUT_MS / 1000}s timeout)...`);

  const results = await runPool(targets);
  const {mdPath, counts} = writeReports(results);

  console.log('');
  for (const s of ORDER) console.log(`  ${s.padEnd(14)} ${counts[s]}`);
  console.log(`\nReport: ${path.relative(repoRoot, mdPath)}`);

  const actionable = counts['BROKEN'] + counts['HOME-REDIRECT'] + counts['CROSS-DOMAIN'];
  if (actionable > 0) console.log(`\n${actionable} link(s) need attention.`);
  if (strict && counts['BROKEN'] > 0) process.exit(1);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}

module.exports = {collectTargets, probe, classifySuccess};
