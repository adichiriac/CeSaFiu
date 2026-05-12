# Career Catalogue Expansion Plan

*Created: 2026-05-11.*

Goal: expand the Ce Să Fiu? career catalogue from 115 to ~200 careers while keeping the data defensible for Romanian students and maintainable as the labour market changes.

## Current State

The canonical source of truth is now `/data`:

- `data/careers.json`
- `data/institutions.json`
- `data/programs.json`
- `data/paths.json`

Generated compatibility artifacts:

- `cesafiu_prototype_v3/project/data.js`
- `cesafiu-data-map-standalone.html`

Validation/build commands:

```bash
npm run data:validate
npm run data:build
npm run data:map
npm run data:candidates
```

Current catalogue counts:

- 115 careers
- 163 institutions
- 357 programs
- 6 paths

## Source Mix

Use a weighted mix. No single source is enough.

| Source | Use | Link |
|---|---|---|
| ANOFM vacancies | Current Romania demand and practical jobs | https://www.anofm.ro/locuri-de-munca-vacante/ |
| Cedefop Skills-OVATE | EU online job-ad demand, updated quarterly | https://www.cedefop.europa.eu/en/tools/skills-online-vacancies |
| Cedefop Skills Forecast | Medium/long-term EU demand | https://www.cedefop.europa.eu/en/tools/skills-forecast |
| ESCO | Canonical EU occupation and skill taxonomy | https://esco.ec.europa.eu/en/about-esco |
| WEF Future of Jobs | Future-facing role families: AI, green, data, security | https://www.weforum.org/publications/the-future-of-jobs-report-2025/ |

Notes:

- Skills-OVATE is based on online job advertisements, so treat it as a complement to official statistics and editorial judgement.
- ANOFM captures declared vacancies, but under-represents high-end private hiring and freelancing.
- ESCO is taxonomy, not demand. Use it for naming, occupation grouping, and skill relations.

## Candidate Scoring

Every candidate career gets an editorial market score:

```text
finalScore =
  35% Romania current demand
  25% EU current demand
  20% future growth signal
  10% student accessibility
  10% catalogue diversity
```

Definitions:

- **Romania current demand**: frequency/visibility in ANOFM + Romanian job boards/manual review.
- **EU current demand**: Skills-OVATE occupation demand and EU signal.
- **Future growth signal**: Cedefop forecast + WEF future-facing category.
- **Student accessibility**: realistic paths from Romanian high school: faculty, vocational, bootcamp, apprenticeship, portfolio, entry-level job.
- **Catalogue diversity**: prevents overfitting to IT/business and keeps trades, healthcare, education, public services, creative, and green roles visible.

## Target Distribution For 200 Careers

Approximate target, not a hard quota:

| Domain | Target careers |
|---|---:|
| IT, data, AI, cybersecurity | 30 |
| Healthcare and care work | 25 |
| Engineering, manufacturing, energy, green transition | 25 |
| Business, finance, marketing, operations | 25 |
| Education, psychology, social services | 20 |
| Trades, construction, logistics, transport | 25 |
| Creative, media, gaming, creator economy | 20 |
| Law, public safety, administration | 15 |
| Entrepreneurship, freelancing, hybrid roles | 15 |

## Data Fields To Add Before The Expansion

Added as optional fields to `Career` records:

```ts
{
  corCode?: string;
  escoUri?: string;
  iscoGroup?: string;
  marketScoreRo?: number;      // 0-100
  marketScoreEu?: number;      // 0-100
  futureScore?: number;        // 0-100
  accessibilityScore?: number; // 0-100
  sourceRefs?: string[];
  lastReviewed?: string;       // YYYY-MM-DD
  status?: 'active' | 'draft' | 'deprecated';
}
```

Keep these optional during the first pass so we can migrate progressively without blocking the current app.

Tooling:

```bash
npm run data:validate
npm run data:report
npm run data:candidates
```

`data:validate` fails on malformed metadata and warns when coverage is missing. `data:report` prints catalogue distribution, metadata coverage, and careers without linked programs. `data:candidates` ranks the candidate longlist before promotion. `data:map` rebuilds `cesafiu-data-map-standalone.html`, whose **Candidates** view supports filtering, local notes/status, copyable promotion checklist, and comparison against similar existing careers.

## Candidate Longlist

Initial review queue:

- `data/career-candidates.json`
- 58 candidate careers
- Not loaded by the app
- Not included in matching
- Emitted only to the review artifact `cesafiu_prototype_v3/project/career-candidates.js` and the standalone data map

This gives us a defensible staging area: we can score and discuss missing careers without polluting the production catalogue. A candidate should move to `data/careers.json` only after editorial review and after the record has the normal app fields: student-friendly description, salary/demand copy, RIASEC, Big Five anchors, traits, path type, and realistic Romanian education/training routes where possible.

## Work Plan

1. **Schema extension**
   - Add optional market/taxonomy/source fields to the career type.
   - Update `scripts/validate-data.js` to warn, not fail, when new fields are missing.

2. **Longlist**
   - Build candidate careers in `data/career-candidates.json` from current catalogue + market sources.
   - Normalize names to student-friendly Romanian labels.
   - Merge obvious duplicates, but keep career pages distinct when the day-to-day is meaningfully different.

3. **Editorial scoring**
   - Score every candidate with the formula above.
   - Keep evidence in `sourceRefs`.
   - Mark entries as `candidate`, `promote`, `merge`, or `reject`.

4. **Select top 200**
   - Fill domain distribution.
   - Ensure every selected career has RIASEC, Big Five anchors, traits, path type, description, salary/demand, and at least one realistic Romanian path.

5. **Program mapping**
   - For each new career, link existing programs where possible.
   - Create new programs only when a career has no plausible route.
   - Avoid invented URLs; use `null` rather than guessed links.

6. **QA in data map**
   - Run `npm run data:validate`.
   - Run `npm run data:build`.
   - Run `npm run data:map`.
   - Open the data map and check for orphan careers, over-clustered domains, and broken program links.

7. **App QA**
   - Verify Browse > Careers.
   - Verify career detail pages.
   - Verify matching still returns diverse top results.
   - Run `npm run typecheck` and `npm run build`.

## Acceptance Criteria

- Canonical `/data` remains the only editable source.
- Career count is ~200, with no duplicate IDs.
- Every new career has required matching metadata.
- Every program references existing career/institution IDs.
- Generated `data.js` and data-map standalone rebuild cleanly.
- App build passes.

## Open Decisions

- Whether to keep `career.schools` for backward compatibility until all program mappings are strong.
- Whether to introduce a formal `domains` taxonomy for careers before or after the top-200 pass.
- Whether to create a semi-automated source collector, or keep the first top-200 expansion editorial/manual.
