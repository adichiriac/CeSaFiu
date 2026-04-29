# Analiza de impact privind protecția datelor (DPIA) — Ce Să Fiu?

*Versiune: v0.1-draft (2026-04-29). Status: **DRAFT pentru consult juridic.** Document intern; nu se publică în această formă. Câmpurile marcate `[TODO]` se completează înainte de consultul cu avocatul.*

*Documente parteneră: [`docs/PRIVACY-POLICY.md`](PRIVACY-POLICY.md), [`docs/PHASE-2-PLAN.md`](PHASE-2-PLAN.md) (schemă §4, fluxuri §6), [`docs/PSYCHOMETRICS.md`](PSYCHOMETRICS.md), [`docs/CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md).*

---

## Executive summary (EN)

Ce Să Fiu? is a Romanian career-orientation platform for high-school students (grades 9-12, ages roughly 14-19). It collects pseudonymous test responses, account data when users register, and parental consent records when users are under 16. Processing involves systematically observed minors and inferred personality / vocational profiles. Under Art. 35 GDPR, this triggers a Data Protection Impact Assessment.

The principal risks identified are: (1) re-identification of minors from combinatorial profile data, (2) parent-bypass through self-declared age, (3) sensitive interpretation of personality scores by the data subject leading to harm, (4) profile drift over time creating inaccurate records, (5) legitimate-interest claim for analytics not surviving a strict balancing test on minor data, (6) onward processing risk if processors (Supabase, Vercel, Resend) suffer breach.

Mitigations adopted: pseudonymisation of anonymous flow, hashing of IPs and parent emails, Vault encryption of parent email cleartext, server-side scoring (no leakage of weights to client), Row-Level Security on every user-scoped table, replay-gating that hard-blocks session replay for users in the 14-15 age band, retention limits, end-to-end implementation of erasure and data export, mandatory disclaimers on test interpretation, manual fulfilment of the paid report (no automated decision-making for paid output).

Residual risks remain meaningful and must be reviewed by Romanian privacy counsel before launch. The honor-based age gate is the largest unmitigated residual: a determined 14-year-old who declares 16+ self-consents and bypasses the parental flow. Counsel should confirm whether the current mitigation chain (signal-based heuristics post-launch, parental revocation flow, audit log) is sufficient, or whether stronger age-verification is required.

---

## 1. Context și necesitate

### 1.1 De ce facem DPIA

Conform Art. 35(1) GDPR, o evaluare a impactului asupra protecției datelor este obligatorie atunci când prelucrarea este "susceptibilă să genereze un risc ridicat pentru drepturile și libertățile persoanelor fizice". Art. 35(3) listează categoriile *automate* de prelucrare, iar Recital 75 plus liniile directoare WP248 (acum EDPB) indică următoarele criterii ridicate pentru cazul nostru:

- **Date despre persoane vulnerabile (minori)** — utilizatorii principali sunt elevi din clasele 9-12, deci 14-19 ani, dintre care o parte sub 16 ani.
- **Evaluare sau scorare** — testele atribuie scoruri de personalitate (Big Five / IPIP-NEO-60), interese (RIASEC) și recomandări de carieră.
- **Combinarea seturilor de date** — răspunsuri la test + profil de cont + cariere salvate + analitici.
- **Prelucrare la scară** *(potențial — ne raportăm la 50.000 MAU în Faza 2-3)*.

Lista ANSPDCP a operațiunilor care necesită DPIA include "date privind minori" și "monitorizare sistematică" — confirmă acoperirea în consultul juridic.

**Concluzie:** DPIA obligatorie. [TODO: confirmă cu avocatul dacă DPIA trebuie consultată cu ANSPDCP înainte de start, sau doar păstrată ca document intern.]

### 1.2 Cine este vizat

- Elevi din clasele 9-12 din România (vârste tipic 14-19 ani), inclusiv minori sub 16 ani — categoria de **persoane vulnerabile** definită în Recital 38 GDPR.
- Părinți / tutori legali, când consimt pentru un minor sub 16 ani.
- Utilizatori adulți (18+) care folosesc platforma personal (proporție mai mică, dar reală — adulți care reorientează carieră).

### 1.3 Operatorul, procesatorii și DPO

- **Operator (controller):** DataWeb Consultants SRL.
- **DPO:** [TODO — la momentul scrierii nu am desemnat formal un DPO; consult juridic clarifică dacă este obligatoriu pentru talia noastră. Art. 37 GDPR + Legea 190/2018 ne sugerează că pentru "monitorizare sistematică pe scară largă" sau "categorii speciale pe scară largă" da; sub aceste praguri, opțional. Punctul de contact temporar pentru date personale: adresa de email din politica de confidențialitate.]
- **Procesatori:** Supabase Inc. (DB + auth), Vercel Inc. (hosting), Resend Inc. (email tranzacțional), Functional Software Inc. / Sentry (error tracking), instanță proprie Umami pe Railway (analitică). Detalii contractuale (DPA-uri) — vezi §5.

---

## 2. Descrierea procesării

### 2.1 Fluxuri de date

Sursa primară a fluxurilor este §6 din `PHASE-2-PLAN.md`. Pe scurt, șase trasee:

#### Flux A — discovery anonim
1. Utilizator deschide platforma → starea este pur clientă (Zustand + localStorage). Nu primește `anonymous_id` server-side.
2. Răspunde la quiz / test personalitate / vocațional. Edge Function `score-quiz` (respectiv `score-personality`, `score-vocational`) **calculează scorurile și le returnează — nu scrie în DB.** Funcțiile sunt stateless; weight-urile + mapările cariere↔programe rămân server-side, pentru protecția IP.
3. Rezultatele și până la 3 cariere salvate trăiesc în localStorage. Server-ul nu reține nicio urmă a parcursului.
4. Niciun rând în `quiz_runs`/`personality_runs`/`vocational_runs` nu este creat în acest flux. Câmpul de schemă `anonymous_id` rămâne pentru utilizări viitoare, dar **nu este populat în v2**.

#### Flux B — creare cont
1. Trigger: a 3-a salvare, a 2-a vizită, sau click pe paid intent.
2. Autentificare: Google OAuth / Apple Sign in / email magic link prin Resend.
3. La finalizare auth → row în `auth.users` (Supabase) + `profiles` (creat de aplicație).
4. Sincronizare localStorage → `saved_careers` + `saved_programs` cu `user_id`.
5. Cererea de a sincroniza istoricul de teste (din localStorage în `*_runs`) este **explicită și gated**: rulează doar după ce utilizatorul confirmă "Salvează istoricul testelor" ȘI `age_band` ≥ 16 sau `consent_status = parent_confirmed`. Pentru pending_parent, sincronizarea istoricului rămâne suspendată până la confirmare.

#### Flux C — age gate
1. După prima auth → întrebarea "Câți ani ai?" cu 4 opțiuni.
2. Răspuns salvat în `profiles.age_band`.
3. Logică ramificată în consecință (vezi flux D pentru sub 16).

#### Flux D — consimțământ părintesc (sub 16 ani)
1. `consent_status = 'pending_parent'`; aplicația intră în "modul limitat".
2. Cerem email-ul părintelui → calculăm hash + criptăm originalul cu Supabase Vault → stocăm `parent_email_hash` și `parent_email_enc`.
3. Generăm token 256-bit aleator în `parent_consent_tokens`, expiră la 30 zile.
4. Trimitem prin Resend email către părinte cu link `/parent-consent?token=...`.
5. Click pe link → Edge Function validează token (nefolosit, neexpirat) → setează `consent_status = 'parent_confirmed'` → inserează `consent_records` cu `event = 'parent_confirmed'` + hash IP + hash user-agent.
6. Confirmare prin email către părinte și copil.
7. Modul limitat se ridică (sincronizare cloud activă, paid intent permis).
8. Revocare: părintele inițiază revocarea (prin email la adresa de date sau prin link de revocare inclus în email-ul de confirmare inițial — mecanismul exact se finalizează în M5) → `consent_status = 'revoked'` → `consent_records` audit row → modul limitat se reactivează → notificare către copil.

#### Flux E — paid intent
1. Utilizatorul (16+ sau cu `parent_confirmed`) apasă "Vreau raportul plătit".
2. Email-ul + contextul testului + acordul cu termenii → `paid_intents`.
3. Adi este alertat → contactează manual utilizatorul → livrare manuală PDF.
4. Nu există plată automată în Faza 2.

#### Flux F — drepturi ale persoanei vizate
1. Setări → Cont → "Descarcă datele mele" → Edge Function generează export JSON cu toate înregistrările cu `user_id` (`profiles`, `saved_*`, `quiz_runs`, `paid_intents`, `consent_records`).
2. Setări → Cont → "Șterge contul" → confirmare prin email → Edge Function `delete_account` execută `DELETE FROM auth.users WHERE id = $1`. Pe `auth.users`:
   - **Cascade hard-delete:** `profiles`, `quiz_runs`, `personality_runs`, `vocational_runs`, `saved_careers`, `saved_programs`, `parent_consent_tokens` (toate `on delete cascade`).
   - **Pseudonimizare (set null):** `consent_records.user_id` este nulificat — rândul supraviețuiește cu hash-urile de IP/UA și timestamp-urile, ca probă a consimțământului. Curățarea finală a acestor rânduri pseudonimizate se face de un cron care șterge orice `consent_records` cu `created_at` mai vechi de 3 ani.
   - **Pseudonimizare (set null):** `paid_intents.user_id` este nulificat — rândul rămâne ca înregistrare anonimă pentru raportare contabilă agregată; același cron de 3 ani șterge formele anonime expirate.
3. Părintele aceleiași logici prin endpoint dedicat, cu validare de hash de email.

### 2.2 Categoriile de date

Mapate la tabelele din §4 PHASE-2-PLAN:

| Categorie | Tabel(e) | Câmpuri | Personal? | Sensibil? |
|---|---|---|---|---|
| ~~Identificator anonim~~ | `quiz_runs.anonymous_id` etc. — câmp de schemă, **NU este populat în v2** (vezi §2.1 Flux A) | n/a | n/a | n/a |
| Răspunsuri test | `quiz_runs.answers`, `personality_runs.responses`, `vocational_runs.picks` | jsonb | Da, când e legat de cont | Profilare; vezi §4 |
| Scoruri test | `quiz_runs.scores`, `personality_runs.scores` | jsonb (RIASEC + Big5) | Da | Profilare; risc de auto-stigmatizare |
| Email cont | `auth.users.email` | text | Da | Nu |
| Vârstă (categorie) | `profiles.age_band` | enum | Da | Da, indirect — declanșează regimul minorilor |
| Nume afișat | `profiles.display_name` | text opțional | Da | Nu |
| Email părinte hash | `profiles.parent_email_hash` | text | Da (asupra părintelui) | Nu (hash) |
| Email părinte criptat | `profiles.parent_email_enc` | text criptat Vault | Da | Da — în clar pentru trimitere mail |
| Stare consimțământ | `profiles.consent_status` | enum | Da | Da — proba conformității |
| Token consimțământ | `parent_consent_tokens.token` | text 256-bit | Indirect (legat de child) | Da — bypass parent dacă scapă |
| Înregistrări consimțământ | `consent_records.*` | event + hash IP + hash UA | Da (audit) | Nu (hash-uri) |
| Cariere salvate | `saved_careers` | FK | Da | Nu |
| Programe salvate | `saved_programs` | FK | Da | Nu |
| Intent plată | `paid_intents.email`, `context` | text | Da | Nu |
| Evenimente analitice | Umami | anonim | Pseudonim | Nu |
| Erori aplicație | Sentry | breadcrumbs scrubbed; `user_id` atașat doar pentru utilizatori confirmați 16+ sau `parent_confirmed` — vezi §3.2 | Da | Nu |

**Categorii speciale Art. 9 GDPR?** Linia este fină pentru scoruri de personalitate. Argument **pro**: scorurile pot indica vulnerabilități (Neuroticism înalt) care sunt caracteristici psihologice cu valoare medical-adiacentă. Argument **contra**: nu sunt diagnostic medical, instrumentul e public-domain, scorul nu este "data privind sănătatea" în sensul restrictiv al Art. 9. **Poziție internă:** tratăm ca date sensibile prin politică (acces restricționat, retention strict, încărcare opt-in pentru replay), dar **nu** invocăm Art. 9 ca temei legal. **[TODO: validează cu avocatul.]**

### 2.3 Scopuri ale prelucrării

| Scop | Date implicate | Temei legal |
|---|---|---|
| Funcționarea serviciului de orientare (anonim) | quiz/personality/vocational runs (anonim) | Interes legitim — Art. 6(1)(f) |
| Crearea și administrarea contului | profil + auth | Contract — Art. 6(1)(b) |
| Sincronizarea progresului între dispozitive | saved_*, quiz_runs (cu user_id) | Contract — Art. 6(1)(b) |
| Conformitate cu obligația parentală pentru minori sub 16 | parent_consent_tokens, consent_records | Obligație legală + consimțământ — Art. 6(1)(c) + Art. 8(1) |
| Lista de pre-comenzi raport plătit | paid_intents | Consimțământ + măsuri precontractuale — Art. 6(1)(a) + (b) |
| Analitică non-intruzivă (Umami fără cookies, Web Vitals) | evenimente agregate | **Consimțământ — Art. 6(1)(a)** (opt-in din banner; gestionat unitar cu replay-ul) |
| Înregistrare sesiune (replay) | recordings | Consimțământ explicit — Art. 6(1)(a) |
| Detectare erori (Sentry) | breadcrumbs + user_id | Interes legitim — Art. 6(1)(f) |
| Trimitere email tranzacțional (magic link, consent părinte) | email-uri | Contract / obligație legală |

### 2.4 Decizii automate și profilare

- **Matcherul de cariere** (Edge Function `score-quiz`) calculează similaritate cosinus între profilul utilizatorului și profilurile carierelor → returnează top N cariere. Aceasta este **profilare** în sensul Art. 4(4) GDPR.
- **Decizii cu efect juridic / similar semnificativ asupra utilizatorului (Art. 22 GDPR)?** Nu — recomandările sunt orientative, utilizatorul face alegerea. Mențiunea "punct de pornire, nu verdict" este parte din UX-ul testului. **Nu** invocăm Art. 22 ca interzis pe acest flux.
- **Raportul plătit** este redactat manual de Adi → fără decizie automatizată cu efect semnificativ.

---

## 3. Necesitate și proporționalitate

### 3.1 Test de necesitate

Pentru fiecare categorie de date colectate, întrebarea: putem livra serviciul fără?

| Date | Necesare? | Alternativă luată în considerare |
|---|---|---|
| Răspunsuri test | Da | Nu există recomandare fără răspunsuri |
| Email cont | Da | Magic link cere email; alternative (numai Google/Apple) ar elimina utilizatorii fără aceste conturi |
| Categoria de vârstă | Da | Necesară pentru stabilirea regimului legal corect |
| Nume afișat | Nu | Opțional — îl marcăm ca atare |
| Email părinte | Da, doar pentru sub 16 | Nu există alternativă mai puțin intruzivă pentru consimțământ verifiabil; vezi §4.3 |
| Cariere și programe salvate | Da (când utilizatorul cere) | Funcționalitatea explicită |
| Hash IP în consent log | Da | Ne protejează la audit ANSPDCP — alternativa "fără" lasă goluri în probă |
| Sentry breadcrumbs cu user_id | Discutabil | Păstrăm user_id doar pentru utilizatori confirmați 16+ sau `parent_confirmed`; pentru vârstă necunoscută / 14-15 folosim id generic per-sesiune. Analiza balancing test mai jos |
| Replay sesiune | Nu — doar pentru utilizatori opt-in 16+ | Implementat ca opt-in explicit, hard-block pentru 14-15 |

### 3.2 Test de proporționalitate

Decizia de bază (post-revizie 2026-04-30):
- **Analitica și înregistrarea sesiunii** rulează pe consimțământ explicit (Art. 6(1)(a)) — opt-in din banner. Nu invocăm interes legitim aici. Dacă utilizatorul alege "Doar esențial", nu pornește nimic.
- **Sentry** rămâne pe interes legitim (Art. 6(1)(f)), cu balancing test mai jos.

**Test de echilibru pentru Sentry:**

**Interesul nostru:** detectarea bug-urilor în producție; fără tracking de erori nu putem opera serviciul în siguranță.

**Drepturile utilizatorului:**
- Confidențialitatea răspunsurilor la test (mitigat — Sentry nu primește răspunsurile)
- Pentru minori: așteptare crescută de protecție (Recital 38 GDPR + ghidul EDPB pe consimțământ digital)

**Mitigări configurate de la M1 (Sentry de la lansare, înainte de age gate la M5):**
- `beforeSend` hook scrubează automat: email-uri, token-uri (auth, parent_consent), răspunsuri la teste, câmpuri parent_*.
- Pentru utilizatorii **necunoscuți de vârstă** sau **sub 16** (`age_band === '14-15'`), `user_id` NU este atașat la evenimentele Sentry — folosim un id generic per-sesiune.
- Doar pentru utilizatorii confirmați 16+ sau parent_confirmed atașăm user_id stabil la breadcrumb-uri.
- Retention 30 zile (plan free Sentry).

**Rezultat:** echilibrul rezultă în favoarea procesării. Decizia este documentată aici și în [`CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md) §3.

### 3.3 Minimizare

- Nu colectăm CNP, telefon, adresă fizică.
- Nu colectăm dată de naștere completă — doar categorie de vârstă.
- Email părinte stocat criptat + hash; cleartext doar la momentul trimiterii email-ului.
- IP-uri și user-agent-uri intră în consent log doar ca hash-uri; nu păstrăm versiunile în clar.
- Răspunsurile la test brute (`answers`, `responses`, `picks`) servesc revizuirii ulterioare a algoritmului — la 24 luni se anonimizează.

---

## 4. Riscuri identificate și mitigări

Riscurile sunt evaluate (Probabilitate × Impact) pe scara: Mică / Medie / Mare. Impactul este asupra **persoanei vizate**, nu asupra noastră.

### Risc R1 — Re-identificare a unui minor din profil combinatoriu

**Descriere:** un terț (atacator, școală, părinte separat de tutorele legal) poate restrânge identitatea unui utilizator combinând: oraș (din IP), categorie de vârstă, cariere salvate, scor RIASEC, școala vizată, nume afișat. Pe un set mic într-un oraș mic, devine identificabil.

**Probabilitate × Impact:** Medie × Mare.

**Mitigări:**
- Nu colectăm orașul direct; nu stocăm IP-ul în clar.
- Nume afișat este opțional și poate fi pseudonim.
- RLS Postgres blochează cross-account reads la nivel DB.
- Sharing-ul de "rezultatul meu" generează un OG image dintr-un `runId` care nu expune `user_id` direct.
- **[TODO mitigare suplimentară:** pentru exporturile (Art. 20) ale minorilor, anonimizăm câmpurile `display_name` în export dacă există flag de cont copil — discută cu avocatul.]

**Risc rezidual:** Mediu. Re-identificare contextuală de către cineva apropiat (ex. părintele non-tutore) rămâne posibilă.

### Risc R2 — Bypass al consimțământului parental

**Descriere:** un minor sub 16 ani declară fals 16+ în age gate → primește consimțământul "self" → bypass-uiește fluxul parental.

**Probabilitate × Impact:** Mare × Mare. Acesta este cel mai mare risc rezidual.

**Mitigări:**
- Disclaimer la age gate: "Răspunsul tău determină ce date colectăm. Dacă ai sub 16 ani, te rugăm să răspunzi sincer — astfel părintele tău poate aproba folosirea contului."
- Audit log pe schimbarea de age band (dacă utilizatorul revine și schimbă, păstrăm istoricul).
- **Detectare comportamentală post-launch (Faza 2.5):** semnale combinate (oră de utilizare, durata sesiunii, tipare de răspuns) indicând un cont declarat 16+ care se comportă ca 14-15 → flag intern → re-promptăm age band.
- Părintele care descoperă un cont al copilului poate cere ștergerea fără probă suplimentară.

**Risc rezidual:** Mare. Acceptabil **doar dacă** avocatul confirmă că soluții mai stricte (ex. verificare ID, parental gating al întregului flux) ar fi disproporționate la talia și natura serviciului. **Discută explicit în consult.**

### Risc R3 — Auto-stigmatizare din scoruri de personalitate

**Descriere:** un adolescent cu scor mare la Neuroticism citește interpretarea "Sensibil emoțional, simți totul intens" → dezvoltă imagine de sine negativă → consecințe asupra sănătății mentale.

**Probabilitate × Impact:** Medie × Mare. Riscul este mai degrabă reputațional / etic decât de încălcare GDPR pură, dar Art. 5(1)(d) (acuratețe) și GDPR Recital 75 (vulnerabili) îl ating.

**Mitigări:**
- Disclaimer obligatoriu pe ecranul de rezultate (vezi `PSYCHOMETRICS.md`): "test scurt, nu validat; pentru evaluare reală, instrument complet IPIP-NEO-60".
- Limbaj non-patologizant în interpretarea scorurilor: "Sensibil emoțional" în loc de "Anxios"; "Energic" în loc de "Hiperactiv".
- Toate interpretările trec printr-o revizuire de către un consilier psiholog [TODO: aranjează această revizuire înainte de Phase 2 launch — buget €200-500].
- Linkuri către resurse de suport mental dacă utilizatorul exprimă suferință în paid intent / contact.

**Risc rezidual:** Mediu. Mitigări tehnice și editoriale; nu putem elimina riscul complet — el ține de natura testelor de personalitate.

### Risc R4 — Profile drift / acuratețe

**Descriere:** scorurile se modifică în timp; un scor RIASEC din clasa a 9-a nu reflectă utilizatorul în clasa a 12-a; recomandări vechi sunt afișate ca "ale tale".

**Probabilitate × Impact:** Mare × Mică-Medie. GDPR Art. 5(1)(d) cere date "acurate și, când e necesar, actualizate".

**Mitigări:**
- Toate `quiz_runs` etc. au `created_at`. UI afișează "Acest rezultat e din [data]" pentru rezultate mai vechi de 6 luni.
- Re-prompt anual: "Au trecut 12 luni — vrei să refaci testul?"
- Anonimizare automată a runs > 24 luni (legarea cu `user_id` se rupe).

**Risc rezidual:** Mic. Mitigările sunt suficiente.

### Risc R5 — Breach la procesator (Supabase, Vercel, Resend, Sentry)

**Descriere:** unul dintre procesatori suferă breach → datele utilizatorilor noștri sunt expuse.

**Probabilitate × Impact:** Mică × Mare. Furnizorii sunt mari, certificați, dar incidente s-au întâmplat istoric (incl. la furnizori similari).

**Mitigări:**
- Toți procesatorii sunt în UE (Frankfurt) — datele nu părăsesc SEE în mod normal.
- Email părinte criptat cu Vault → chiar la un breach Supabase, atacatorul are doar hash + ciphertext.
- Tokenuri de sesiune scurte; refresh token cu rotație.
- DPA semnat cu fiecare procesator [TODO: confirmă semnarea DPA-urilor înainte de prod].
- Plan de notificare incident (72h Art. 33-34) documentat în [TODO: `docs/INCIDENT-RESPONSE.md` — creează în Phase 2].
- Sentry breadcrumbs nu conțin email/parolă/token (configurabil cu `beforeSend`).

**Risc rezidual:** Mic-Mediu. În afara controlului nostru direct; mitigăm prin alegere de furnizori și criptare.

### Risc R6 — Utilizarea analiticii pentru micro-targeting / publicitate (drift de scop)

**Descriere:** o versiune viitoare a noastră (sau un B2B partner în Phase 3) folosește datele agregate pentru a viza ad-uri sau pentru profilare comercială.

**Probabilitate × Impact:** Medie × Mare. Cel mai probabil scenariu de "drift" odată cu B2B (rangul plătit pentru programe).

**Mitigări:**
- Politica de confidențialitate este explicită: "Nu vindem și nu transferăm date către terți pentru marketing."
- Înainte de orice extensie B2B, DPIA va fi actualizată și consimțământul re-obținut explicit.
- Roadmap-ul (Phase 3) menționează rangul de programe ca un atribut al programului, nu ca profilare a utilizatorului — claritate din proiectare.
- [TODO: scrie un memo intern "B2B nu = revânzare de date" — clar pentru viitorii contributori.]

**Risc rezidual:** Mic, condiționat de respectarea acestei politici.

### Risc R7 — Token de consimțământ părinte interceptat

**Descriere:** email-ul către părinte cu link-ul de consimțământ este interceptat (ex. cont email compromis al părintelui) → atacator confirmă ca părintele.

**Probabilitate × Impact:** Mică × Mare.

**Mitigări:**
- Token 256-bit aleator → guess-ul brute-force este nefezabil.
- Expiră la 30 zile; o singură utilizare.
- Confirmarea ulterioară prin email separat ("Am primit consimțământul tău; dacă nu ai fost tu, contactează-ne").
- Părintele primește un link de revocare.

**Risc rezidual:** Mic. Acceptabil; mai mic decât echivalentul "trimit copia la act notarial".

### Risc R8 — Replay activat din greșeală pe minor

**Descriere:** un bug în logica de gating activează înregistrarea sesiunii pentru un utilizator 14-15.

**Probabilitate × Impact:** Mică × Mare.

**Mitigări:**
- Gating dublu: la nivelul aplicației (verifică `consent_status` + `age_band`) **plus** la nivelul instanței Umami (filter pe server side care drop-ează evenimentele de replay pentru session-id-uri marcate `under_16`).
- Test automat în CI: "given age_band=14-15, replay scripts must not load".
- Audit periodic al log-urilor Umami: zero înregistrări pentru profilurile sub 16.

**Risc rezidual:** Mic.

### Risc R9 — Adi nu este DPO formal; absența procedurilor scrise

**Descriere:** la talia actuală e tentant să tratăm informal cererile de drepturi (acces, ștergere) → la primul caz formal nu avem proces.

**Probabilitate × Impact:** Medie × Medie.

**Mitigări:**
- Funcțiile "Descarcă datele mele" și "Șterge contul" sunt automate end-to-end → nu depind de proces manual.
- Adresa de email pentru date este monitorizată zilnic [TODO: setup auto-acknowledgment + reminder de 72h].
- Procedura scrisă în [TODO: `docs/DSAR-PROCEDURE.md` — creează în M0].

**Risc rezidual:** Mic, cu condiția implementării end-to-end a fluxurilor automate.

---

## 5. Procesatori și transferuri

### 5.1 Lista de procesatori

| Procesator | Date prelucrate | Locația prelucrării | DPA semnat? |
|---|---|---|---|
| Supabase Inc. | DB + auth + Edge Functions | Frankfurt (EU region) | [TODO: înainte de prod] |
| Vercel Inc. | Hosting frontend, Edge Functions | Frankfurt (EU region) | [TODO: înainte de prod] |
| Resend Inc. | Email tranzacțional | Frankfurt (EU region) | [TODO: înainte de prod] |
| Functional Software Inc. (Sentry) | Erori | EU region | [TODO: înainte de prod] |
| Railway (instanță Umami) | Analitică self-hosted | [TODO: confirmă regiunea Railway] | DPA Railway [TODO] |
| Google LLC (Identity) | OAuth | Global | DPA standard Google for Identity [TODO] |
| Apple Inc. (Sign in) | OAuth | Global | DPA standard Apple [TODO] |

### 5.2 Transferuri în afara SEE

Toți procesatorii principali operează în UE (Frankfurt). Companiile-mamă sunt americane (Supabase, Vercel, Resend, Sentry); transferul este acoperit prin:
- Standard Contractual Clauses (UE 2021/914) — incluse în DPA-urile standard.
- EU-US Data Privacy Framework — aplicabil furnizorilor certificați.

**[TODO: după Schrems II, ANSPDCP poate cere și o evaluare suplimentară a transferurilor; verifică în consult.]**

---

## 6. Drepturile persoanei vizate — implementare

| Drept | Implementare | Tabela / endpoint |
|---|---|---|
| Acces (Art. 15) | "Descarcă datele mele" → JSON | Edge Function `data-export` |
| Rectificare (Art. 16) | Setări → editează profil | UI directă |
| Ștergere (Art. 17) | "Șterge contul" + confirmare email | Edge Function `delete-account` — cascade hard-delete pe profile/saves/runs/parent_consent_tokens; pseudonimizare (set null) pe consent_records și paid_intents; cron nocturn șterge rânduri pseudonime > 3 ani |
| Restricționare (Art. 18) | Email la privacy@cesafiu.ro | Manual (la talia curentă) |
| Portabilitate (Art. 20) | Același export ca Acces | Idem |
| Opoziție (Art. 21) | Email + dezactivare analitică din banner | Banner + manual |
| Retragere consimțământ (Art. 7(3)) | Banner → "Doar esențial" sau Setări → Cookies | UI directă |
| Plângere ANSPDCP | Detalii contact în politică | Extern |

**Termene:** răspuns inițial în 30 zile (Art. 12(3)), prelungibil cu 60 zile pentru cazuri complexe.

---

## 7. Consultarea părților vizate

Recital 84 + EDPB ghid: când practicabil, consultă persoanele vizate sau reprezentanții lor.

- Consultarea minorilor direct pe DPIA = impractică și posibil dezechilibrată (un adolescent nu e în poziția să evalueze proporționalitatea).
- **Surogat:** consultul cu un consilier psiholog / specialist în orientare școlară pentru a obține input asupra:
  - tonalității interpretărilor de scor,
  - fluxului de consimțământ pentru minori,
  - formulării banner-ului pentru audiența 14-19.
- **Surogat:** revizuirea politicii și a banner-ului de către cel puțin un părinte din afara echipei [TODO — Faza 2].

---

## 8. Riscuri reziduale și decizii deschise

După mitigări, riscurile reziduale notabile:

1. **R2 (bypass age gate)** — Mare, neeliminabil fără verificare ID. Decizie deschisă pentru consult juridic.
2. **R1 (re-identificare combinatorie)** — Mediu. Acceptabil cu mitigările listate.
3. **R3 (auto-stigmatizare)** — Mediu. Acceptabil cu disclaimere și revizuire psiholog.
4. **R6 (drift de scop)** — Mic-Mediu. Acceptabil cu disciplină internă; necesită update DPIA la Phase 3.

---

## 9. Sign-off

- **Autor DPIA:** Adi Chiriac (operator, fondator)
- **Data:** 2026-04-29 (v0.1-draft)
- **Status:** **DRAFT** — în consult cu avocat român specializat în date personale.
- **Revizuire programată:** la fiecare schimbare substanțială a fluxurilor de date (categorie nouă, procesator nou, schimbare temei legal); minim anual.

**[TODO: după consult juridic — adaugă semnătura/avizul avocatului. Dacă se decide DPO formal, adaugă semnătură DPO. Fără aceste vize, DPIA rămâne v0.x-draft.]**

---

## Anexă A — Întrebări rezervate consultului juridic

Lista vie a întrebărilor pentru avocat este în [`docs/LEGAL-CONSULT-AGENDA.md`](LEGAL-CONSULT-AGENDA.md). Cele cu impact direct asupra DPIA sunt prefixate `[DPIA]` în acel document.

---

*Document v0.1-draft — 2026-04-29. Document intern; nu se publică. Validitatea DPIA depinde de finalizarea consultului juridic.*
