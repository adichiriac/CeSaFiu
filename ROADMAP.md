# Ce Să Fiu? — Product Roadmap

*Living document. Last updated: 2026-07-04.*

## North star

Help Romanian teens (grades 9-12, eventually K-12) find a career path that genuinely fits — across **all** post-high-school directions: university, trade school, bootcamp, freelance, founder, creator. Not just universities.

The product should feel like a high-energy mentor, not a bureaucratic test. Free at the entry; monetization parked (see "Parked" below).

---

## Where we are (2026-07-03)

The product is no longer the static pilot — it's `apps/web` (Next.js, Supabase, i18n-ready), live in production. Shipped and working:

- **Phase 0 resolved:** Variant A (Scenarii) won the pilot → lives at `/ro/test/scenarii`.
- **1.2 Trade school path** — `profesional` is the 6th path; catalogue now 184 careers / 160+ universities incl. Phase C future-looking careers.
- **1.4 Auth** — Supabase (Google + magic link), EU region.
- **1.5 Minor consent** — full GDPR Art. 8 flow: age band → parent email → `acord-parinte` confirmation (`/api/consent/*`).
- **2.1 + 2.2 "Drumul tău"** — shipped as `/drum` (see `docs/JOURNEY-DRUMUL-TAU-PLAN.md`): path-specific reality checks, cosmetic lifetime XP (no streaks/loss mechanics), "Verifică admiterea" deadline touchpoint. Dated-milestone notifications still pending.
- **Archetypes V2** — renames + career-worlds layer (`docs/ARCHETYPES-V2-PLAN.md`).
- **Signals layer** — 8-family controlled vocabulary, 15% matching weight, cosine similarity. **Uncalibrated** — needs 20-50 real-user pilot.
- **Referrals/viral loop** — `/r/[code]`, click/onboarded/test-completed tracking (`docs/VIRAL-SHARING-REFERRALS-PLAN.md`).
- **P5 Landing redesign** — shipped 2026-07-03 (`85d2703`): one-path hero, lime action color, recommended Scenarii CTA, time badges, compact Profil Complet, result preview + mission badge, raw Andra block, nav labels + lime active pill, feedback drawer above nav. Full spec in this file's git history (2026-07-03).
- **Infra/polish** — dark mode, quiz resume, feedback widget + security baseline on `/api/feedback`, Sentry, Umami analytics.

---

## Priorities (next 8-12 weeks, in order)

### P1 — Calibration before features

The matching engine's weights (signals 15%, RIASEC, Big Five, quiz) are theory, not data. A wrong #1 recommendation kills teen trust faster than any missing feature.

- Get 20-50 authenticated users through quiz + at least one deep test, with `chosen` archetype recorded.
- Analyze top-1 / top-3 hit-rate; recalibrate signal weights and archetype thresholds.
- This gates P3-P5 — no point ranking programs with a miscalibrated profile. (P2's V1-V3 — translation, card-sort UI, scoring — are exempt; only its matcher weight waits for pilot data.)

### P2 — Work values test „Valorile tale" (NEW — prioritized 2026-07-04)

Adi's call: the current algorithm detects *abilities/interests* well enough; what's missing is **differentiation between similar jobs** — same domain, different working lives. Work values are exactly that axis. Full plan: `docs/WORK-VALUES-PLAN.md`.

- O*NET **Work Importance Locator** (card sort, 20 statements, forced 4-per-column) — CC BY 4.0, RO adaptation v1 with the usual honesty disclaimers. NOT the retired WIP.
- 6 values (Achievement/Independence/Recognition/Relationships/Support/Conditions) matched against O*NET per-occupation values ratings → `workValues` vector in careers.json, ~10-15% matcher weight (weight calibrated with P1 data).
- Surfaces: Profil tests-carousel + completeness card (primary), `/drum` optional step, `/rezultate` precision hook on ties. **Not on home** — landing stays one-path.
- Don't announce until the matcher effect is visible ("3 cariere au urcat, uite de ce").
- Build order: V1 data+translation → V2 card-sort UI → V3 scoring+result → V4 matching+surfaces (~6-10 sessions; V1-V3 don't wait for P1).

### P3 — Program-level match sort (was 1.7 — now unblocked)

Auth is live, so profiles persist; the original blocker is gone.

- Score each program (programs[] already has riasec[] + pathType) against the user profile; surface institutions by best-program match.
- UI: "Pentru tine" toggle on Browse → Universități; institution card shows *"Best for you: <Program X> · 87%"*; detail view surfaces matching programs first.
- Same posture for Browse → Trasee.

### P4 — Deadline utility layer (NEW — the student-retention bet)

Teens return for **utility**, not engagement mechanics. Give them data they can't easily get elsewhere:

- Last-year admission cutoffs (medie de admitere) per program, where public.
- Bac + admission calendar with countdowns, surfaced in `/drum` and on program pages.
- "Your grades vs. this program" reality check (self-reported medie → honest feasibility framing, with the usual hedges).
- This is also what our deadline-only notification principle finally fires on: notifications tied to Bac/admission dates, nothing else. Makes `/drum`'s "Verifică admiterea" step live instead of manual.
- Data risk: cutoff data is scattered per university. Start with top ~20 institutions by user interest; mark coverage honestly.
- **Shipped (2026-07-09):** per-faculty `admissionDetail` (formula, calendar, fees, seats, tiebreak, verified source) on 149 programs across Iași/București/Cluj/Timișoara + Bucharest privates; surfaced in the Browse uni-detail panel as a compact "Cum intri" accordion (Variant A), right where `/drum`'s "Verifică admiterea" step lands.
- **Deferred (decide based on need):** reuse the `AdmissionSummary` component in the Rezultate list and the Cariera → "Școli" tab. Held back deliberately — Browse is where the journey's admission step points, so the other surfaces are additive polish, not core. Revisit if usage shows students want admission criteria inline on results/career pages.

### P5 — Story-format shareability (NEW)

The referral loop exists but the unit of teen sharing is a 9:16 screenshot on IG/TikTok stories.

- Redesign the shared result card as 9:16, identity-flattering, archetype-forward (Gen Z naming from Archetypes V2 helps here).
- One-tap "save image" / native share sheet from results; referral code baked into the image URL.
- Follows the one-path CTA principle: share is the primary post-result action, modal-first.

### P6 — PWA: installable + offline + deadline push (NEW — 2026-07-04)

Native app considered and **deferred behind data** — an install wall cuts the link-based viral funnel, and the product retains via utility, not store presence. Full staged plan (PWA → Capacitor gate → React Native gate): `docs/MOBILE-PWA-PLAN.md`.

- Manifest + maskable icons already exist; add Serwist service worker (offline shell, update toast), fix stale `theme_color`, `start_url` install tracking.
- Install nudges at result-save and Profil only (one-path: NOT on home); iOS gets the "Adaugă pe ecran" hint; Umami `pwa_installed` + standalone-session flag.
- Web push (VAPID + Supabase subscriptions) ships WITH P4's first deadline data — opt-in framed on a concrete deadline, **deadline notifications only** (existing hard principle).
- Install rate is the metric that gates any native/Capacitor discussion (threshold ~5% MAU or school-pilot demand).

### P7 — Real voices per career (NEW)

Teens trust people, not taxonomies.

- 3-5 quoted sentences from a real Romanian professional ("ce aș fi vrut să știu la 16 ani") on career detail pages.
- Fully manual pipeline: outreach → short form → curated quote + first name + city. No video infra.
- Start with the ~20 careers that appear most in match results; expand by demand.

### P8 — Do-it-with-a-friend mode (NEW — candidate, validate first)

Teens take quizzes together; a social payoff beats a transactional referral code.

- After results: "Compară-ți arhetipul cu un prieten" → shareable pairing link → both see a compatibility/contrast card.
- Cheap v1: reuse the referral plumbing, add a compare view. Ship behind a flag; keep only if it moves quiz starts.

---

## Profile test pipeline (post-P2, in this order)

Agreed 2026-07-04: three more optional instruments after „Valorile tale", all riding the same rails — `test/[slug]` route, Profil carousel + completeness card, /drum optional steps, /rezultate hooks. Same iron rule as P2: a test ships to users only when its effect is visible in matching or /drum. Explicitly rejected: cognitive/ability tests (licensing + minor-sensitivity + exam vibe), MBTI/Enneagram (validity; archetypes already deliver the fun), grit (overlaps Conscientiousness, toxic-messaging risk).

### T1 — Context de muncă (custom forced-choice, NOT psychometric)

- ~15-20 forced A/B trade-offs (birou/teren, program fix/haos creativ, oameni/date/mâini, stabilitate/risc plătit) — the signals-layer families formalized into an explicit, fun instrument. Original items, zero licensing.
- Output maps 1:1 onto existing signals subdimensions → **sharpens the existing 15% signals weight, no new matcher component.** Cheapest test to build; requires signals-vocabulary coverage pass on careers.json.
- The only instrument that differentiates **within the profesional path** (electrician vs. sudor vs. asistent medical: same Realistic RIASEC, radically different contexts).
- Format: swipe/A-B cards, ~3 min, shareable mini-result („80% teren / 20% birou") — natural candidate for the P8 friend-compare mechanic.
- Risk to design around: overlap with P2's Working Conditions value — keep items concrete-situational (*unde/cum* lucrezi), never importance-based (*ce contează*).

### T2 — Încredere în competențe (self-estimated skills, SCI model)

- ~20-24 original self-efficacy items on IPIP-style stems, one confidence scale per RIASEC domain („cât de sigur te simți să repari ceva / să vorbești în public / să convingi pe cineva").
- The product is NOT the score — it's the **interest-vs-confidence gap matrix**: high/high = go; high interest + low confidence = /drum auto-inserts small exposure steps („pași mici", not abandon); low/low = deprioritize quietly.
- **Not a matcher component** — it modulates /drum step selection and result framing only. Never lets low confidence depress a match score (that would punish exactly the kids who need the app).
- Double hedging: self-assessment at 15 is noisy — everything framed „de explorat", no percentiles, no verdicts.

### T3 — Modul SEL / inteligență emoțională scurt

- 15-20 items from IPIP emotional facets (empatie, asertivitate, autoreglare) — public domain, RO v1 + standard disclaimers; batch the psycholinguist review with IPIP-NEO-60 RO.
- Matcher use: **tie-breaker inside Social/Enterprising clusters only** (profesor vs. vânzări vs. HR vs. psiholog), not a global weight.
- Connects to the existing SEL positioning (K-12 direction) and later to the parent companion view (2.4) for parent-friendly reporting.
- Sensitivity check: emotional constructs with minors — confirm consent tier against AUTH-CONSENT-FLOW.md; keep items non-clinical so it stays out of the parent-gated tier.

## Phase 2 remainder (behind auth, after P1-P4)

- **Dated-milestone notifications** for `/drum` — depends on P4's calendar data.
- **2.3 Adjacency hints** — 2-3 "vecine" per saved career, permission to change your mind without leaving the app.
- **2.4 Parent companion view** — separate URL, seeded by consent-flow parent emails. "Întrebări de pus copilului tău săptămâna asta" per archetype. (Was framed as first paying segment — monetization parked, but the retention/trust value stands on its own.)

## Phase 3 — Distribution & B2B (16+ weeks)

Only after retention is proven.

- **School counselor channel** — *promoted from afterthought:* one dirigenție class = 25 students; a printable one-pager + counselor dashboard-lite is cheap distribution. Worth piloting with 2-3 counselors in Iași before any formal B2B.
- **Romanian psych firm collab** (TestCentral / COGNITROM) — credibility upgrade, only if the objection shows up in real feedback.
- **Counselor marketplace** — vetted counselors, 30-min reviews, marketplace fee.
- **University B2B** — admissions funnel for partner universities.
- **K-12 expansion** — earlier-grade quizzes, school district partnerships.

---

## Parked (2026-06-12 decision)

**All monetization is shelved until further notice.** Everything is free. This supersedes:

- §1.6 paid-tier validator (€19-29 report, Tally + Stripe).
- Profil Complet bundle (IPIP-NEO-60 + vocational-deep + PDF, 19 EUR) — positioning doc preserved at `docs/PAID-BUNDLE-POSITIONING.md` for when/if this reopens.
- The "report content" open question.

The consequence: the roadmap's engine is now **retention + distribution**, not revenue. Revisit monetization only on explicit decision; likeliest reopening order remains parent-pays → B2B, not teen-pays.

---

## Explicit non-goals (unchanged)

- **Streak/daily-check-in gamification.** `/drum`'s cosmetic lifetime XP is the ceiling — no streaks, daily goals, or loss mechanics. The kids who need the app most bounce off streaks.
- **Push notifications for engagement.** Real deadlines only (Bac, admissions). Never "you haven't opened the app in 3 days."
- **TikTok / Instagram OAuth.** No mature provider; teens don't want career data tied to social profiles.
- **Counselor-included paid tier from day 1.** Parked with the rest of monetization anyway.
- **University partnerships before retention validation.** No leverage yet.

---

## Principles & trade-offs

- **Discovery free and anonymous.** The hook quiz is a viral asset. Auth only when the user wants to *keep* something.
- **Buyer is often the parent, not the teen.** Dormant while monetization is parked, but still shapes the parent companion view.
- **Public-domain test items are good enough.** The moat is the integrated result (scores + RO universities + RO trade schools + RO salary data + adjacencies + next steps), not the items.
- **Don't bolt commitment onto discovery screens.** "Tell me about myself" mode ≠ "help me execute" mode.
- **Honesty hedges over false certainty.** Results are "starting points, not verdicts." Kids see through false confidence. Applies doubly to P4's feasibility framing.
- **Utility beats engagement mechanics.** (New, from P4.) A teen returns for the admission cutoff, not for a badge.

---

## Open questions

- **Calibration protocol:** how do we recruit the 20-50 pilot users — referral push, school counselor pilot, or paid social? Cheapest credible path?
- **Cutoff data sourcing (P3):** scrape vs. manual entry vs. crowdsource ("was this your cutoff?"). Licensing/accuracy posture?
- **Interim tab-bar copy:** `Vibe-uri`/`Rezultat` still imply more account value than exists pre-auth. Needs an honest empty state.
- **i18n timing:** pilot is RO-only; likeliest second locale Moldova or Hungary. Don't pay the tax until a real second locale exists (plumbing is already in `apps/web`).

---

## Working file references

- `apps/web/` — production app (Next.js): quiz, tests (`/test/[slug]`), results, browse, `cariera/[id]`, `/drum`, `profil`, auth + consent, referrals (`/r/[code]`)
- `data/` — careers.json (184), institutions.json, programs.json, paths.json (6 incl. `profesional`), questionnaires (ipip-neo-60, vocational-deep), journey-paths.json
- `docs/` — JOURNEY-DRUMUL-TAU-PLAN, ARCHETYPES-V2-PLAN, VIRAL-SHARING-REFERRALS-PLAN, SCORING-AND-MATCHING, PSYCHOMETRICS, DATA-ARCHITECTURE, SECURITY-HARDENING-PLAN, PAID-BUNDLE-POSITIONING (parked)
- `/index.html`, `/quiz-a|b|c.html`, `/results.html`, `/cesafiu_prototype_v1/` — legacy pilot artifacts (historical; superseded by `apps/web`)

---

*Roadmap is living. Update on every meaningful decision, prune what's no longer true.*
