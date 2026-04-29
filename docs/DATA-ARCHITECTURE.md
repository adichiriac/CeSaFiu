# Ce Să Fiu? — Data Architecture

*Living document. Last updated: 2026-04-29.*

This document describes the entity model that powers the **real app**, not just the V2 prototype. The prototype's `data.js` is a denormalized, single-file-per-language stand-in for what will eventually be a relational database with a generation pipeline. This doc is the bridge between the two — read it before adding new fields, schemas, or seeds.

## Why we need a real schema now

Phase 1 surfaced four pressure points that the current `data.js` shape can't handle cleanly:

1. **Career → school is many-to-many through programs.** "Asistent medical" can be reached via a 3-year postliceal *or* a 4-year UMF licență — same career, different programs at different institutions, different RIASEC weights, different admission processes. The current `career.schools: ["UMF Carol Davila", "UMF Iași"]` is just strings — it can't carry the program-level facts that actually matter.
2. **Programs deep-link out, not institutions.** A 17-year-old looking at "Asistență Medicală Generală at UMF Iași" wants the *admission page for that specialty*, not the UMF homepage. We've already shipped one program-level link (`umf-iasi → AMG`) as a one-off — the schema has to make that the default, not an exception.
3. **The paid report engine needs structured joins.** Phase 2 includes a €19-29 PDF that pulls "the user's RIASEC + 5 careers + RO programs at each + admission deadlines + adjacencies." That's six joins against the data model. If we don't normalize now, the report engine will be a tangle of string matching against `career.schools[]`.
4. **B2B distribution (Phase 3) needs program IDs.** "University X pays to surface their programs higher in matching results" requires every program to have a stable ID we can rank, weight, and report against. Strings can't be ranked.

## Entity model

Six entities, with explicit primary keys and foreign keys. Stable IDs are slug-style strings (`umf-iasi-amg`), not UUIDs — they're greppable in the data file and human-readable in URLs.

### 1. `Career`

The job a person ends up doing in the labor market. Maps to roughly one row per LinkedIn job-title category.

```
{
  id              string  primary key — slug
  name            string  display name (RO)
  tagline         string  one-liner
  pathType        enum    facultate | profesional | autodidact | antreprenor | freelance | creator | mixt
  riasec          [enum]  ordered RIASEC codes (R/I/A/S/E/C), primary first
  big5            [enum]  Big Five dimensions that correlate (O/C/E/A/N)
  traits          [enum]  legacy 7-bucket: build/tech/analyze/social/lead/create/visual
  salary          string  RO salary range with optional UE comparison
  demand          string  market demand label
  vibe            string  short emotional descriptor
  description     text    2-4 sentences
  day             [string] day-in-the-life bullets
  skills          [string] required skills
  paths           [string] adjacent career progressions  (rename: → adjacentCareerIds in v2)
  schools         [string] DEPRECATED — pre-program era (kept for back-compat)
  color, emoji    string  display
}
```

### 2. `Program` *(new)*

A specific educational program at a specific institution that prepares for one or more careers. This is the entity that actually links careers to schools.

```
{
  id              string  primary key — slug, prefix with universityId for namespacing
  name            string  display name (RO)
  nameOfficial    string  official name on diploma (optional, for fulfillment of paid reports)
  universityId    FK      → Institution.id
  pathType        enum    facultate | profesional | postliceala | bootcamp | accelerator
  duration        string  "3 ani" / "4 ani" / "12 luni" — display
  durationYears   number  numeric for sort/filter
  language        [enum]  ['ro', 'en', 'hu', 'de', 'fr']
  url             string  direct admission/program page (NOT the institution homepage)
  riasec          [enum]  optional override; if absent, inherit from primary career
  careerIds       [FK]    → Career.id — which careers this program prepares for
  tags            [enum]  ['medicină', 'IT', 'business', ...] — used for browse filters
  notes           text    short context about THIS program (not the institution)
  admission       object  optional: { exam, lastYearMin, capacity, deadline }
  tuition         object  optional: { state, statePaid, private }  EUR/year
}
```

Examples of what fits:
- `umf-iasi-amg` — Asistență Medicală Generală @ UMF Iași (4 ani, licență)
- `spp-iasi-amg` — Asistent medical generalist @ Postliceala Sanitară Iași (3 ani, postliceal)
- `upb-cs` — Calculatoare @ UPB
- `codecool-fullstack` — Full-stack JavaScript @ Codecool (12 luni, bootcamp)

The same career (`asistent-medical`) maps to **both** the UMF licență and the postliceala — they're competing programs for the same end role.

### 3. `Institution`

What we currently call `university`. Renaming planned for v2.

```
{
  id              string  primary key — slug
  name            string  display name
  city            string  primary city; some institutions are multi-city
  cities          [string] optional, when multi-campus
  tier            enum    TOP | GOOD | TRADE | POST | BOOTCAMP | PROGRAM
  kind            enum    stat | privat | liceu-dual | postliceala | privat-bootcamp | accelerator | program
  url             string  homepage
  tags            [enum]  domain tags
  domains         [string] DEPRECATED — superseded by programs[].tags + names
  notes           text
}
```

### 4. `Path`

Macro-level career direction. Used for filtering and the "5 drumuri" landing.

```
{
  id              string  primary key
  name, tagline, emoji, color
  duration        string  display range
  cost            string  display range — RO realistic
  pros, cons      [string]
  bestFor         [string]
  next            [string] action items
}
```

### 5. `Specialty` *(implicit, may be promoted to entity later)*

Currently encoded in `program.tags` and `institution.tags`. If/when the paid report engine needs to group "all medicine programs across all institutions", promote `Specialty` to a top-level entity with its own ID and parent group (e.g., `medical-clinical` parent of `medicina-generala`, `stomatologie`, `farmacie`).

### 6. `RIASEC profile` & `Big5 profile` *(value objects)*

Not standalone entities; embedded as arrays on Career and Program. The validation framework lives in:
- `quiz.questions[].options[].riasec` — what each user answer contributes
- `personality.dimensions[]` — Big Five dimension definitions
- `vocational.codes[]` — Holland Code definitions

The matcher (`computeMatches` in `app.jsx`) builds a user profile vector from quiz answers and computes cosine similarity against career/program profiles. Same scorer should serve both quick-quiz and deep-test surfaces — currently the quick path is unified, deep-results still uses raw RIASEC overlap (TODO).

## Relationships

```
Career  ───< (preparedBy)        ─< Program >─ (offeredBy)  ─── Institution
Career  ───< (hasPathType: enum) ─< Path >─ (hasPathType: enum)── Program
Career  ───< (hasRiasec: array)  Program  ───< (hasRiasec: array, optional override)
```

- **One Career → many Programs** (many ways to become a software engineer)
- **One Program → one Institution** (each program is at exactly one school)
- **One Program → ≥1 Careers** (a Computer Science program can lead to dev, data, research, founder)
- **Many Institutions → many Specialties** (most universities span specialties)

## Database mapping (Phase 2+)

When we leave `data.js` and go to a real database (likely Supabase Postgres for Phase 2):

```sql
careers (id pk, name, tagline, path_type, riasec[], big5[], salary_text, demand, ...)
programs (id pk, name, name_official, university_id fk, path_type, duration_years,
          language[], url, riasec[], tags[], notes, admission jsonb, tuition jsonb)
program_career (program_id fk, career_id fk)        -- m2m join
institutions (id pk, name, city, cities[], tier, kind, url, tags[], notes)
paths (id pk, name, tagline, ...)
quiz_questions (id pk, ...)
quiz_options (id pk, question_id fk, label, riasec[], path_id fk, traits[])
```

Indexes that matter from day 1:
- `programs(university_id)` — UniDetail screen lookup
- `program_career(career_id)` — CareerDetail "where to study" lookup
- `programs(path_type)` — path-filter browse
- `programs USING gin(tags)` — tag filter

JSONB for `admission` and `tuition` because the structure varies enormously per institution (some publish exam scores, some don't; some have multiple price tiers).

## Migration path from current `data.js`

The prototype's current state (as of 2026-04-29):
- 39 careers ✓
- 6 paths ✓
- 101 institutions ✓ (with URLs on 82, programs[] on 1)
- 24 quiz options ✓ (enriched with riasec + path)
- **0 programs as a top-level entity** ← this is what we add next

**v1 migration** (this commit + follow-ups):
1. Add `window.QUIZ_DATA.programs = []` as new top-level array.
2. Each program record uses the schema above. URL is mandatory; everything else optional.
3. Seed with ~30 programs covering 5 high-volume careers (medical, IT, business, education, trades) — proves the chain end-to-end.
4. UniDetailScreen reads from top-level `programs[]` filtered by `universityId`. Falls back to inline `u.programs` only if no top-level matches (gracefully deprecating the inline field).
5. CareerDetailScreen adds a **"Programe care duc aici"** section, populated by `programs.filter(p => p.careerIds.includes(careerId))`.
6. Existing `career.schools` string array stays readable but is no longer the source of truth — gradually replaced as `programs[]` grows.

**v2 (Phase 2 prep, ~6 weeks out):**
- Move data.js to a generated artifact: source of truth becomes a versioned YAML or JSON tree under `/data-source/`, processed at build time into `data.js` (and eventually into Supabase tables).
- Rename `universities` → `institutions` everywhere.
- Drop `career.schools` and `university.domains` deprecated fields.
- Add `Specialty` entity if paid-report engine needs cross-institution grouping.

**v3 (Phase 2 launch):**
- Real database (Supabase). `data.js` becomes a stale snapshot for static prototype only.
- Auth-gated user state: saved careers, saved programs, completed milestones.
- Admin tooling for adding programs (currently just `git add`).

## Where each Phase reads from

| Phase | Surface | Reads |
|---|---|---|
| 1 | Quick quiz results | `careers[]` filtered by user RIASEC profile |
| 1 | Browse → Universități | `institutions[]` |
| 1 | Browse → Cariere | `careers[]` |
| 1 | UniDetail | `institutions[id]` + `programs.filter(universityId=id)` |
| 1 | CareerDetail | `careers[id]` + `programs.filter(careerIds⊃id)` |
| 1 (new) | Paid hook | nothing yet — just intent capture |
| 2 | Drumul tău | user.savedCareers × programs × milestones |
| 2 | Parent companion | careers × archetype-specific question scripts |
| 2 | Paid PDF report | careers + programs + institutions + RIASEC profile + adjacencies + RO salary data → templated PDF |
| 3 | B2B partner ranking | programs[].partnerWeight (added in Phase 3) |

## Data hygiene principles

1. **Stable IDs.** Once a `program.id` is published, never change it — it may be linked from outside (paid PDF references, partner integrations).
2. **URLs are direct.** A program's `url` is its admission page or program page, never the institution homepage. If we don't have one, set `url: null` — UI will Google-search.
3. **Slow truths over fast wrongness.** Better to have 30 verified programs than 300 guessed ones. The closed-circle preview is exactly when we tolerate gaps; testers tell us where to fill in.
4. **Source-tag everything you can't fact-check.** In `notes`, prefix with `[v1]` if the entry is from training-data knowledge and hasn't been verified against the institution's site.
5. **No partial deletion.** Removing a program is a breaking change — always supersede with `{deprecated: true, supersededBy: 'newId'}` rather than deleting.

## Architectural decisions (2026-04-29)

These were the open questions; deferred to delivery date below where possible.

### i18n strategy — **decided: per-record JSON for v2, separate tables for v3**

Two-stage approach. Reasoning:

- **v2 (Phase 2 prep, RO + Moldova)**: Moldova is ~99% Romanian-speaking; the only translation work is for legal/educational vocabulary that diverges between RO and MD. Volume is low. Use per-record JSON columns: `name: { ro: "...", md: "..." }` where MD overrides only when needed. Avoids the schema explosion of separate translated tables for what is essentially an 80% overlap dataset.
- **v3 (HU + EN at scale)**: When Hungarian and English become first-class (real translation, not a Moldova-tweak), promote to a separate translation table: `program_translations(program_id fk, locale, name, notes, ...)` joined at query time. This is the standard relational i18n pattern; we adopt it once volume justifies it.

The migration v2→v3 is mechanical: for each per-record JSON column, denormalize into the translations table, drop the JSON column, repoint the API. Doable in a single migration.

### `Specialty` as entity — **decided: defer until paid report engine demands it (Phase 2 mid)**

Currently `tags[]` on programs and institutions is doing the grouping work — `tags: ['medicină']` covers it. The decision rule: introduce `Specialty` as a top-level entity *only when* we hit a query the tag system can't answer cleanly. The likely trigger is the paid PDF report — if its template needs to say "all medicine programs grouped by specialty (general medicine, dentistry, pharmacy, paramedical, ...)", that's when we promote.

Until then: keep tags free-form, but **enforce a controlled vocabulary** in `CONTRIBUTING-DATA.md` so the tag set stays closed and tag-based grouping is reliable.

### Time-varying data + profile drift — **decided: `lastReviewed` field + yearly build-time warning**

Add an optional `lastReviewed: 'YYYY-MM-DD'` field on every Career, Program, and Institution. A small build-time check (or a Node script run pre-commit) emits a console warning for records whose `lastReviewed` is more than 12 months old:

```bash
node scripts/check-data-freshness.js
# warns: 'umf-iasi-medicina lastReviewed=2025-09-12 — 14 months old, consider refresh'
```

Doesn't block the build, just surfaces stale records for the next maintenance pass. Yearly cadence (September, after admission cycle wraps) is enough for admission scores; biennial probably enough for RIASEC profile drift.

The architecture explicitly **does not** auto-pull live admission data from each institution's site — that's a separate ingestion service for Phase 3 once we have B2B partners feeding us structured data. For Phase 1+2, manual refresh once a year keeps the data honest without infrastructure cost.

### Inheriting decisions for new entities

When we add new top-level entities (e.g., `User`, `SavedProgram` in Phase 2), they follow the same rules:
- Stable slug-style IDs
- `lastReviewed` (or `updatedAt` for user-touched records)
- per-record i18n JSON until v3
- No deletion — supersede with `deprecated: true, supersededBy: 'newId'`

---

*This doc evolves. Update on every load-bearing schema decision; archive obsolete sections rather than deleting.*
