# Arhetipuri V2 — Plan de reimaginare (two-layer model)

> **Status:** decis — Faza A implementată (2026-06-11). Nume contestate alese:
> MAKERUL (RI), OMUL DE BAZĂ (SR), ALCHIMISTUL (AI), DIRIJORUL (EC),
> AMBASADORUL (SA — Conectorul Creativ respins: coliziune de cap cu CONECTORUL/ES).
> **Autor draft:** sesiune Cowork, 2026-05-29. Review + decizii: 2026-06-11.
> **Înlocuiește conceptual:** `MIND-MAP-V1.html` (maparea RIASEC × 30 arhetipuri).
> **Legături:** `apps/web/src/lib/results/archetypes.ts`, `data/careers.json`,
> `docs/VIRAL-PHASE-D-PLAN.md`, `docs/CAREER-CATALOGUE-EXPANSION-PLAN.md`,
> `docs/SCORING-AND-MATCHING.md`.

---

## TL;DR — decizia centrală

Avem **două lucruri diferite numite amândouă „arhetip"**, iar frecarea pe care o
simți vine din tratarea lor ca unul singur.

1. **Arhetipul-rezultat** (cele 30 din `archetypes.ts`) = o *oglindă* derivată
   mecanic din perechea top-2 RIASEC. Deterministă, apărabilă, legată direct de
   motorul de matching. Problema: numele sunt **clinice** pentru 14–18 ani
   (OPERATORUL, AUDITORUL, TEHNICIANUL, CONECTORUL DE OAMENI).

2. **Arhetipul-lume** (VIBE CHECK din prototip — Arhitect Digital, Bio-Explorer,
   Urban Farmer, AI Ethicist, Social Strategist) = un *trib / o lume de carieră*.
   Evocativ, marketabil, „găsește-ți tribul". Problema: **nu se mapează curat pe
   o axă psihologică** — „Urban Farmer" nu înseamnă „cine a scorat R+I", e un
   *cluster de conținut*.

**Propunerea: nu alegem între ele — le punem pe straturi.**

- **Stratul 1** — păstrăm cele 30 de etichete RIASEC, dar le **redenumim** ca să
  sune Gen-Z fără a minți axa. Risc mic, schimbare izolată în `archetypes.ts` +
  i18n, **nu atinge matching-ul**.
- **Stratul 2** — un set **NOU de ~14 „Lumi de carieră / Triburi"** ca strat de
  explorare și identitate. Aici trăiesc Bio-Explorer, Urban Farmer, AI Ethicist
  și gălețile future-looking (post-AI, life sciences, roluri sociale emergente).
  Lumile grupează `careers.json`; fiecare carieră își păstrează tag-urile RIASEC
  + signals dedesubt.

Ierarhia care „are sens": **Lume → cariere → (tag-uri psihometrice pentru
matching).** Pagina de rezultat poate spune:
> *„Vibe-ul tău: [arhetip-axă redenumit] · Lumi care ți se potrivesc: [2–3]."*

---

## De ce nu putem rezolva totul prin redenumirea celor 30

Întrebarea ta despre **cariere future-looking, life sciences și roluri sociale
emergente** nu se poate rezolva la nivelul axelor, pentru un motiv structural:

**RIASEC e atemporal prin design.** Cele 6 dimensiuni de interes nu vor „scoate
la suprafață" niciodată AI, biotech sau economia îngrijirii — pentru că acelea
sunt *domenii*, nu *dimensiuni de interes*. Un „AI Ethicist" și un „avocat" pot
avea exact aceeași pereche RIASEC. Deci future-proofing-ul e o problemă de
**conținut** (ce cariere există în catalog + cum sunt grupate), nu de etichete.

**Vestea bună: viitorul e deja parțial în `careers.json`.** Catalogul (~170
cariere) conține deja: AI Engineer, ML Engineer, MLOps, Data Engineer/Scientist,
inginer robotică, inginer biomedical, coordonator studii clinice, ESG/sustainability,
carbon accounting, inginer de mediu, instalator PV, tehnician turbine eoliene,
tehnician baterii, tehnician stații EV, auditor energetic, specialist GIS,
specialist sănătate digitală, terapeut ocupațional, low-code/no-code, operator
drone, UX researcher, DPO/GDPR. **Rolurile există — le lipsește doar un raft pe
care un adolescent să-l recunoască.** Stratul 2 e acel raft.

---

## STRATUL 1 — Redenumirea celor 30 de arhetipuri-axă

Regula de redenumire: **identitate, nu fișă de post**; rămâne onest față de axă;
tagline-ul stă în registrul de *atracție* („te atrag rolurile…"), niciodată
afirmație de competență (ca să nu suprapromită față de testul plătit IPIP-NEO-60).
Am marcat ✅ unde numele actual e deja bun și-l păstrăm.

| Pereche | Actual | Propus RO | Propus EN | Tagline RO (atracție) |
|---|---|---|---|---|
| RI | Constructorul | **MAKERUL** | THE MAKER | rezolvi probleme construind, cu mâinile și cu mintea |
| RA | Meșteșugarul ✅ | **MEȘTEȘUGARUL** | THE CRAFTSPERSON | gust + manualitate, lucruri făcute de tine |
| RS | Antrenorul ✅ | **ANTRENORUL** | THE COACH | acțiune + oameni, îi pui pe alții în mișcare |
| RE | Fondatorul ✅ | **FONDATORUL** | THE FOUNDER | acțiune + antreprenoriat, construiești de la zero |
| RC | Inginerul ✅ | **INGINERUL** | THE ENGINEER | sisteme + execuție, faci lucrurile să funcționeze |
| IR | Exploratorul ✅ | **EXPLORATORUL** | THE EXPLORER | curiozitate + experiment practic |
| IA | Gânditorul Creativ | **VIZIONARUL** | THE VISIONARY | idei + estetică, vezi ce nu există încă |
| IS | Profesorul | **MENTORUL** | THE MENTOR | cunoaștere + oameni, explici și ridici pe alții |
| IE | Inovatorul ✅ | **INOVATORUL** | THE INNOVATOR | idei + inițiativă, transformi gândul în lucru |
| IC | Analistul | **DECODORUL** | THE DECODER | date + structură, găsești tiparul ascuns |
| AR | Artistul Tangibil | **ARTISTUL MATERIEI** | THE TACTILE ARTIST | estetică + materialitate, frumos care se atinge |
| AI | Cercetătorul Artistic | **ALCHIMISTUL** | THE ALCHEMIST | curiozitate + expresie, amesteci artă și știință |
| AS | Povestitorul ✅ | **POVESTITORUL** | THE STORYTELLER | narațiune + oameni, ții atenția unei săli |
| AE | Performerul ✅ | **PERFORMERUL** | THE PERFORMER | expresie + public, trăiești pe scenă |
| AC | Designerul ✅ | **DESIGNERUL** | THE DESIGNER | estetică + ordine, frumos care funcționează |
| SR | Operatorul Social | **OMUL DE BAZĂ** | THE GO-TO | oameni + acțiune practică, ești acolo când contează |
| SI | Educatorul ✅ | **EDUCATORUL** | THE EDUCATOR | oameni + cunoaștere, crești pe alții |
| SA | Interpretul Social | **AMBASADORUL** | THE AMBASSADOR | oameni + expresie creativă |
| SE | Conectorul de Oameni | **LIDERUL DE ECHIPĂ** | THE TEAM BUILDER | oameni: HR, sales, organizare echipe |
| SC | Organizatorul ✅ | **ORGANIZATORUL** | THE ORGANISER | oameni + structură, ții totul la un loc |
| ER | Antreprenorul ✅ | **ANTREPRENORUL** | THE ENTREPRENEUR | inițiativă + execuție practică |
| EI | Strategul ✅ | **STRATEGUL** | THE STRATEGIST | decizie + analiză, vezi mutarea următoare |
| EA | Producătorul ✅ | **PRODUCĂTORUL** | THE PRODUCER | inițiativă + expresie creativă |
| ES | Conectorul ✅ | **CONECTORUL** | THE CONNECTOR | inițiativă + oameni |
| EC | Managerul | **DIRIJORUL** | THE CONDUCTOR | decizie + structură, conduci o echipă |
| CR | Tehnicianul ✅ | **TEHNICIANUL** | THE TECHNICIAN | execuție + sisteme, repari și menții |
| CI | Auditorul | **DETECTIVUL DE DATE** | THE DATA DETECTIVE | date + verificare, prinzi greșeala pe care n-o vede nimeni |
| CA | Editorul ✅ | **EDITORUL** | THE EDITOR | structură + estetică |
| CS | Consilierul ✅ | **CONSILIERUL** | THE ADVISOR | structură + oameni |
| CE | Operatorul | **COORDONATORUL** | THE COORDINATOR | structură + acțiune, faci lucrurile să meargă |

Schimbări „grele" (de la clinic la identitate): **Analistul→Decodorul,
Auditorul→Detectivul de Date, Operatorul→Coordonatorul, Operatorul Social→Omul de Bază,
Managerul→Dirijorul, Profesorul→Mentorul, Cercetătorul Artistic→Alchimistul.**
Restul sunt fie deja bune, fie ajustări fine. Toate rămân **adevărate față de axă**.

> **Criteriu de unicitate (adăugat la review):** niciun substantiv-cap nu se
> repetă între cele 30 de nume (ex. două „LIDERUL …" sunt interzise — de aceea
> EC = DIRIJORUL, nu LIDERUL, cât timp SE = LIDERUL DE ECHIPĂ). Testul de layout
> pe share card se face cu numele *alese*, inclusiv cel mai lung din set.

---

## STRATUL 2 — Lumile de carieră (~14 triburi)

Acesta e raftul de explorare și de identitate. Numele sunt evocative; fiecare
Lume conține cariere care își păstrează RIASEC + signals pentru matching.
Am inclus aici **numele din prototip pe care le-ai plăcut** (Bio-Explorer →
Exploratorii Vieții, Urban Farmer → sub Gardienii Planetei, AI Ethicist →
sub Mințile AI, Arhitect Digital → Constructorii Digitali).

| # | Lume (RO / EN) | Ce conține | Cariere existente (exemple) | De adăugat (future-looking) |
|---|---|---|---|---|
| 1 | **Constructorii Digitali** / Digital Builders | software, web, mobil, gaming, infra cod | Software Engineer, Mobile Dev, Game Developer, Low-code/No-code, DevOps, QA, Sysadmin, Data Engineer | — |
| 2 | **Mințile AI** / AI & Machine Minds | construit + guvernat AI (postul AI-native) | AI Engineer, ML Engineer, MLOps, Data Scientist | **AI Ethicist**, Prompt/Context Engineer, AI Trainer, AI Red-teamer / AI Security, Conversation Designer |
| 3 | **Exploratorii Vieții** / Life Explorers | life sciences, biotech, longevitate | Biolog, Inginer biomedical, Coordonator studii clinice, Farmacist, Medic veterinar | Bioinformatician / Genomică, Consilier genetic, Specialist longevitate / age-tech |
| 4 | **Vindecătorii** / The Healers | sănătate clinică & terapii | Medic, Stomatolog, Asistent medical, Moașă, Paramedic, Kinetoterapeut, Nutriționist, Tehnician radiologie/laborator, Terapeut ocupațional, Specialist sănătate digitală | — |
| 5 | **Gardienii Planetei** / Planet Guardians | climă, energie verde, mediu | ESG Manager, Carbon accounting, Inginer mediu/energetic, Solar PV, Turbine eoliene, Baterii, Stații EV, Auditor energetic, Urbanist, Agronom | Climate risk analyst, **Fermier urban / agritech regenerativ** |
| 6 | **Povestitorii** / The Storytellers | media, jurnalism, creator economy | Content Creator, YouTuber/Streamer, Podcaster, Jurnalist (teren/investigație), Reporter, Editor, PR, Social Media Manager | — |
| 7 | **Creatorii Vizuali** / Visual Creators | design, artă digitală, vizual | Product Designer, Creative Director, Motion Designer, 3D Artist, UX Researcher, Fotograf, Video Editor, Game Designer, Artist plastic | — |
| 8 | **Artizanii** / The Makers | meșteșug, mâini, frumusețe, food craft | Tâmplar, Bijutier, Ceramist, Restaurator, Sudor, Florar, Tatuator, Croitor, Bucătar, Cofetar, Barber, Stilist, Make-up, Nail | — |
| 9 | **Constructorii Lumii Fizice** / World Builders | inginerie, infra, robotică | Inginer mecanic/electric/electronist/civil/auto/chimic, Arhitect, Robotică, Mecatronică, CNC, Electrician, HVAC, Instalator, BMS, Process Engineer | — |
| 10 | **Fondatorii** / The Founders | business, startup, growth, vânzări | Startup Founder, Fondator e-commerce, Antreprenor Social/Craft, Product Manager, Growth/Performance Marketer, Brand Manager, Sales B2B, Customer Success, RevOps | — |
| 11 | **Oamenii Numerelor** / The Numbers People | finanțe, date, ordine, conformitate | Analist financiar, Contabil, Auditor financiar, Funcționar bancar, Compliance, DPO/GDPR, Procurement, Logistică, Project Manager | — |
| 12 | **Oameni pentru Oameni** / The People People | educație, îngrijire, social (incl. emergent) | Asistent social, Psiholog (clinician/școlar/org), Logoped, Profesor, Educator, Profesor de sprijin, Îngrijitor vârstnici, Protecția copilului, HR/Recruiter, Trainer, Instructional Designer | **Community health worker**, Coach sănătate mintală / peer-support, Coordonator îngrijire vârstnici / age-tech, Specialist accesibilitate & incluziune |
| 13 | **Protectorii** / The Protectors | apărare, ordine, siguranță publică | Armata (ofițer/subofițer/pilot), Poliție, Jandarm, Pompier ISU, SMURD, Analist intelligence, Inginer apărare, Agent securitate, Tehnician CCTV, Vamal, Funcționar public | — |
| 14 | **Aventurierii** / The Adventurers | turism, transport, sport, gig, mobilitate | Ghid turistic, Antrenor sportiv/Personal Trainer, Șofer profesionist, Curier/livrator, Recepționer hotel, Event Planner, DJ/Producător muzical, Actor | — |

> **De ce 14 și nu 30:** 30 e numărul matematic al perechilor RIASEC; pentru
> *explorare*, 12–16 e pragul digerabil pentru un adolescent (prototipul avea 12).
> Lumile pot crește/scădea ușor — nu sunt legate de matematica scorării.

> **Notă de acoperire (onestitate):** tabelul de mai sus dă *exemple*, nu maparea
> completă a celor ~170 cariere — aceea e un task de Faza B. Câteva clustere n-au
> încă o casă curată și trebuie decise atunci: **drept/juridic** (Avocat — nu există
> azi o Lume „Justiție & Politici"; întrebare: o creăm a 15-a, sau o punem la
> Oamenii Numerelor?), **comerț/retail** (Casier, Vânzător, Agent imobiliar),
> **suport administrativ** (Office manager, Operator depozit), **traducere**
> (Traducător/Interpret). Niciunul nu sparge modelul — doar de plasat.

---

## Cum se leagă cele două straturi (model de date)

Lumile sunt **ortogonale** față de cele 30 de axe — nu le înlocuiesc. Mecanismul
minim de implementare:

1. **Câmp nou pe carieră:** `worlds: string[]` în `careers.json` (o carieră poate
   sta în 1–2 Lumi). NU se atinge `riasec[]` / `signals[]` / `traits[]` / `big5[]`.
2. **Tabel de Lumi** (nou fișier, ex. `apps/web/src/lib/results/worlds.ts`):
   id, nume RO/EN, tagline, glyph/culoare, descriere.
3. **Matching neschimbat.** `/api/match` rămâne identic. Lumile se afișează prin
   agregare: din top-N cariere matchuite, numărăm Lumile dominante → „Lumi care ți
   se potrivesc". Zero risc pentru ponderile protejate din `docs/SCORING-AND-MATCHING.md`.
4. **Pagina de rezultat:** titlu = arhetipul-axă redenumit (Stratul 1); sub el,
   2–3 chip-uri de Lume (Stratul 2) ca puncte de intrare în `/browse`.
5. **`/browse`** capătă Lumile ca filtru principal de nivel înalt (azi e listă plată).
6. **Shareable card:** rămâne pe arhetipul-axă (identitatea personală e mai
   share-abilă decât un raft de catalog) — coerent cu `VIRAL-PHASE-D-PLAN.md`.

### Îmbunătățiri propuse după review

Planul de bază e bun: separă corect psihometria de merchandising-ul editorial.
Ca să nu stricăm încrederea în rezultat în timp ce îl facem mai atractiv, aș
adăuga aceste guardrails:

1. **Validare cu adolescenți înainte de ship.** „Gen-Z friendly" nu trebuie să
   însemne slang care îmbătrânește în 6 luni. Pentru Faza A, testați 2–3 variante
   de nume pe 10–15 elevi români (14–18 ani), ideal din profile diferite. Întrebări:
   „sună ca tine?", „sună cringe?", „sună ca o meserie sau ca o identitate?",
   „îți dă statut sau te micșorează?". Ship doar numele care trec testul de
   claritate + statut.
2. **Atenție la numele cu risc de interpretare.** *(decis 2026-06-11)*
   - `AJUTORUL` (low-status) → **respins**; ales **OMUL DE BAZĂ** / THE GO-TO —
     registru Gen-Z nativ, status înalt, onest față de S+R.
   - `ALCHIMISTUL` → **păstrat**; tagline-ul clarifică legătura artă + știință.
     (Alternativa EXPERIMENTATORUL CREATIV respinsă: 24 caractere, risc de layout.)
   - `MAKERUL` → **păstrat** (asumat ca englezism); de urmărit la validarea cu elevi.
   - `LIDERUL` pentru EC → **respins** (generic + coliziune cu LIDERUL DE ECHIPĂ/SE;
     COORDONATORUL e luat de CE); ales **DIRIJORUL** / THE CONDUCTOR.
   Numele alese se confirmă la validarea cu elevi (pct. 1); A/B post-ship e posibil
   fără risc pentru matching.
3. **Adăugați o Lume explicită pentru drept, civism și reguli.** În nota de
   acoperire, Avocatul e împins spre „Oamenii Numerelor", ceea ce e funcțional
   dar nu intuitiv pentru elevi. O a 15-a Lume — **Apărătorii Dreptății** /
   **Justice & Civic Systems** — ar putea conține avocat, jurist, magistratură,
   politici publice, administrație, diplomație, compliance/DPO. *(decis 2026-06-11:
   creăm a 15-a Lume — fallback-ul „în Protectorii" e mai rău decât problema:
   avocați și diplomați sub apărare/poliție e mai neintuitiv decât sub Numbers.
   Funcționarul public migrează aici din Protectorii; DPO/compliance poate sta în
   2 Lumi — casa canonică rămâne Oamenii Numerelor.)*
4. **Folosiți un sidecar pentru prima mapare `career → worlds`.** În loc să
   modificați direct toate cele ~170 de obiecte din `careers.json`, Faza B poate
   începe cu `data/career-worlds.json` sau `apps/web/src/lib/results/career-worlds.ts`.
   Avantaj: diff mic, review ușor, rollback simplu. După ce taxonomia e stabilă,
   câmpul `worlds[]` poate fi denormalizat în `careers.json` sau mutat în DB.
5. **Agregarea Lumilor trebuie ponderată, nu doar numărată.** Dacă numărăm simplu
   Lumile din top-N cariere, o Lume cu multe cariere similare poate domina. Mai
   robust: `worldScore += (raw / maxRaw) / numberOfWorldsOnCareer`, cu top
   12–20 cariere, apoi afișăm primele 2–3 Lumi cu prag minim.
   Detalii legate de `matcher.ts` (precizate la review):
   - Folosiți **raw/maxRaw, NU scorul calibrat** — calibrarea are FLOOR=25,
     CEIL=80–95, deci și cea mai slabă carieră ar contribui ~26% pondere și ar
     aplatiza diferențele dintre Lumi.
   - Top 12–20 traversează granița MMR (primele 6 sunt re-ordonate pentru
     diversitate cu λ=0.7, restul sortate pe raw) — pentru agregare folosiți
     ordinea pe **raw** pe tot intervalul.
   - **Prag minim concret:** o Lume se afișează doar dacă are ≥2 cariere în top-N
     **și** worldScore ≥ 50% din Lumea fruntașă.
   - **Gating pe încredere:** sub `confidence` scăzut (o singură sursă), chip-urile
     de Lume se ascund sau trec pe framing „explorează" — rezultatele single-source
     sunt comprimate și top-3 Lumi ar fi zgomotoase.
   Matching-ul rămâne neschimbat, dar explicația devine mai stabilă.
   *(Decis la implementare, 2026-06-11: agregarea rulează **server-side în
   `computeMatches()`** și răspunsul `/api/match` expune doar `worlds: WorldId[]`.
   Scorurile raw/normalizate NU se serializează — ar ocoli contractul calibrat
   25–95 și ar da clienților un semnal de reverse-engineering pe scoring.)*
6. **Păstrați sursele de trend în tier-uri.** WEF 2025 e bun ca sursă de
   direcție macro. Pentru titluri concrete precum prompt/context engineer,
   AI red-teamer sau age-tech coordinator, marcați-le ca „roluri emergente
   editoriale" dacă sursa e presă/blog, nu raport primar. Evitați să transformați
   headline-uri de trend în promisiuni de carieră sigură.
7. **Adăugați criterii clare de acceptare pentru fiecare fază.**
   Faza A: toate cele 30 de perechi au RO+EN; taglines rămân în registru de
   atracție; `deriveArchetype()` nu schimbă perechea/glyph-ul; screenshot pe
   share card nu rupe layout-ul cu cel mai lung nume *ales* (DETECTIVUL DE
   DATE / CONECTORUL CREATIV — 18 caractere); **niciun substantiv-cap repetat**
   între cele 30 de nume.
   Faza B: fiecare carieră are 1–2 Lumi; niciun filtru `/browse` nu returnează
   zero rezultate; top-3 Lumi de pe rezultate sunt explicabile prin carierele
   afișate; **test CI de bijecție pe sidecar** (ex. `career-worlds.test.ts`):
   fiecare `id` din `careers.json` apare exact o dată în mapare, 1–2 Lumi per
   carieră, zero id-uri orfane în ambele direcții.

### Microcopy pentru rezultat

Pe pagina de rezultat, evitați să pară că testul „decide cine ești". Formula mai
sigură pentru 14–18 ani:

> **Vibe-ul tău de lucru:** DECODORUL  
> Te atrag rolurile în care găsești tipare, verifici date și transformi haosul în
> claritate.  
> **Lumi de explorat:** Mințile AI · Oamenii Numerelor · Constructorii Digitali

Astfel, arhetipul rămâne o oglindă de interese, iar Lumile devin invitații de
explorare, nu etichete definitive.

---

## Cariere future-looking de adăugat (sursă-ancorat)

Catalogul are deja un start bun (vezi Stratul 2). Lista de mai jos umple golurile
pe direcțiile pe care le-ai cerut — **toate sunt titluri reale, în uz azi**, nu
inventate. Ancorate în WEF Future of Jobs 2025 și în rapoarte de roluri emergente
(vezi Surse). Se adaugă în `careers.json` urmând procesul din
`docs/CAREER-CATALOGUE-EXPANSION-PLAN.md`.

**Lumea nouă după adopția AI (Mințile AI):**
- **AI Ethicist / Responsible-AI & Policy Officer** — supraveghează folosirea
  responsabilă a AI; rol în creștere accentuată. *(prototip favorit)*
- **Prompt / Context Engineer** — proiectează interacțiuni și „grounding" pentru
  LLM-uri (creșterea „~+135%" e raportată în presă, nu în raport primar — se
  marchează „rol emergent editorial" per regula 6).
- **AI Trainer / Fine-tuning specialist** — antrenează/calibrează modele pe cazuri specifice.
- **AI Red-teamer / AI Security** — „hackeri etici de AI", testează guardrails.
- **Conversation Designer** — proiectează fluxuri pentru asistenți/agenți AI.

> Notă: WEF 2025 dă specialiștii AI & ML, big data și fintech drept **cele mai
> rapide creșteri procentuale**; AI + procesarea datelor → ~11M roluri create.

**Life sciences & longevitate (Exploratorii Vieții):**
- **Bioinformatician / Specialist genomică**
- **Consilier genetic**
- **Specialist longevitate / age-tech** — economia longevității e printre cele mai
  mari direcții de creștere; se leagă de economia îngrijirii.

**Climă & adaptare (Gardienii Planetei):**
- **Analist risc climatic / Climate risk analyst**
- **Fermier urban / Specialist agricultură regenerativă (agritech)** *(prototip favorit)*

**Roluri sociale emergente (Oameni pentru Oameni):**
- **Community health worker** — WEF FoJ 2025 listează rolurile de îngrijire
  (nursing, asistență socială, personal care) printre creșterile mari, pe fond
  demografic. *(Corecție 2026-06-11: cifra „≈40% din noile joburi = economia
  îngrijirii" circulă doar în presă secundară și NU apare în raportul WEF — cel
  mai mare volum absolut îl au rolurile frontline: agricultori +35M, livratori,
  construcții. Nu folosim cifra de 40%.)* Rol nepopular azi în RO, cerere reală.
- **Coach sănătate mintală / Peer-support specialist**
- **Coordonator îngrijire vârstnici / Age-tech** — la intersecția longevitate × îngrijire.
- **Specialist accesibilitate & incluziune**

Acoperă exact cele trei direcții cerute: **post-AI (uman, etică, oversight),
life sciences emergent, roluri sociale care vor exploda dar sunt nepopulare acum.**

---

## Rollout pe faze (de la risc mic la risc mai mare)

**Faza A — Redenumirea celor 30 (zile, risc minim).**
Modifici doar `ARCHETYPES_RO` / `ARCHETYPES_EN` în `archetypes.ts`. *(Verificat
la review: numele NU sunt duplicate în i18n — `ro.json`/`en.json` doar
interpolează `{archetype}`; singurul consumator e `shareable-card.tsx`. Deci
Faza A = un singur fișier + verificare vizuală pe card.)* Zero impact pe
matching. Doar ~12 nume se schimbă efectiv; cele 18 cu ✅ nu necesită validare.
Reversibil instant.

**Faza B — Stratul de Lumi (1–2 săptămâni, risc mic).**
Adaugi `worlds.ts` + câmpul `worlds[]` pe carierele existente; afișezi chip-urile
de Lume pe rezultate; faci Lumile filtru în `/browse`. Matching neatins.

**Faza C — Expansiunea catalogului (continuu, risc mediu pe date).**
Adaugi cele ~15 cariere noi prin `CAREER-CATALOGUE-EXPANSION-PLAN.md` (cu
RIASEC/signals/big5 + programe/facultăți). Le mapezi la Lumi pe măsură ce intră.

**Faza D — Reflux UI / share (opțional).**
Vizual de Lumi pe home (înlocuiește/îmbogățește VIBE CHECK), eventual carduri de
Lume share-abile pe lângă cardul de arhetip.

---

## Întrebări deschise (pentru tine)

1. **Numele de Lumi** — îți plac cele 14 (RO + EN), sau vrei alt registru
   (mai jucăuș / mai serios)? Care din numele de prototip mai vrei păstrate exact?
2. **Câte Lumi** — 14 e ok, sau comprimăm la 12 (ex. fuzionăm Aventurierii în
   alte Lumi)?
3. **Redenumirile „grele"** — ești ok cu Decodorul / Detectivul de Date /
   Coordonatorul / Ajutorul / Liderul, sau preferi să rămânem mai aproape de actual?
4. **Bilingv acum sau RO-first** — fac propunerea EN finală în paralel, sau ne
   concentrăm pe RO și EN vine la i18n?
5. **Ordinea fazelor** — pornim cu Faza A (redenumiri, câștig rapid) sau mergem
   direct pe A+B împreună?

---

## Surse

- [WEF — Future of Jobs Report 2025](https://www.weforum.org/publications/the-future-of-jobs-report-2025/)
- [WEF — Fastest growing and declining jobs 2025](https://www.weforum.org/stories/2025/01/future-of-jobs-report-2025-the-fastest-growing-and-declining-jobs/)
- [WEF — 78M new jobs by 2030 (press)](https://www.weforum.org/press/2025/01/future-of-jobs-report-2025-78-million-new-job-opportunities-by-2030-but-urgent-upskilling-needed-to-prepare-workforces/)
- [WEF FoJ 2025 — §2 Jobs outlook (frontline vs. care growth)](https://www.weforum.org/publications/the-future-of-jobs-report-2025/in-full/2-jobs-outlook/) *(tier 1)*
- *(tier 2–3, doar pentru „roluri emergente editoriale", nu pentru cifre):*
- [Care economy blog (interviewguys)](https://blog.theinterviewguys.com/guide-to-breaking-into-the-290-billion-care-economy/) — cifra „40%" NEconfirmată de WEF, nu se citează
- [Longevity / age-tech careers](https://blog.theinterviewguys.com/high-paying-careers-in-age-tech-and-elder-care/)
- [Future biotech roles](https://biotechnologyjobs.co.uk/career-advice/the-future-of-biotechnology-jobs-careers-that-don-t-exist-yet)
- [New AI job titles 2025 (Washington Post)](https://www.washingtonpost.com/business/2025/10/29/ai-new-jobs/)
- [Emerging AI job roles 2026 (ODSC)](https://odsc.medium.com/from-context-engineers-to-chief-ai-officers-emerging-ai-job-roles-for-2026-9f757603f547)
