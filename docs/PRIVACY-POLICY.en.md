# Privacy Policy — Ce Să Fiu?

*Version: v0.1-draft (2026-04-29). Status: **DRAFT pending legal consult.** Do not publish before a Romanian privacy lawyer signs off. `[TODO]` markers must be filled in before publication.*

*Companion documents: [`docs/DPIA.md`](DPIA.md) (impact assessment), [`docs/CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md) (consent banner spec).*

**Note on language:** the [Romanian version](PRIVACY-POLICY.md) is the canonical version. This English text is a translation for international visitors. In case of any divergence, the Romanian version prevails.

---

## 1. Who we are and how to contact us

**Ce Să Fiu?** is an online service that helps you choose your career and your school. The data controller is:

- **Entity:** DataWeb Consultants SRL
- **Romanian fiscal ID (CUI):** [TODO: fill in]
- **Registered office:** [TODO: full address]
- **Email for personal-data questions:** [TODO: e.g. `privacy@cesafiu.ro`]
- **Data Protection Officer (DPO):** [TODO: name, or "no formally appointed DPO — the contact point for data questions is the email above"]

Throughout this document, "we" / "the platform" = DataWeb Consultants SRL acting through the Ce Să Fiu? product.

---

## 2. What data we collect and why

We collect as little as we can while still letting the platform work. By category:

### 2.1 Data when you use the platform without an account (anonymous)

When you open the platform and take tests without registering:

| What we save | Where | Why |
|---|---|---|
| Your answers to the quiz / personality test / vocational test | **Locally on your device** (localStorage) | To show you results and let you save favourites |
| Up to 3 "saved" careers (in anonymous mode) | Locally on your device | Discovery — keep your progress without an account |
| The answers *sent* to our server for score computation | Processed in memory by the `score-quiz` Edge Function (Frankfurt EU), returned immediately | The scoring algorithm runs server-side so we can protect our underlying career/program data |

**We do not identify you personally** in this mode — we don't know who you are. The answers we send to the server for scoring are NOT saved to a database and are NOT associated with you or with any persistent identifier. Your test history stays on your device until you create an account, are at least 16 (or a parent has confirmed), and explicitly choose to sync.

**Legal basis:** legitimate interest (Art. 6(1)(f) GDPR) — we are responding to your request to see a score; nothing is retained. [TODO: confirm with the lawyer whether this basis or "consent (via click-through to start the quiz)" is preferred.]

### 2.2 Data when you create an account

When you create an account (Google, Apple or email magic link):

| What we save | Source | Why |
|---|---|---|
| Email address | from Google / Apple / typed by you | Identification + authentication |
| Display name (optional) | typed by you | Profile personalisation |
| Age band (14-15 / 16-17 / 18+ / "I'm a parent") | typed by you | Determines the legal flow (Art. 8 GDPR) |
| Unique account identifier (UUID) | generated automatically | Key to all your records |
| Saved careers and programs | result of your actions | Lets you compare options |
| Test history (answers + RIASEC, Big Five scores etc.) | test outcome | To show your evolution and improve recommendations |

**Legal basis:** performance of the service contract (Art. 6(1)(b) GDPR).

### 2.3 Data for users under 16 — parental consent

Per Art. 8 GDPR and **Romanian Law 190/2018 (art. 6)**, the digital-consent age in Romania is **16**. If you are under 16:

| What we save | Why |
|---|---|
| A parent's / guardian's email address (encrypted) | To send the consent request |
| Hash of the parent's email address | For audit, without keeping the address in cleartext |
| Consent token (256-bit random, valid 30 days) | So the parent confirms via a unique link |
| Consent records (`consent_records`) — what was consented to, when, with what status (requested, confirmed, revoked) | Mandatory audit — proves we processed your data only with parental approval |

**Legal basis:** legal obligation (Art. 6(1)(c) GDPR) + parental consent (Art. 8(1) GDPR + Art. 6 Romanian Law 190/2018).

Until the parent confirms, we **do not sync your data to the cloud** and **you cannot purchase the paid report**. You can still take tests and save locally.

### 2.4 Data when you express purchase intent

When you tap "I want the paid report" or similar (€19 vocational report):

| What we save | Why |
|---|---|
| Email address | To contact you when the report is ready |
| Context (which test you took, which surface) | Report personalisation |
| Your acknowledgement of the terms | Legal documentation |

**Legal basis:** consent for the pre-orders list (Art. 6(1)(a) GDPR) + pre-contractual measures at your request (Art. 6(1)(b) GDPR).

We do **not** collect payment data at this stage (the report is fulfilled manually for now; payment happens after direct contact).

### 2.5 Analytics and technical data

| What we save | How | Why |
|---|---|---|
| Usage events (start quiz, finish quiz, share click, paid intent) | **Umami** — self-hosted instance on Railway, no tracking cookies, no clear-text IPs | Understand what works and what doesn't |
| Core Web Vitals (load time, interactivity) | **Vercel Analytics** | Performance optimisation |
| Application errors | **Sentry** | Bug detection |
| Hash of IP + user agent (only for consent events) | computed at event time, plain version not stored | Audit — proves a given account gave a given consent |

**Legal basis:**
- Non-intrusive analytics (cookieless Umami + Vercel Web Vitals): **consent** (Art. 6(1)(a) GDPR) — given through the consent banner, opt-in. If you pick "Essentials only" or reject the category, analytics does not run.
- Sentry (error tracking): legitimate interest (Art. 6(1)(f) GDPR) — service security and proper functioning. Default configuration scrubs emails, tokens, test answers and parent data; for users under 16 or with unknown age, the account identifier is not attached to breadcrumbs.
- IP/user-agent hashes in the consent log: legal obligation (Art. 6(1)(c) GDPR) — proof of consent.

### 2.6 Session replay

**Off by default.** Enabled only if:

1. You are 16 or older, AND
2. You explicitly tapped "Accept all" in the consent banner.

For users under 16, session replay is technically blocked regardless of the banner choice.

**Legal basis:** explicit consent (Art. 6(1)(a) GDPR + Art. 5(3) ePrivacy Directive / Romanian Law 506/2004).

---

## 3. What we do **NOT** collect

- We do not collect your CNP (Romanian personal numerical code), phone number, or physical address.
- We do not collect payment data (cards, IBAN). Payments, when they exist, will be processed by a regulated payment provider (e.g. Stripe) which manages its own data.
- We do not collect data about your health. **Important:** results from personality tests (Big Five, IPIP-NEO-60) are **not** medical diagnoses. We treat them as ordinary personal data (Art. 6 GDPR), not as health data within the meaning of Art. 9 GDPR — the instruments are non-clinical and public-domain. [TODO: confirm this categorisation with the lawyer.] They cannot be used to infer psychological conditions.
- We do not collect data on ethnic origin, political opinions, religion, sexual orientation, or trade-union membership. If your answers on a test happen to suggest such things, we *do not* process them separately — they remain part of your raw answers only.

---

## 4. Who we share data with

**In short: nobody, for marketing.**

We work with the following service providers (processors under Art. 28 GDPR), which process data *on our behalf* under a written agreement (DPA — Data Processing Agreement):

| Processor | What it does | Data location |
|---|---|---|
| **Supabase** (Supabase Inc.) | Database + authentication + server functions | Frankfurt, Germany (EU region) |
| **Vercel** (Vercel Inc.) | Frontend hosting + edge functions | Frankfurt, Germany (EU region) |
| **Resend** (Resend Inc.) | Transactional email (magic link, parental consent) | Frankfurt, Germany (EU region) |
| **Sentry** (Functional Software, Inc.) | Application error tracking | EU (Frankfurt region) |
| **Umami** (self-hosted) | Web analytics | Railway EU [TODO: confirm exact region of the instance] |
| **Google Identity** | Google account sign-in (if you choose) | Global — subject to Google's policies (see below) |
| **Apple Sign in** | Apple account sign-in (if you choose) | Global — subject to Apple's policies (see below) |

For Google or Apple sign-in, the data exchanged with those providers is additionally governed by their privacy policies. You control this choice — using Google or Apple is not required; email magic link works independently.

**We do not sell or transfer personal data** to any third party for marketing, commercial profiling, or advertising.

**Transfers outside the EEA (European Economic Area):**
- Supabase, Vercel and Resend operate from the EU/Frankfurt region — user data is stored in the EU.
- For US-based parent companies (Supabase Inc., Vercel Inc., Resend Inc., Sentry), any incidental transfers are covered by the EU Standard Contractual Clauses and the EU-US Data Privacy Framework (where the provider is certified).
- [TODO: confirm in legal consult whether further measures post-Schrems II are necessary.]

---

## 5. Where we store data

- **Primary location:** Frankfurt, Germany (Supabase EU region).
- **Backups:** managed by Supabase, in the same EU region.
- **Encryption:** data is encrypted at rest (Supabase storage layer) and in transit (TLS 1.2+).
- **Access:** only the application code (with server-side service-role keys) and system administrators (access list is auditable).

---

## 6. How long we keep data

| Category | Duration | Rationale |
|---|---|---|
| Account data (`profiles`) | Until you delete your account, or 24 months of inactivity (we then warn you by email and delete if you don't confirm) | Storage limitation (Art. 5(1)(e) GDPR) |
| Saved careers and programs | While your account is active | Direct service of the function you chose |
| Test history (`quiz_runs`, `personality_runs`, `vocational_runs`) | 24 months after last use, then anonymised (link with `user_id` is broken; only aggregate stats remain) | Balance between your usefulness and the minimisation principle |
| Parental consent tokens | 30 days from creation (then expire); used or unused | Security — unbounded tokens are a risk |
| Consent records (`consent_records`) | **3 years from each row's `created_at`** [TODO: confirm with lawyer — RO general civil limitation is 3 years; default to 3y pending consult]. On account deletion, the row is pseudonymised (user_id nulled) and kept until the 3-year mark, after which a nightly cron hard-deletes it. | Evidence requirement for complaints (RO civil limitation period, Art. 2517 Civil Code) |
| Paid intents (`paid_intents`) | 24 months or until you unsubscribe | Pre-orders list; storage-limitation principle |
| Error logs (Sentry) | 30 days (Sentry free plan) | Enough for triage; beyond that, low value |
| Analytics events (Umami) | 24 months | Medium-term trends; beyond that, no longer useful |

**[TODO: validate durations with the lawyer.** Default set to 3 years for `consent_records` — aligned with the general Romanian civil limitation (Art. 2517 Civil Code). Confirm whether specific evidence-of-consent obligations require longer.]

---

## 7. Your rights

Under GDPR (Art. 12-22) and Romanian Law 190/2018 you have the following rights:

- **Right of access** (Art. 15): you can request a copy of your data. The **"Download my data"** function in Settings → Account returns a full JSON export.
- **Right to rectification** (Art. 16): you can edit your profile data anytime in Settings.
- **Right to erasure / "to be forgotten"** (Art. 17): the **"Delete account"** function in Settings → Account permanently deletes your profile, saves (careers and programs), test history (`quiz_runs`/`personality_runs`/`vocational_runs`) and unused parental consent tokens. Two categories are **pseudonymised, not immediately deleted**: (a) consent records (`consent_records`) — the link to your account is broken, but the row (with IP/UA hashes and timestamp) is retained as evidence of consent for up to 3 more years, then automatically hard-deleted. (b) paid-intent records (`paid_intents`) — likewise pseudonymised; we may retain the anonymised form for aggregate reporting if accounting obligations require it. Email confirmation required.
- **Right to restrict processing** (Art. 18): write to our data email and we will block your account without deleting it.
- **Right to data portability** (Art. 20): the JSON export covers this right too; it is a structured, machine-readable format that can be imported into other compatible services.
- **Right to object** (Art. 21): you can object to processing based on legitimate interest. Write to us and we'll review your case.
- **Right to withdraw consent** (Art. 7(3)): wherever you gave explicit consent (banner, session replay, paid intent), you can change your mind via Settings → Cookies or by email.
- **Right to lodge a complaint** with **the Romanian Data Protection Authority (ANSPDCP)**: B-dul G-ral. Gheorghe Magheru 28-30, sector 1, București, [anspdcp@dataprotection.ro](mailto:anspdcp@dataprotection.ro), [www.dataprotection.ro](https://www.dataprotection.ro).

**How to exercise your rights:** write from your account (or from the email address linked to it) to [TODO: privacy@cesafiu.ro]. We respond within 30 days at the latest (Art. 12(3) GDPR), usually much faster.

---

## 8. For users under 16 — the parent's role

If you are between 14 and 15:

1. You can register and use the platform in **limited mode**: take tests and save locally on your device, but we will not sync your data to the cloud.
2. At registration we ask for **a parent's or guardian's email address**.
3. We send an email with a unique link, valid for 30 days, for the parent to confirm.
4. After confirmation, limited mode lifts and the platform works fully for you.
5. The parent receives a **confirmation email** and can **revoke** consent anytime via Settings → Account (of the child) or by email to our data address.

The parent has the right to:
- Request deletion of the child's data (consent revocation → automatic deletion if revocation is final).
- Receive a copy of the child's data on request.
- Be informed of significant changes to this policy.

---

## 9. Cookies and similar technologies

We use as few cookies as we can. Full detail, plus the granular consent banner, is in [`docs/CONSENT-BANNER-SPEC.md`](CONSENT-BANNER-SPEC.md). In summary:

| Category | Used for | Consent required? |
|---|---|---|
| **Essential** | Auth session, locale (chosen language), consent state | No — strictly necessary per Art. 5(3) ePrivacy |
| **Analytics** | Self-hosted Umami (no tracking cookies — uses a per-session local id) | Yes — opt-in from banner |
| **Session replay** | UX bug detection | Yes — explicit opt-in, blocked under 16 |

`localStorage` is also used for: saving test answers before account creation, the chosen locale, and the 3 anonymous saved careers. These are strictly technical; they don't fall in the tracking-cookies category.

---

## 10. Security

- All transmissions are encrypted with HTTPS / TLS.
- Sensitive data (cleartext parent email used to send the consent message) is encrypted via Supabase Vault — nobody with database access reads it directly. [TODO: confirm Vault is enabled at production deploy.]
- Supabase Row-Level Security (RLS) policy ensures one account cannot read another's data — at the database layer, not just the app layer.
- Sentry is used for fast error detection.
- [TODO: add 2FA for accounts — Phase 3, when payment data is involved.]

In the event of a security incident affecting your data, you will be notified within 72 hours (Art. 33-34 GDPR), and ANSPDCP will be notified per law.

---

## 11. Changes to this policy

We may update this policy (new technology, new law, new functionality). The current version always shows:

- The version number and the last-update date (see below).
- A change history annex on the site (`/legal/changelog`).

**Substantive** changes (new data category, new third party, change of legal basis) are notified by email at least 30 days before they take effect. For users under 16, the notification reaches the parent too.

---

## 12. Limits and responsibility

Ce Să Fiu? is an orientation tool, not a licensed counsellor. Results from short orientation tests (quick quiz, short personality test, 12-pair vocational) are **not scientifically validated** and are presented as starting points. IPIP-NEO-60 is a validated instrument (public-domain, Goldberg). Full details on validation and disclaimers are in [`docs/PSYCHOMETRICS.md`](PSYCHOMETRICS.md).

No test result should be treated as a psychological diagnosis, medical recommendation, or career guarantee.

---

## 13. Contact

For any question about this data or your rights:

- Email: [TODO: privacy@cesafiu.ro]
- Postal address: DataWeb Consultants SRL, [TODO: address]

For complaints: ANSPDCP (see §7).

---

*Version v0.1-draft — 2026-04-29. Document under legal consult. Not legally binding in this form.*
