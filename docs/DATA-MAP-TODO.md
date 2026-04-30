# Data Map — open work

Living todo list for the career/institution/program data layer (`cesafiu_prototype_v3/project/data.js`) and the data map UI (`cesafiu-data-map.html`).

**Status snapshot (2026-04-30, post-v4):** 94 careers · 160 institutions · 188 programs · **100% admission coverage**.

This file is the source of truth for what's left. Edit freely. Tick items as `[x]` when done.

---

## Strategic priority — Iași-first depth pass

**Decision (2026-04-30, Adi):** Before adding more cities, make Iași as clean and complete as possible. Validate the model in one city we can ground-truth, then scale the methodology to other cities. UGAL (udjg/Galați) and other regional gaps are real but **deferred** until Iași is the gold standard.

### Current Iași state (audit 2026-04-30)

- **17 institutions** covered: UAIC, TUIASI, UMF, USAMV, Arte Iași, 3 private (Petre Andrei, Apollonia, Mihail Kogălniceanu), 1 trade school (CT Asachi), Postliceala Grigore Ghica Vodă, FEG Iași, Wantsome, Innovation Labs, LT Economic Turism, Oby Ink Academy, LT Construcții Iași, Arte Iași — Conservare-Restaurare.
- **39 program edges** anchored in Iași.

### Gaps to close (Iași completeness pass)

**UAIC — missing programs** (faculty exists in our data, but no career edge):

- [ ] Drept → `avocat`, plus add `notar`/`magistrat`/`procuror` careers if not present
- [ ] Informatică → `software-engineer`, `data-scientist`, `cybersecurity`, `freelance-developer`
- [ ] Matematică-Informatică → `data-scientist`, `researcher`, `software-engineer`
- [ ] Psihologie → `psiholog`, `hr-specialist`
- [ ] FEAA — Marketing → `marketing-specialist`
- [ ] FEAA — Finanțe → `functionar-bancar`, `contabil` (partially wired)
- [ ] Litere → `jurnalist`, `traducator`, `profesor`
- [ ] Geografie → `ghid-turistic`, `profesor`
- [ ] Istorie → `profesor`, `restaurator`
- [ ] Sociologie → `asistent-social`
- [ ] Fizică / Chimie → `researcher`, `biolog`

**TUIASI — missing programs:**

- [ ] Calculatoare și Tehnologia Informației → `software-engineer`, `data-scientist`, `cybersecurity`
- [ ] Automatică și Informatică Aplicată → `software-engineer`, `inginer-auto`
- [ ] Electronică, Telecomunicații → `software-engineer`, `inginer`
- [ ] Mecanică → `inginer`, `inginer-auto`
- [ ] Chimie → `inginer` (chimist)

**USAMV Iași — missing programs:**

- [ ] Agronomie → `agronom`
- [ ] Horticultură → `agronom`, `florar`
- [ ] Zootehnie → `agronom`

**Arte Iași — extend:**

- [ ] Muzică (departament UAGE) → `dj-producer`, music careers
- [ ] Design Vizual → `croitor`, `bijutier`, `artist-plastic`

**Trade schools / postliceale Iași — research + add:**

- [ ] More licee tehnologice in Iași: mecanică, electronică, IT (look up via ISJ Iași)
- [ ] Postliceale sanitare Iași beyond Grigore Ghica (Henri Coandă filiala Iași? Sanity? Atlas?)
- [ ] Bootcamps + școli IT Iași beyond Wantsome (Codecool Iași? IT 6 Hub? Continental Academy?)
- [ ] Hospitality schools beyond LT Economic Turism (Christine Hotelier, Comaț, Ciornei?)

**Iași-specific employer pipelines** (for the "where do graduates work" angle if the schema gets it later):

- Continental Iași, Amazon Iași, Endava Iași, Cognizant Iași — IT employers
- Antibiotice Iași — pharma
- Iulius Mall, Palas — retail/HR pipeline

**Estimated effort:** 3-5 hours focused work — research each UAIC + TUIASI faculty page, add ~30-50 new programs anchored in Iași, possibly add 5-10 missing careers (notar, magistrat, etc.) if gaps surface.

---

## Tonight (2026-04-30 evening)

### [ ] ARACIS + RNCIS validation pass

For every institution + program tagged `[v2]` or `[v3]` in `data.js` — about 30 new institutions and ~110 new programs added across the v2/v3 expansions — validate against authoritative sources.

**What to check:**

- **ARACIS** (`https://www.aracis.ro`) — verify university accreditation status (full / provisional / withdrawn) and that the program is in their current list.
- **RNCIS** (Registrul Național al Calificărilor din Învățământul Superior) — verify exact program name, level (licență / master / doctorat), and duration match the official record.
- **ANC RNC** (`https://www.anc.edu.ro`) — verify each calificare provider (FEG, UCECOM, NAGVO, Oby Ink, etc.) is currently authorized; verify COR codes cited (e.g., 514206 Tatuator, 741103 Instalator PV).
- **ISJ județene** — for licee tehnologice and școli profesionale.

**What to add to each entry:**

- `lastVerified: 'YYYY-MM-DD'`
- `verifiedSource: '...'` (URL or registry reference)
- `flagged: true` with a `flagReason` note for any entry whose name, accreditation, or active status doesn't match official records.

**Why this matters:** Critical before any entry appears in the paid €19-29 PDF report (Phase 1 monetization). Wrong school name → refund + reputational hit. Estimated 4-6 hours of focused checking.

---

## Next session — high priority

### [ ] Edges for the still-thin niche careers

Most under-linked careers were expanded to 4-11 edges in v4 (2026-04-30). A handful remain thin and probably should stay that way (inherently niche), but worth a second look:

- `paramedic` (2 edges) — IGSU formare internă is hard to map cleanly to fixed institutions
- `manichiurista`, `bijutier`, `florar`, `agent-securitate`, `agent-imobiliar`, `operator-depozit`, `instalator-pv`, `ingrijitor-batrani` (2-3 edges each) — covered by ANC providers (FEG, Eurojobs) which have national coverage but as single entries

Decision: leave these at current state unless validation pass surfaces specific regional providers worth adding.

---

## Next session — medium priority

### [ ] Split monolithic careers into sub-roles

Several current career entries collapse very different sub-roles. Audit and split where the daily work + skills + salary diverge significantly:

- `psiholog` → clinician / școlar / organizațional / consilier vocational
- `profesor` → învățător primar / profesor gimnaziu / profesor liceu / profesor universitar
- `jurnalist` → reporter / editor / podcast / corespondent investigativ
- `marketing-specialist` → SEO / paid media / content / brand / growth
- `inginer` (mecanic/electric) → too generic, split by domain
- `medic-generalist` → medicină de familie / specialități clinice (oncologie, cardio, ATI) — at minimum link to specialization rezidențiat

Aim: ~8-12 additional sub-role entries from existing umbrella careers.

### [ ] Regional trade school coverage

Most current trade schools (licee tehnologice, școli profesionale) are concentrated in București, Cluj, Iași, Timișoara, Brașov, Ploiești. Romania has 41 județe and many trade schools in smaller regional centers.

Prioritize underrepresented regions: Oltenia (Craiova, Slatina, Caracal), Maramureș (Baia Mare), Banat (Reșița — already partial, expand), Satu Mare, Bihor (Oradea), Suceava, Botoșani, Tulcea, Călărași, Giurgiu, Brăila, Buzău, Vâlcea, Argeș (Pitești — already partial, expand).

Goal: at least 1 trade school + 1 postliceal per județ where they exist, so a teen from Bistrița sees something local.

### [ ] Visual QA on the new HTML map

Open `cesafiu-data-map.html` (live at `https://adichiriac.github.io/CeSaFiu/cesafiu-data-map.html`) and walk through:

1. Does the 4-column layout render correctly across breakpoints?
2. Do path → career → school → next-step click flows feel intuitive?
3. Is the search responsive?
4. Are tier filter chips clear?
5. Is the detail panel readable?
6. Any visible data anomalies (missing emojis, broken edges, color clashes)?

Compile issue list for follow-up fix pass.

---

## Future / strategic

### [ ] K-12 extension scope

Project plan extends to K-12 (grades 1-8 + early secondary) in Phase 3. Different career framing for younger kids: less "what salary", more "what does this person do all day", more visual/concrete, fewer technical terms. Plus add education layer for liceu (clase 9-12) profile choice — mate-info / științe / filo / pedagogic / vocațional / tehnologic.

Decide: is this a v3 expansion of the same `data.js`, or a separate dataset (`data-k12.js`)? Likely the latter to keep the v3 schema clean for grades 9-12 paid product.

### [ ] Salary refresh quarterly cycle

Salaries currently lack a `lastVerifiedSalary: 'YYYY-MM-DD'` field on every career entry. Add this field. Establish a quarterly refresh cycle. Sources: Salario.ro, eJobs salary insights, LinkedIn Salary, INS Romania, specialty associations (medic — Colegiul Medicilor; arhitect — OAR). Flag careers where salary range drifts >30% since last check.

### [ ] More job-board mining (round 2)

The 2026-04-30 v3 pass added 20 high-volume careers. There are still missing roles below the top tier. Candidates for round 2:

- Brand manager / Marketing manager (split from `marketing-specialist`)
- Specialist achiziții publice (vs. private procurement — different domain)
- Inginer chimist / biotehnolog
- Geolog / Geofizician
- Veterinar paramedic / Asistent medical veterinar specializat
- Notar / Executor judecătoresc (split from `avocat`)
- Tehnician medical de imagistică (radiolog tehnic)
- Specialist ESG / sustainability (corporate emerging role)
- Crypto / Web3 developer (niche but fast-growing)

---

## Done

- 2026-04-30 — v2 expansion: +35 careers (meserii, crafts, faculty gaps), +30 institutions, +79 programs
- 2026-04-30 — v3 expansion: +20 high-volume careers from job board mining (TIR, contabil, securitate, QA, etc.), +31 programs
- 2026-04-30 — Salary corrections: 8 unrealistic ranges fixed with tiered Junior/Mid/Senior bands
- 2026-04-30 — New `cesafiu-data-map.html` (data-driven 4-column interactive map) + standalone version + `scripts/build-data-map.js` build script
- 2026-04-30 — Removed original Figma-Make bundle (replaced functionally)
- 2026-04-30 — **v4 expansion: regional edge coverage** for under-linked careers — added 29 institutions (CT Pallady Constanța, Liceul Dacia Pitești, LT Auto Craiova, Henri Coandă filiale Tim/Bv, FEG filiale Tim/Galați/Cta, ASR Galați, UAB/UTBV/UAV/ULBS/UPIT kineto, etc.) and 44 programs. Most under-linked careers now have 4-11 edges (was 1-2): ospătar/bucătar 11, asistent medical 16, mecanic auto 7, kinetoterapeut 9, sudor 7.
- 2026-04-30 — **Admission backfill: 100% coverage** — every program (188/188) now has `admission: { exam, deadline, deadlineYear, tuition }` plus `lastVerified` timestamp. Templates grouped by family (UMF medicine, ASE business, UNARTE arts, postliceal sanitar, ANC short courses, licee tehnologice). Tuition reflects stat-buget-vs-taxă for facultate, RON/an for postliceal privat, RON/curs for ANC providers.
