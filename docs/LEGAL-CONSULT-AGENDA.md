# Agenda consult juridic — Ce Să Fiu? (M0)

*Versiune: v0.1 (2026-04-29). Audiență: avocat român specializat în protecția datelor. Owner: Adi.*

*Versiunea oficială pentru consultul însuși este aceasta (română). Mirror în engleză: [`LEGAL-CONSULT-AGENDA.en.md`](LEGAL-CONSULT-AGENDA.en.md).*

Scopul acestui document este să intrăm la consult cu un set **închis** de întrebări și o poziție implicită pe fiecare, astfel încât timpul cu avocatul să fie folosit pentru confirmare sau corecție — nu pentru explicarea produsului. Avocatul ar trebui să citească în prealabil [`PRIVACY-POLICY.md`](PRIVACY-POLICY.md) + [`DPIA.md`](DPIA.md) + [`CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md).

Itemii prefixați `[DPIA]` afectează direct registrul de riscuri din DPIA. Itemii prefixați `[PP]` afectează formularea politicii de confidențialitate. Itemii prefixați `[BAN]` afectează banner-ul de consimțământ.

---

## 1. Notificări ANSPDCP și DPO

### 1.1 Notificarea prelucrării (Legea 190/2018, Art. 22)

**Întrebare:** dată fiind talia (target ≤ 50.000 utilizatori activi lunar în Faza 2), categoriile (date de minori, analitică) și temeiurile juridice (preponderent contract + consimțământ), este necesară notificarea către ANSPDCP înainte de lansare?

**Poziția noastră implicită:** Nu, pe baza poziției WP29 / EDPB conform căreia GDPR a eliminat obligațiile generale de notificare — Art. 22 din Legea 190/2018 le-a păstrat doar pentru categorii cu risc ridicat specific. Considerăm că nu ne încadrăm în acele categorii.

**Ce avem nevoie de la avocat:** confirmare sau corecție. Dacă da, care este calendarul și procedura (taxe, formulare)?

### 1.2 [DPIA] Depunerea DPIA la ANSPDCP (Art. 36 GDPR)

**Întrebare:** Art. 36 cere consultarea prealabilă a autorității de supraveghere atunci când o DPIA arată un risc rezidual ridicat pe care nu îl putem mitiga. R2 (bypass-ul consimțământului parental prin age gate) este evaluat ca risc rezidual Mare în DPIA. Declanșează acest fapt obligația din Art. 36?

**Poziția noastră implicită:** Nu — riscul rezidual este de probabilitate ridicată, dar **severitatea impactului** este limitată de colectarea redusă de date asupra unui minor sub 16 declarat fals 16+ (fără plată, cu disclaimere de conținut sensibil). Considerăm că ne aflăm sub pragul Art. 36.

**Ce avem nevoie de la avocat:** răspuns clar da/nu, plus eventuale modificări de formulare în DPIA §4 R2 dacă vreți o exprimare mai puternică.

### 1.3 Desemnarea DPO

**Întrebare:** Prelucrarea noastră atinge pragul Art. 37(1)(b) "monitorizare regulată și sistematică pe scară largă" sau Art. 37(1)(c) "prelucrare pe scară largă a categoriilor speciale"?

**Poziția noastră implicită:** la limită. Argumentăm: (a) nu suntem încă la "scară largă" conform criteriilor de mărime din WP243 (Ghid privind DPO); (b) nu prelucrăm categorii speciale Art. 9, în pofida sensibilității psihologice a scorurilor de personalitate; așadar desemnarea DPO este opțională, iar Adi acționează ca punct de contact.

**Ce avem nevoie de la avocat:** confirmare. Dacă da-DPO, recomandare pentru un furnizor RO de tip "DPO-as-a-service" potrivit pentru un startup mic.

---

## 2. Date despre minori și consimțământul parental

### 2.1 [DPIA][PP] Confirmarea vârstei pentru consimțământul digital în România

**Întrebare:** am presupus că Legea 190/2018 Art. 6 stabilește vârsta consimțământului digital la **16 ani** (preluând plafonul Art. 8(1) GDPR fără să-l coboare). Confirmare?

### 2.2 [DPIA] Age gate pe bază de declarație vs. verificare de vârstă

**Întrebare:** age gate-ul nostru funcționează pe bază de declarație (utilizatorul își declară categoria de vârstă). DPIA evaluează acesta ca riscul rezidual cel mai mare (R2). Cere practica autorității române / ghidurile ANSPDCP o verificare de vârstă mai puternică (de ex. echivalent mojeID, încărcare de act de identitate, gating prin credențial parental înainte de orice flux) pentru un serviciu cu profilul nostru de risc?

**Poziția noastră implicită:** Nu, pe motiv de proporționalitate (colectăm minim de date; suprafața plătită este blocată; replay-ul este blocat). Ne bazăm pe detectare comportamentală în Faza 2.5 + flux de revocare ca controale compensatorii.

**Ce avem nevoie de la avocat:** este aceasta o poziție defensibilă, sau recomandați un gating mai puternic înainte de lansare? Dacă da, care este abordarea minimă viabilă?

### 2.3 [PP] Validitatea juridică a mecanismului de token de consimțământ parental

**Întrebare:** fluxul de consimțământ parental: copilul introduce email-ul părintelui → trimitem un link cu token de 256-bit → părintele apasă → consimțământ confirmat. Satisface acest mecanism cerința de "verificabil" din Art. 8(2) GDPR / Art. 6 Legea 190/2018?

**Poziția noastră implicită:** Da, atâta timp cât (a) hash-uim email-ul părintelui (audit), (b) logăm hash IP + UA la confirmare, (c) tiparul email + click corespunde ghidului EDPB privind "eforturi rezonabile" pentru servicii online. Nu pretindem verificare cu autentificare notarială.

**Ce avem nevoie de la avocat:** confirmare a suficienței. Dacă insuficient, alternativa pe care o acceptăm: mecanism de încărcare €0,01 pe card (mai complex, dar cu probă mai puternică).

### 2.4 [PP] Tratamentul auto-consimțământului 16-17 și al contractului plătit

**Întrebare:** un minor de 16-17 ani poate să-și dea singur consimțământul pentru prelucrarea datelor personale (per Art. 8 GDPR + Legea 190/2018). Dar dreptul civil RO tratează vârsta de 14-18 ca având **capacitate de exercițiu restrânsă** pentru contract. Este contractul plătit de €19 executoriu față de un 16-17 fără autorizare parentală, sau ne trebuie autorizare parentală specific pentru stratul contractual (separat de consimțământul pentru date)?

**Poziția noastră implicită:** cerem autorizare parentală pentru contractul plătit pentru utilizatorii sub 18 ani, chiar dacă consimțământul pentru date este auto-dat. Faza 2 nu acceptă plăți automat (livrare manuală), deci aceasta este o întărire pentru Faza 3.

**Ce avem nevoie de la avocat:** confirmare a tratamentului dual (consimțământ pentru date: self la 16; contract: parental până la 18). Dacă putem simplifica, vom face.

---

## 3. Temeiuri juridice și categorii speciale

### 3.1 [DPIA][PP] Scorurile de personalitate ca date din categoria specială Art. 9

**Întrebare:** IPIP-NEO-60 produce scoruri Big Five, inclusiv Neuroticism. Sunt acestea "date privind sănătatea" în sensul Art. 9 GDPR, sau date personale obișnuite?

**Poziția noastră implicită:** date personale obișnuite (Art. 6), nu Art. 9. Raționament: instrumentul este non-clinic, public-domain; scorurile sunt trăsături dispoziționale, nu diagnostic. Jurisprudența CJUE și opiniile EDPB asupra profilării nu au tratat dimensiunile de personalitate ca Art. 9.

**Ce avem nevoie de la avocat:** confirmare. Dacă spuneți Art. 9, schimbăm temeiul juridic la Art. 9(2)(a) consimțământ explicit + ajustăm politica și DPIA în consecință. Schimbare majoră — răspuns ferm necesar.

### 3.2 [PP][BAN] Temeiul juridic pentru analitică — confirmat consimțământ

**Decizie internă (2026-04-30):** am eliminat poziția duală. Analitica și înregistrarea sesiunii rulează exclusiv pe **consimțământ (Art. 6(1)(a))** — opt-in din banner. Sentry rămâne pe **interes legitim (Art. 6(1)(f))** cu balancing test documentat în DPIA §3.2 (scrubbing automat al email/token/răspunsuri/parent + user_id absent pentru utilizatori sub 16 / vârstă necunoscută).

**Ce avem nevoie de la avocat:** confirmare a alegerii și a împărțirii (consimțământ pentru analitică/replay vs. interes legitim pentru Sentry/securitate). Semnalați dacă este nevoie de un balancing test scris formal pentru Sentry, separat de cel din DPIA.

### 3.3 [DPIA] Profilare în sensul Art. 22 GDPR

**Întrebare:** matcher-ul nostru (similaritate cosinus → top-N recomandări de carieră) constituie profilare. Produce suprafața de recomandare "decizii cu efect juridic sau efect similar semnificativ" în sensul Art. 22?

**Poziția noastră implicită:** Nu — recomandările sunt încadrate ca "punct de pornire, nu verdict" cu disclaimere explicite; utilizatorul face alegerea finală. Art. 22 nu este declanșat.

**Ce avem nevoie de la avocat:** confirmare. Notă: Faza 3 introduce ranking de partener B2B → vom avea nevoie de re-evaluare la momentul respectiv.

---

## 4. [PP] Termene de păstrare

### 4.1 Înregistrări de consimțământ — 3 ani (cu pseudonimizare la ștergerea contului)

**Poziție actualizată (2026-04-30):** politica de confidențialitate prevede acum **3 ani** retenție pentru `consent_records` (aliniat cu Legea 287/2009 Cod Civil Art. 2517). La ștergerea contului utilizatorului, rândul este pseudonimizat (user_id nulificat, hash IP/UA + timestamp păstrate); rândurile pseudonimizate sunt șterse hard de un cron nocturn la 3 ani de la `created_at`. Schema modificată la `on delete set null` pentru `consent_records.user_id`.

**Ce avem nevoie de la avocat:** confirmare că 3 ani este fereastra corectă pentru obligația de probă a consimțământului, sau specificare a celei corecte. De asemenea, confirmare că modelul pseudonimizare-apoi-ștergere este corect versus ștergere-imediată.

### 4.2 Istoricul testelor — 24 luni

**Întrebare:** păstrăm `quiz_runs` / `personality_runs` / `vocational_runs` legate de `user_id` timp de 24 luni după ultima utilizare, după care anonimizăm. Este proporțional?

**Poziția noastră implicită:** Da. Outputul testelor pierde rapid din utilitatea pentru utilizator; 24 luni acoperă fereastra tipică clasele 9-12 pentru re-vizite.

**Ce avem nevoie de la avocat:** confirmare. Dacă mai scurt (de ex. 18 luni), ajustăm.

### 4.3 Intent-uri plătite — 24 luni sau dezabonare

**Întrebare:** intent-urile plătite sunt o listă adiacentă marketing-ului (waitlist pentru raportul de €19). Standardul RO pentru retenția de email-marketing este "până la dezabonare" cu re-confirmări periodice. Este 24 luni plafonul corect?

**Poziția noastră implicită:** Da, cu prompt de re-confirmare la 12 luni ("Mai vrei să primești update-uri?").

**Ce avem nevoie de la avocat:** confirmare.

---

## 5. [PP] Persoane împuternicite și transferuri

### 5.1 Adecvarea șabloanelor DPA

**Întrebare:** procesatorii noștri (persoanele împuternicite) sunt Supabase Inc., Vercel Inc., Resend Inc., Sentry, Railway. Fiecare livrează un DPA standard. Sunt aceste DPA-uri standard adecvate sub legea română, sau ne trebuie clauze adiționale (de ex. rideri SCC pentru transferurile spre SUA)?

**Poziția noastră implicită:** adecvate, dat fiind că persoanele împuternicite operează în Frankfurt (UE) și includ SCC. Adecvarea Schrems II prin EU-US Data Privacy Framework, atunci când furnizorul este certificat.

**Ce avem nevoie de la avocat:** confirmare. Dacă semnalați o clauză specifică de adăugat, listați-o — vom solicita rideri.

### 5.2 Evaluarea de impact a transferului (TIA)

**Întrebare:** pentru fiecare procesator cu sediul central în SUA, ne trebuie o TIA documentată per Schrems II / EDPB Recomandările 01/2020?

**Poziția noastră implicită:** Da, cel puțin pentru Supabase + Vercel + Resend (fluxul de date este cel mai direct). Sentry mai puțin (breadcrumbs de-identificate). Putem produce o singură TIA care acoperă cele trei, folosind aceeași analiză standard.

**Ce avem nevoie de la avocat:** confirmare a sferei; recomandare de șablon.

---

## 6. [PP] Revizia formulării politicii de confidențialitate

### 6.1 Lizibilitate generală + acuratețe

**Întrebare:** vă rugăm să citiți [`PRIVACY-POLICY.md`](PRIVACY-POLICY.md) integral. Semnalați:
- orice afirmație factuală excesivă sau insuficientă;
- formulări unde practica autorității române preferă o exprimare specifică;
- categorii lipsă din cerințele de informare Art. 13/14 GDPR.

### 6.2 Paritatea traducerii EN

**Întrebare:** are versiunea EN aceeași greutate juridică ca RO, sau ne trebuie o mențiune explicită "versiunea RO prevalează"? (am adăugat una — confirmați suficiența?)

### 6.3 Limbaj orientat către copii

**Întrebare:** română simplă + audiență 14-19 ani. Am minimizat jargonul juridic. Compromite acest fapt robustețea juridică, sau este acceptabil/preferat (per Art. 12(1) GDPR "concis, transparent, inteligibil" + Recital 58 specific minorilor)?

---

## 7. Protecția consumatorilor (raport plătit)

### 7.1 [PP] Practici comerciale incorecte (Legea 363/2007)

**Întrebare:** raportul plătit de €19 își bazează analiza pe un mix de instrumente validate (IPIP-NEO-60) și nevalidate (vocațional cu 12 perechi, quick quiz cu 6 întrebări). Sunt livrate disclaimere. Este abordarea blindată juridic în fața unei sesizări de practică incorectă, sau cea mai sigură cale este "scoatem testele nevalidate complet din suprafața plătită"?

**Poziția noastră implicită:** disclaimerele + delimitarea clară ("punct de pornire nu diagnostic") sunt suficiente. Faza 2 ancorează outputul plătit pe IPIP-NEO + O*NET (ambele validate / credibile), iar testele nevalidate furnizează doar context.

**Ce avem nevoie de la avocat:** confirmare. Dacă există o convenție specifică de formulare din jurisprudența RO de protecție a consumatorilor, vă rugăm să o transmiteți.

### 7.2 Dreptul de retragere și politica de rambursare

**Întrebare:** acordă legea română un termen de retragere de 14 zile pentru raportul digital? Cadrul-umbrelă de protecție a consumatorilor este Legea 296/2004; transpunerea operativă a Directivei 2011/83/UE privind drepturile consumatorilor (care conține mecanica retragerii pentru conținut digital) este **OUG 34/2014**. Confirmați care este actul controlant pentru cazul nostru și ce formulare ne trebuie pe fluxul de cumpărare.

**Poziția noastră implicită:** Da pentru conținut digital, cu excepția cazului în care utilizatorul renunță explicit la dreptul de retragere după ce începe consumul (per OUG 34/2014 Art. 16(m)). Construim checkbox-ul de renunțare în fluxul de cumpărare.

**Ce avem nevoie de la avocat:** confirmarea actului controlant + adecvarea mecanismului de renunțare + formularea recomandată pentru renunțare.

---

## 8. [BAN] ePrivacy / Legea 506/2004

### 8.1 Conformitatea tiparului banner-ului

**Întrebare:** Legea 506/2004 transpune Directiva ePrivacy. Cere interpretarea ANSPDCP a Art. 5(3) un tipar de UI pentru banner dincolo de cel specificat în [`CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md)? Concret: prominența egală a "Refuză tot" vs. "Acceptă tot"?

**Poziția noastră implicită:** tiparul nostru (Acceptă tot / Doar esențial / Personalizează) oferă prominență egală pentru acceptare și respingere. Considerăm că aceasta corespunde EDPB Ghidurile 03/2022 privind dark patterns + pozițiilor publicate ale ANSPDCP.

**Ce avem nevoie de la avocat:** confirmare. Dacă doriți o ordine de butoane sau un tratament vizual specific, comunicați.

### 8.2 Argumentul "strict necesar" pentru localStorage

**Întrebare:** ne bazăm pe localStorage pentru: salvări anonime, locale, starea consimțământului. ePrivacy tratează localStorage similar cookies-urilor pentru consimțământ. Argumentăm că utilizările de mai sus sunt "strict necesare" (excepția Art. 5(3)). Confirmare?

---

## 9. [DPIA][PP] Tipare de conversie orientate spre minori (dark-pattern review)

GDPR (Recital 38) + EDPB Ghidurile 03/2022 privind dark patterns + Legea 363/2007 (practici comerciale incorecte) impun standarde mai stricte pentru audiențe vulnerabile. Pentru utilizatorii sub 16 ani și 16-17 ani, trei suprafețe specifice ale produsului trebuie verificate dincolo de mecanica GDPR generală:

### 9.1 Promptul de creare cont după a 3-a salvare (PHASE-2-PLAN §6)

**Situație:** după a 3-a "Salvează în vibe-uri", platforma promptează creare de cont. Prompt-ul promite "ca să-ți păstrezi alegerile pe orice dispozitiv".

**Întrebare pentru avocat:** este acest prompt aliniat cu standardele de fairness pentru minori, sau este nevoie de:
- O formulare alternativă pentru utilizatorii pe care îi suspectăm sub 16 ani (semnale comportamentale)?
- Un opt-out clar și permanent ("Nu, vreau să continui anonim")?
- O explicație pre-prompt despre ce se întâmplă cu datele odată ce creezi cont?

**Poziția noastră implicită:** prompt-ul este transparent, nu prea presant, oferă cale de ieșire ("Mai târziu" / continuă fără cont). Considerăm că respectă fairness-ul pentru minori.

### 9.2 Card-uri de share virale ("Eu sunt RIASEC: ASR. Tu?")

**Situație:** rezultatele testelor pot fi partajate prin card OG generat dinamic, optimizat pentru Instagram Story / TikTok / WhatsApp. Tagline-ul include codul RIASEC al utilizatorului.

**Întrebare pentru avocat:**
- Datele afișate pe card-ul partajat (cod RIASEC, etichetă de carieră, eventual nume afișat) sunt date personale ale persoanei care partajează — partajarea este consimțământ implicit, dar pentru minori este suficient?
- Banner-ul de share trebuie să avertizeze "datele tale vor deveni publice"?
- Pentru utilizatorii sub 16 ani, cardul de share ar trebui să fie blocat / dezactivat / cu confirmare suplimentară?

**Poziția noastră implicită:** acceptabil pentru 16+, blocat pentru 14-15 (sub age gate). Pentru toți: card-ul nu include informații de identificare directă (nume real implicit gol; doar codul rezultatului testului).

### 9.3 Promptul "Vreau raportul plătit" pentru minori

**Situație:** raportul plătit (€19) este prezentat în mai multe puncte — după rezultatul testului, pe ecranul de detaliu carieră, în profil. Pentru minori (chiar 16-17), prompt-ul comercial este sensibil.

**Întrebare pentru avocat:**
- Este suficient ca prompt-ul să fie identic pentru toate vârstele, sau este nevoie de o variantă pentru minori care:
  - Reduce frecvența / proeminența ofertei
  - Adaugă un disclaimer "discută cu un părinte înainte"
  - Cerere autorizare parentală suplimentară pentru contractul de plată (vezi §2.4)?
- Frecvența cu care apare prompt-ul (la final test, în profil, pe deep-results) — se ridică la "presiune comercială inadecvată asupra minorilor" sub Legea 363/2007?

**Poziția noastră implicită:** Faza 2 livrează manual; raportul nu se cumpără auto. Prompt-ul rămâne identic dar disclaimer "discută cu un părinte înainte" pentru sub 18. Faza 3 (când plata devine automată) cere autorizare parentală pentru contract sub 18.

**Ce avem nevoie de la avocat pe toate cele trei (9.1-9.3):** revizuire concretă a copy-ului propus pentru aceste fluxuri (le aducem la consult ca screenshot-uri + text); semnalați orice formulare care depășește pragul fairness pentru minori.

---

## 10. Documente de revizuit și avizat formal

Starea finală a consultului: avocatul a revizuit și a avizat:

- [ ] [`docs/PRIVACY-POLICY.md`](PRIVACY-POLICY.md) — RO canonical
- [ ] [`docs/PRIVACY-POLICY.en.md`](PRIVACY-POLICY.en.md) — paritate EN
- [ ] [`docs/DPIA.md`](DPIA.md) — inclusiv acceptarea riscului rezidual
- [ ] [`docs/CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md) — copy banner + state machine
- [ ] Șablonul email-ului de consimțământ parental *(de redactat în M5; revenim la revizuire în acel moment)*

---

## 11. În afara sferei consultului curent

Pentru Faza 3, nu acum:

- Ranking partener B2B (re-DPIA la kick-off-ul Fazei 3).
- Expansiune transfrontalieră (Moldova, Ungaria).
- Procesare plăți (Stripe, etc.).
- Parteneriate de export/import de date cu universități.

---

*Agendă v0.1 — 2026-04-29. Actualizați după consult cu note pe fiecare item; re-versionare la v1.0 după ce avocatul avizează.*
