# Adding programs to data.js

Quick guide for filling in the `programs` array. For the *why*, read [DATA-ARCHITECTURE.md](./DATA-ARCHITECTURE.md). This page is the *how*.

## The schema (v1)

Every program is one object inside `window.QUIZ_DATA.programs[]` in `cesafiu_prototype_v1/project/data.js`:

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
grep "id: 'umf-iasi" cesafiu_prototype_v1/project/data.js
```

**Validate referential integrity** after a batch of additions:

```bash
node -e "
const fs=require('fs'); const code=fs.readFileSync('cesafiu_prototype_v1/project/data.js','utf8');
const window={}; eval(code); const D=window.QUIZ_DATA;
const uniIds=new Set(D.universities.map(u=>u.id));
const careerIds=new Set(D.careers.map(c=>c.id));
const badU=D.programs.filter(p=>!uniIds.has(p.universityId));
const badC=[]; D.programs.forEach(p=>(p.careerIds||[]).forEach(c=>{if(!careerIds.has(c))badC.push({pid:p.id,cid:c});}));
console.log('total programs:', D.programs.length, '| bad universityId:', badU.length, '| bad careerIds:', badC.length);
if(badU.length) console.log('  bad U:', badU.map(p=>p.id+'->'+p.universityId));
if(badC.length) console.log('  bad C:', badC);
"
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
