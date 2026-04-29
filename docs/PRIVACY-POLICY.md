# Politica de confidențialitate — Ce Să Fiu?

*Versiune: v0.1-draft (2026-04-29). Status: **DRAFT pentru consult juridic.** Nu publica înainte ca avocatul român specializat în date personale să confirme. Câmpurile marcate `[TODO]` trebuie completate înainte de publicare.*

*Document parteneră: [`docs/DPIA.md`](DPIA.md) (analiză de impact), [`docs/CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md) (banner consimțământ).*

---

## 1. Cine suntem și cum ne contactezi

**Ce Să Fiu?** este un serviciu online care te ajută să-ți alegi cariera și școala. Operatorul de date (controller) este:

- **Denumire:** DataWeb Consultants SRL
- **CUI:** [TODO: completează]
- **Sediu:** [TODO: adresă completă]
- **Email pentru întrebări legate de date personale:** [TODO: ex. `privacy@cesafiu.ro`]
- **Responsabil cu protecția datelor (DPO):** [TODO: nume sau "DPO neapeles formal — punctul de contact pentru întrebări de date este adresa de mai sus"]

În tot acest document, "noi" / "platforma" = DataWeb Consultants SRL prin produsul Ce Să Fiu?.

**Limba:** versiunea în română este versiunea oficială. [Versiunea în engleză](PRIVACY-POLICY.en.md) este o traducere informativă — în caz de divergență, prevalează textul în română.

---

## 2. Ce date colectăm și de ce

Colectăm cât mai puține date posibil pentru ca platforma să funcționeze. Mai jos, pe categorii.

### 2.1 Date pe care le folosești fără cont (anonim)

Când deschizi platforma și răspunzi la teste fără să te înregistrezi:

| Ce salvăm | Unde | De ce |
|---|---|---|
| Răspunsurile la quiz / test de personalitate / test vocațional | **Local pe dispozitivul tău** (localStorage) | Ca să-ți arătăm rezultate și să-ți poți salva favoritele |
| Până la 3 cariere "salvate" (în modul anonim) | Local pe dispozitivul tău | Discovery — să-ți păstrăm progresul fără cont |
| Răspunsurile *trimise* la serverul nostru pentru calcularea scorului | Procesate în memorie de Edge Function `score-quiz` (Frankfurt UE), returnate imediat | Algoritmul de scoring rulează server-side ca să protejăm baza noastră de date privind cariere și școli |

**Nu te identificăm personal** în acest mod — nu știm cine ești. Răspunsurile pe care le trimitem la server pentru scoring NU sunt salvate într-o bază de date și NU sunt asociate cu tine sau cu un identificator persistent. Tot istoricul testelor rămâne pe dispozitivul tău până când îți creezi cont, ai cel puțin 16 ani (sau părintele a confirmat) și alegi explicit să sincronizezi.

**Temei juridic:** interes legitim (Art. 6(1)(f) GDPR) — răspunzi la cererea ta de a vedea un scor; nu păstrăm urma. [TODO: confirmă cu avocatul dacă acest temei sau "consimțământ" prin clic pe "Start quiz" este preferat.]

### 2.2 Date când îți creezi cont

Când îți creezi cont (Google, Apple sau magic link prin email):

| Ce salvăm | Sursa | De ce |
|---|---|---|
| Adresa de email | de la Google / Apple / completată de tine | Identificare și autentificare |
| Nume afișat (opțional) | completat de tine | Personalizarea profilului |
| Vârsta (categorie: 14-15 / 16-17 / 18+ / "sunt părinte") | completată de tine | Determinarea fluxului legal (Art. 8 GDPR) |
| Identificator unic de cont (UUID) | generat automat | Cheia tuturor înregistrărilor tale |
| Cariere și programe salvate | rezultatul acțiunilor tale | Te ajută să-ți compari opțiunile |
| Istoricul testelor (răspunsuri + scoruri RIASEC, Big Five etc.) | rezultatul testelor | Pentru a-ți prezenta evoluția și a îmbunătăți recomandările |

**Temei legal:** executarea contractului de utilizare a platformei (Art. 6(1)(b) GDPR).

### 2.3 Date pentru minorii sub 16 ani — consimțământul părintelui

Conform Art. 8 GDPR și **Legii 190/2018 (art. 6)**, în România vârsta minimă pentru consimțământul digital este **16 ani**. Dacă ai sub 16 ani:

| Ce salvăm | De ce |
|---|---|
| Adresa de email a unui părinte / tutore (criptată) | Ca să trimitem cererea de consimțământ |
| Hash al adresei de email a părintelui | Pentru audit, fără a păstra adresa în clar |
| Token de consimțământ (256-bit aleator, valabil 30 zile) | Pentru ca părintele să confirme prin link unic |
| Înregistrări de consimțământ (`consent_records`) — ce ai consimțit, când, cu ce status (cerut, confirmat, retras) | Audit obligatoriu — dovedim că am procesat datele tale doar cu acord parental |

**Temei legal:** îndeplinirea unei obligații legale (Art. 6(1)(c) GDPR) + consimțământul părintelui (Art. 8(1) GDPR + Art. 6 Legea 190/2018).

Până când părintele confirmă, **nu sincronizăm datele tale în cloud** și **nu poți cumpăra raportul plătit**. Poți totuși să iei testele și să salvezi local.

### 2.4 Date dacă-ți exprimi intenția de cumpărare

Când apeși "Vreau raportul plătit" sau similar (€19 raport vocațional):

| Ce salvăm | De ce |
|---|---|
| Adresa de email | Te contactăm când raportul e gata |
| Contextul (ce test ai făcut, ce surse) | Personalizarea raportului |
| Acordul tău cu termenii | Documentare legală |

**Temei legal:** consimțământ pentru lista de pre-comenzi (Art. 6(1)(a) GDPR) + măsuri precontractuale la cererea ta (Art. 6(1)(b) GDPR).

**Nu** colectăm date de plată în această fază (raportul e momentan livrat manual; plata se face după contact direct).

### 2.5 Date analitice și tehnice

| Ce salvăm | Cum | De ce |
|---|---|---|
| Evenimente de utilizare (start quiz, finalizare quiz, click pe share, intent plătit) | **Umami** — instanță self-hosted pe Railway, fără cookies de tracking, fără IP în clar | Înțelegem ce funcționează și ce nu |
| Core Web Vitals (timp de încărcare, interactivitate) | **Vercel Analytics** | Optimizarea performanței |
| Erori de aplicație | **Sentry** | Detectarea bug-urilor |
| Hash al IP + user agent (doar pentru evenimentele de consimțământ) | calculat la momentul evenimentului, nu păstrăm versiunea în clar | Audit — dovedim că un anumit cont a dat un anumit consimțământ |

**Temei juridic:**
- Analitică non-intruzivă (Umami fără cookies de tracking + Vercel Web Vitals): **consimțământ** (Art. 6(1)(a) GDPR) — exprimat prin banner-ul de consimțământ, opt-in. Dacă alegi "Doar esențial" sau respingi categoria, analitica nu pornește.
- Sentry (detectare erori): interes legitim (Art. 6(1)(f) GDPR) — securitatea și buna funcționare a serviciului. Configurarea standard scrubează automat email-uri, token-uri, răspunsuri la teste și date despre părinți; pentru utilizatorii sub 16 ani sau de vârstă neconfirmată, identificatorul de cont nu este atașat la breadcrumb-uri.
- Hash-uri de IP/user-agent în registrul de consimțământ: obligație legală (Art. 6(1)(c) GDPR) — dovada consimțământului.

### 2.6 Înregistrarea sesiunii (session replay)

**Implicit este DEZACTIVATĂ.** Se activează doar dacă:

1. Ai 16 ani sau peste, ȘI
2. Ai bifat explicit "Acceptă tot" în banner-ul de consimțământ.

Pentru utilizatorii sub 16 ani, înregistrarea de sesiune este blocată tehnic, indiferent de bifa din banner.

**Temei legal:** consimțământ explicit (Art. 6(1)(a) GDPR + Art. 5(3) Directiva ePrivacy / Legea 506/2004).

---

## 3. Ce **NU** colectăm

- Nu colectăm CNP, număr de telefon, adresă fizică.
- Nu colectăm date de plată (carduri, IBAN). Plățile, când vor exista, vor fi procesate de un operator de plăți autorizat (ex. Stripe) care își gestionează propriile date.
- Nu colectăm date despre starea ta de sănătate. **Atenție:** rezultatele testelor de personalitate (Big Five, IPIP-NEO-60) **nu** sunt diagnostic medical. Le tratăm ca date personale obișnuite (Art. 6 GDPR), nu ca date privind sănătatea în sensul Art. 9 GDPR — instrumentele sunt non-clinice și public-domain. [TODO: confirmă cu avocatul această încadrare.] Nu pot fi folosite pentru a infera afecțiuni psihologice.
- Nu colectăm date despre originea etnică, opinii politice, religie, orientare sexuală, sindicalizare. Dacă răspunzi la un test într-un mod care le-ar putea sugera, *nu* le procesăm separat — ele rămân doar parte din răspunsurile tale netratate.

---

## 4. Cu cine partajăm datele

**Pe scurt: cu nimeni, pentru marketing.**

Lucrăm cu următorii furnizori de servicii (procesatori în sensul Art. 28 GDPR), care procesează datele *în numele nostru*, cu acord scris (DPA — Data Processing Agreement):

| Procesator | Ce face | Unde se află datele |
|---|---|---|
| **Supabase** (Supabase Inc.) | Bază de date + autentificare + funcții server | Frankfurt, Germania (regiune EU) |
| **Vercel** (Vercel Inc.) | Găzduire frontend + edge functions | Frankfurt, Germania (regiune EU) |
| **Resend** (Resend Inc.) | Trimitere emailuri tranzacționale (magic link, consimțământ părintesc) | Frankfurt, Germania (regiune EU) |
| **Sentry** (Functional Software, Inc.) | Detectare erori în aplicație | UE (regiune Frankfurt) |
| **Umami** (auto-găzduită) | Analitică web | Railway EU [TODO: confirmă regiunea exactă a instanței] |
| **Google Identity** | Autentificare cu cont Google (dacă alegi) | Global — supus politicilor Google (vezi mai jos) |
| **Apple Sign in** | Autentificare cu cont Apple (dacă alegi) | Global — supus politicilor Apple (vezi mai jos) |

Pentru autentificarea cu Google sau Apple, datele schimbate cu acești furnizori sunt guvernate suplimentar de politicile lor de confidențialitate. Tu controlezi această alegere — nu te obligăm să folosești Google sau Apple; magic link prin email funcționează independent de aceștia.

**Nu vindem și nu transferăm date personale** către niciun terț pentru marketing, profilare comercială sau publicitate.

**Transferuri în afara SEE (Spațiul Economic European):**
- Supabase, Vercel și Resend operează din regiunea EU/Frankfurt — datele utilizatorilor sunt stocate în UE.
- Pentru companiile-mamă din SUA (Supabase Inc., Vercel Inc., Resend Inc., Sentry), eventualele transferuri sunt acoperite de Clauzele Contractuale Standard (Standard Contractual Clauses) ale UE și de cadrul EU-US Data Privacy Framework (în măsura în care furnizorul este certificat).
- [TODO: confirmă în consultul juridic dacă mai sunt necesare măsuri suplimentare după Schrems II.]

---

## 5. Unde stocăm datele

- **Locație principală:** Frankfurt, Germania (regiune EU a Supabase).
- **Backup-uri:** gestionate de Supabase, în aceeași regiune EU.
- **Criptare:** datele sunt criptate în repaus (la nivel de stocare Supabase) și în tranzit (TLS 1.2+).
- **Acces:** doar codul aplicației noastre (cu chei service-role server-side) și administratorii de sistem (lista accesului este auditabilă).

---

## 6. Cât timp păstrăm datele

| Categorie | Durată | Motivație |
|---|---|---|
| Date de cont (`profiles`) | Până când îți ștergi contul, sau 24 de luni de inactivitate (apoi te avertizăm prin email și ștergem dacă nu confirmi) | Limita de păstrare conform Art. 5(1)(e) GDPR |
| Cariere și programe salvate | Cât timp ai cont activ | Servesc direct funcționalitatea aleasă de tine |
| Istoricul testelor (`quiz_runs`, `personality_runs`, `vocational_runs`) | 24 de luni după ultima utilizare, apoi anonimizate (legarea cu `user_id` se rupe; rămân doar pentru statistici agregate) | Echilibru între utilitatea ta și principiul minimizării |
| Tokenuri de consimțământ părintesc | 30 zile de la creare (apoi expiră); folosit sau neutilizat | Securitate — token-uri nelimitate sunt un risc |
| Înregistrări de consimțământ (`consent_records`) | **3 ani de la `created_at` al fiecărei înregistrări** [TODO: confirmă cu avocatul — termenul general civil RO este 3 ani; păstrăm 3 ani ca poziție implicită până la consult]. La ștergerea contului tău, rândul este pseudonimizat (user_id nulificat) și păstrat până la limita de 3 ani; după aceea este șters definitiv de un cron nocturn. | Cerință de probă în caz de plângere (termen de prescripție civil RO Art. 2517 Cod Civil) |
| Intenții de plată (`paid_intents`) | 24 de luni sau până te dezabonezi | Lista pre-comenzi; principiu storage limitation |
| Loguri de eroare (Sentry) | 30 zile (plan free Sentry) | Suficient pentru triaj; dincolo de asta, valoare scăzută |
| Evenimente analitice (Umami) | 24 de luni | Tendințe pe termen mediu, dincolo nu mai e util |

**[TODO: validează duratele cu avocatul.** Implicit setat la 3 ani pentru `consent_records` — alinierea cu termenul general de prescripție civilă (Art. 2517 Cod Civil RO). Confirmă dacă obligațiile specifice de probă cer un termen mai lung.]

---

## 7. Drepturile tale

Conform GDPR (Art. 12-22) și Legii 190/2018, ai următoarele drepturi:

- **Dreptul de acces** (Art. 15): poți cere o copie a datelor tale. Funcția **"Descarcă datele mele"** din Setări → Cont returnează un export JSON complet.
- **Dreptul la rectificare** (Art. 16): poți modifica oricând datele de profil din Setări.
- **Dreptul la ștergere / "să fii uitat"** (Art. 17): funcția **"Șterge contul"** din Setări → Cont șterge definitiv profilul, salvările (cariere și programe), istoricul testelor (`quiz_runs`/`personality_runs`/`vocational_runs`) și tokenurile de consimțământ părintesc neutilizate. Două categorii sunt **pseudonimizate, nu șterse imediat**: (a) înregistrările de consimțământ (`consent_records`) — legarea cu contul tău se rupe, dar rândul (cu hash IP/UA și marca temporală) rămâne ca probă a consimțământului pentru încă maxim 3 ani; după acest interval este șters automat. (b) intențiile de plată (`paid_intents`) — la fel, legarea cu contul se rupe, putem păstra forma anonimă pentru raportare agregată dacă obligațiile contabile o cer. Confirmare prin email.
- **Dreptul la restricționarea procesării** (Art. 18): scrie-ne la adresa de email pentru date și-ți blocăm conturile fără să le ștergem.
- **Dreptul la portabilitate** (Art. 20): exportul JSON acoperă și acest drept; este un format structurat, citibil de mașină, care poate fi importat în alt serviciu compatibil.
- **Dreptul la opoziție** (Art. 21): te poți opune procesării bazate pe interes legitim. Scrie-ne și revizuim cazul.
- **Dreptul de a-ți retrage consimțământul** (Art. 7(3)): oriunde ai dat consimțământ explicit (banner, înregistrare sesiune, intent plătit), te poți răzgândi prin Setări → Cookies sau prin email.
- **Dreptul de a depune o plângere** la **Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)**: B-dul G-ral. Gheorghe Magheru 28-30, sector 1, București, [anspdcp@dataprotection.ro](mailto:anspdcp@dataprotection.ro), [www.dataprotection.ro](https://www.dataprotection.ro).

**Cum exerciți drepturile:** scrie la [TODO: privacy@cesafiu.ro] din contul tău (sau de pe adresa de email asociată contului). Răspundem în maxim 30 zile (Art. 12(3) GDPR), de obicei mult mai repede.

---

## 8. Pentru minori sub 16 ani — rolul părintelui

Dacă ai între 14 și 15 ani:

1. Te poți înregistra și folosi platforma în **modul limitat**: poți face teste și salva local pe dispozitiv, dar nu putem sincroniza datele în cloud.
2. La înregistrare îți cerem **adresa de email a unui părinte sau tutore**.
3. Trimitem un email cu un link unic, valabil 30 zile, pentru ca părintele să confirme.
4. După confirmare, modul limitat se ridică și platforma funcționează complet pentru tine.
5. Părintele primește un **email de confirmare** și poate **revoca** acordul oricând prin Setări → Cont (al copilului) sau prin email la adresa noastră de date.

Părintele are dreptul:
- Să solicite ștergerea datelor copilului (revocare consimțământ → ștergere automată dacă revocarea e finală).
- Să primească copia datelor copilului la cerere.
- Să fie informat despre modificări semnificative ale acestei politici.

---

## 9. Cookies și tehnologii similare

Folosim cât mai puține cookies. Detaliul complet, plus banner-ul de configurare granulară, sunt în [`docs/CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md). Pe scurt:

| Categorie | Folosit pentru | Cere consimțământ? |
|---|---|---|
| **Esențiale** | Sesiunea de autentificare, locale (limba aleasă), starea consimțământului | Nu — sunt strict necesare conform Art. 5(3) ePrivacy |
| **Analitice** | Umami self-hosted (fără cookies de tracking — folosește un id local pe sesiune) | Da — opt-in din banner |
| **Înregistrare sesiune (replay)** | Identificarea bugurilor de UX | Da — opt-in explicit, blocat sub 16 ani |

`localStorage` este folosit și pentru: salvarea răspunsurilor la teste înainte de cont, alegerea limbii, și cele 3 cariere salvate anonim. Acestea sunt strict tehnice; nu se încadrează la cookies de tracking.

---

## 10. Securitate

- Toate transmisiile sunt criptate cu HTTPS / TLS.
- Datele sensibile (email-ul părintelui în clar pentru trimiterea consimțământului) sunt criptate cu Supabase Vault — nimeni cu acces la baza de date nu le citește direct. [TODO: confirmă activarea Vault la deploy-ul de producție.]
- Politica de Row-Level Security (RLS) Supabase asigură că un cont nu poate citi datele altui cont — la nivel de bază de date, nu doar de aplicație.
- Folosim Sentry pentru detectarea rapidă a erorilor.
- [TODO: adăugare 2FA pentru cont — Phase 3, când vom avea date de plată.]

În caz de incident de securitate care afectează datele tale, vei fi notificat în maxim 72 de ore (Art. 33-34 GDPR), iar ANSPDCP va fi notificat conform legii.

---

## 11. Modificări ale acestei politici

Putem actualiza această politică (tehnologie nouă, lege nouă, funcționalitate nouă). Versiunea curentă are întotdeauna:

- Numărul versiunii și data ultimei actualizări (vezi mai jos).
- Un istoric de modificări într-o anexă pe site (`/legal/changelog`).

Modificările **substanțiale** (categorie de date nouă, terț nou, schimbarea temeiului legal) îți sunt notificate prin email, cu cel puțin 30 de zile înainte de a deveni efective. Pentru minori sub 16 ani, notificarea ajunge și la părinte.

---

## 12. Limite și responsabilitate

Ce Să Fiu? este un instrument de orientare, nu un consilier autorizat. Rezultatele testelor de orientare scurte (quick quiz, test de personalitate scurt, vocațional cu 12 perechi) **nu sunt validate științific** și sunt prezentate ca puncte de pornire. IPIP-NEO-60 este un instrument validat (public-domain, Goldberg). Detaliile complete despre validare și disclaimere sunt în [`docs/PSYCHOMETRICS.md`](PSYCHOMETRICS.md).

Niciun rezultat al unui test nu trebuie tratat ca diagnostic psihologic, recomandare medicală sau garanție de carieră.

---

## 13. Contact

Pentru orice întrebare legată de aceste date sau de drepturile tale:

- Email: [TODO: privacy@cesafiu.ro]
- Adresa poștală: DataWeb Consultants SRL, [TODO: adresă]

Pentru plângeri: ANSPDCP (vezi §7).

---

*Versiunea v0.1-draft — 2026-04-29. Document în consult juridic. Nu are validitate legală în această formă.*
