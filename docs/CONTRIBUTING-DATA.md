# Adding programs and careers to the canonical data source

Quick guide for filling in the canonical `/data` JSON files. For the *why*, read [DATA-ARCHITECTURE.md](./DATA-ARCHITECTURE.md). This page is the *how*.

Source of truth:

- `data/careers.json`
- `data/institutions.json`
- `data/programs.json`
- `data/paths.json`

Generated compatibility artifact:

- `cesafiu_prototype_v3/project/data.js`
- `cesafiu_prototype_v3/project/career-candidates.js` for the data-map review UI only

Do not edit the generated artifact manually. Update `/data`, then run:

```bash
npm run data:validate
npm run data:build
npm run data:map
npm run data:report
npm run data:candidates
```

## Career market metadata

New and refreshed career records can include optional market/source metadata. These fields are not required for the app to run, but they are the QA layer for the top-200 expansion:

```js
{
  corCode: '2512',                  // Romanian COR code, when mapped
  escoUri: 'http://data.europa.eu/esco/occupation/...',
  iscoGroup: '2512',
  marketScoreRo: 82,                // 0-100, Romania current demand
  marketScoreEu: 76,                // 0-100, Europe current demand
  futureScore: 88,                  // 0-100, forward-looking signal
  accessibilityScore: 70,           // 0-100, realistic paths for Romanian students
  sourceRefs: [
    'ANOFM vacancies, accessed 2026-05-11',
    'Cedefop Skills-OVATE, accessed 2026-05-11',
    'ESCO occupation URI'
  ],
  lastReviewed: '2026-05-11',
  status: 'active'                  // active | draft | deprecated
}
```

`npm run data:validate` fails on malformed values and warns on missing coverage. `npm run data:report` prints the catalogue distribution and metadata coverage.

## Candidate careers

Use `data/career-candidates.json` for the top-200 expansion longlist. This file is a review queue, not production app data. Entries in this file do not appear in Browse, matching, or result pages until they are manually promoted into `data/careers.json`.

Candidate shape:

```js
{
  id: 'data-engineer',
  name: 'Data Engineer',
  domain: 'IT, data, AI, cybersecurity',
  suggestedPathType: 'facultate',
  suggestedRiasec: ['I', 'R', 'C'],
  suggestedBig5: ['C', 'O'],
  marketScoreRo: 88,
  marketScoreEu: 90,
  futureScore: 88,
  accessibilityScore: 70,
  sourceRefs: ['Cedefop Skills-OVATE', 'ESCO', 'Romanian job-board scan'],
  rationale: 'Builds data infrastructure for analytics, AI, and business reporting.',
  reviewStatus: 'candidate' // candidate | promote | merge | reject
}
```

Run `npm run data:candidates` to see the review queue ranked by the editorial scoring formula. Run `npm run data:map`, then open `cesafiu-data-map-standalone.html` and switch to **Candidates** for the visual review workspace: filters, local review notes, copyable checklist, and similar existing careers.

Promote a candidate only after adding the normal production career fields: `description`, `salary`, `demand`, `vibe`, `traits`, `riasec`, `big5`, and a realistic path/program mapping when possible.

## The schema (v1)

Every program is one object inside `data/programs.json`:

```js
{
  id: 'umf-iasi-amg',                 // slug, prefix with universityId for namespacing
  name: 'Asistență Medicală Generală', // display name (RO)
  universityId: 'umf-iasi',            // FK → universities[].id  (must exist)
  pathType: 'facultate',               // facultate | profesional | postliceala | autodidact | bootcamp
  duration: '4 ani',                   // human-readable label
  durationYears: 4,                    // numeric, for sort/filter
  language: ['ro'],                    // array: 'ro' | 'en' | 'hu' | 'de' | 'fr'
  url: 'https://...',                  // direct admission/program page (NOT the homepage). null if unknown.
  riasec: ['S', 'I', 'R'],             // Holland Code, primary first
  careerIds: ['asistent-medical'],     // FK array → careers[].id  (each must exist)
  tags: ['medicină', 'profesional'],   // for browse filters
  notes: 'Licență 4 ani — alternativa de durată mai mare la postliceala 3 ani.',
  // OPTIONAL:
  admission: { exam: '...', deadline: 'iulie', lastYearMin: 9.50 },
  tuition: { state: 0, statePaid: 1500, private: null }, // EUR/year
}
```

## Checklist before committing a new program

- [ ] **`id` is unique** and follows the `<universityId>-<slug>` pattern
- [ ] **`universityId`** exists in `universities[]` (grep first; if not, add the institution first)
- [ ] **`careerIds`** all exist in `careers[]` (grep first)
- [ ] **`url`** is the **direct program page**, not the institution homepage. If unsure, set `null` — the UI will fall back to a Google search
- [ ] **`pathType`** matches one of: `facultate`, `profesional`, `postliceala`, `autodidact`, `bootcamp`
- [ ] **`riasec`** is ordered primary→tertiary (max 4 codes recommended)
- [ ] **`notes`** prefixed with `[v1]` if the entry is from public knowledge and *not* directly verified on the institution's site
- [ ] No duplicate program at the same `(universityId, name)` pair

## Three real examples

**Facultate licență:**
```js
{
  id: 'upb-cs', name: 'Calculatoare și Tehnologia Informației',
  universityId: 'pub', pathType: 'facultate',
  duration: '4 ani', durationYears: 4, language: ['ro', 'en'],
  url: 'https://acs.pub.ro/admitere/',
  riasec: ['I', 'R', 'C'],
  careerIds: ['software-engineer', 'data-scientist', 'devops', 'cybersecurity', 'game-developer'],
  tags: ['IT', 'inginerie'],
  notes: '[v1] Cel mai competitiv program tech din RO.',
  admission: { exam: 'concurs (Mate + Info SAU Mate + Fizică)', deadline: 'iulie' },
}
```

**Postliceal sanitar:**
```js
{
  id: 'spp-iasi-amg', name: 'Asistent medical generalist',
  universityId: 'spp-medical-iasi', pathType: 'postliceala',
  duration: '3 ani', durationYears: 3, language: ['ro'],
  url: 'https://scoalasanitara-iasi.ro/new/',
  riasec: ['S', 'R', 'C'],
  careerIds: ['asistent-medical'],
  tags: ['medicină', 'profesional'],
  notes: '3 ani postliceal. Concurs greu, plasare 100%, diplomă recunoscută în UE.',
}
```

**Bootcamp:**
```js
{
  id: 'codecool-fullstack', name: 'Full-stack JavaScript Developer',
  universityId: 'codecool', pathType: 'autodidact',
  duration: '12 luni', durationYears: 1, language: ['ro', 'en'],
  url: 'https://codecool.com/ro/cursuri/curs-full-stack-developer/',
  riasec: ['I', 'R'],
  careerIds: ['software-engineer', 'mobile-developer', 'freelance-developer'],
  tags: ['IT', 'autodidact'],
  notes: '[v1] Bootcamp 12 luni cu plată după angajare. Job-garantat la parteneri.',
}
```

## Where the data shows up

After you add a program and reload `phase1.html`:

1. **Career detail screen** (Browse → Cariere → tap a career → ȘCOLI tab):
   Section "PROGRAME CARE DUC AICI · N" lists every program where `careerIds` includes that career. Click → opens the URL.

2. **University detail screen** (Browse → Universități → tap an institution):
   Section "Programe oferite · N" lists every program where `universityId` matches. Each card shows duration + languages + which careers it leads to.

3. **Umami events** (analytics):
   - Click on a program → `uni_program_click` with `{ id: programId, program: name, source: 'career-detail' | 'uni-detail' }`

## Tooling tips

**Grep before adding** to avoid duplicate IDs:

```bash
rg '"id": "umf-iasi' data/programs.json data/institutions.json
```

**Validate referential integrity** after a batch of additions:

```bash
npm run data:validate
```

## When you don't know a URL

`url: null` is fine — the UI will Google-search for `<institution name> <program name>` and the user lands one click away. Better than shipping a guessed URL that 404s.

## When the institution doesn't exist yet

Add the institution to `universities[]` *first*, in the appropriate section (state / private / trade / bootcamp / accelerator). Then add the program. ID conventions:

- State universities: short slug (`upb`, `ubb`, `uaic`)
- UMFs: `umf-<city>` (`umf-iasi`, `umf-cluj`)
- Trade schools: `ct-<short>-<city>` or `lt-<short>-<city>`
- Postliceale: `spp-<short>-<city>` (`spp-medical-iasi`)
- Bootcamps: short slug of the brand (`codecool`, `wantsome`)

## When you change an existing program

Don't change the `id` — once published, IDs are stable forever (the paid PDF report and partner integrations may reference them). If you need a different shape, add a new program and mark the old one with `deprecated: true, supersededBy: 'newId'`.

---

*Anything unclear here is a doc bug — fix it on the spot.*
