# Ce Să Fiu? — Product Roadmap

*Living document. Last updated: 2026-04-27.*

## North star

Help Romanian teens (grades 9-12, eventually K-12) find a career path that genuinely fits — across **all** post-high-school directions: university, trade school, bootcamp, freelance, founder, creator. Not just universities.

The product should feel like a high-energy mentor, not a bureaucratic test. Free at the entry, paid at the depth.

---

## Phasing

### Phase 0 — Pilot decision (NOW)

Goal: pick which of the three quiz variants (A Scenarii / B Triplu-lens / C Clasic MVP) becomes the V2 hook quiz.

- **Success metric:** top-1 hit-rate (algorithm's #1 pick = user's `chosen` archetype) and top-3 hit-rate. Not completion rate alone — a quiz that picks correctly *is* the right quiz.
- **Sample needed:** ~50 completed runs per variant with the `chosen` field filled in.
- **Open bias to fix:** A is currently leading partly because it's listed first on `index.html`. Order-effect contamination.
- **Action:** randomize card order per visitor in `index.html`; log shown order to Umami; analyze hit-rate per position, not per variant.
- **Decision rule:** if hit-rate-by-position is stable across variants → it's the variant; if it tracks position → it's order. Re-run if needed.

### Phase 1 — Discovery layer (next 4-8 weeks)

The free, viral, "find your direction" experience. Most of this is already in the V2 prototype (`cesafiu_prototype_v1`). Items below are the deltas.

**1.1 — Pilot data hygiene** *(Phase 0 closing)*
- Order randomization patch on live `index.html`.
- Export current pilot waitlist (Formspree) — it's the Phase 2 closed-beta cohort.

**1.2 — Content gap: trade school horizon**
- Add 6th path object to `data.js` — `profesional` (școala profesională / dual VET / postliceal).
- Duration 1-3 ani, cost ~0, examples: instalator, electrician, sudor, mecanic auto, asistent medical.
- Add 2-3 careers in that path (e.g., Tehnician HVAC, Electrician autorizat, Asistent medical generalist).
- Reflect in RIASEC mapping: this fills the Realistic-dominant gap that previously funneled to engineering only.

**1.3 — Waitlist parity in V2 prototype**
- Port the existing pilot signup pattern (Formspree + name + email + GDPR consent + Umami `signup_submitted`) to the V2 prototype's `results.jsx` and `deep-results.jsx`.
- Same form action — pilot and V2 lists merge cleanly.

**1.4 — Account creation gate**
- "Salvează în vibe-uri" is the trigger. Quiz/tests stay anonymous until then.
- Auth providers: **Google + Apple + email magic link**. (Skip Facebook — declining among RO teens, parent-coded.)
- Stack: **Supabase** (EU region/Frankfurt for GDPR, free up to 50k MAU, OAuth + magic link + Postgres + RLS built-in).
- Until activation, saves stay in `localStorage` so nothing is lost.

**1.5 — Minor consent flow (GDPR Art. 8)**
- Romanian digital consent age = 16. Audience starts at 14yo.
- After OAuth: ask age → if under 16, ask for parent email → send confirmation link → activate on click.
- Treat the parent email as a feature, not a tax: it seeds the parent companion list.

**1.6 — Paid-tier validator**
- At the end of `deep-results.jsx`, add a card: *"Vrei un raport detaliat bazat pe testele tale? €19-29 · livrare PDF în 48h."*
- Tally form + Stripe Payment Link. No automation initially — fulfill manually for the first ~20 buyers.
- Goal: validate willingness-to-pay before building the report engine.
- Test instruments for the report: **public-domain first** (IPIP-NEO for Big Five, O\*NET Interest Profiler for RIASEC). Zero licensing cost. License COGNITROM/SDS only if conversion data justifies it.

### Phase 2 — Commitment layer (8-16 weeks out)

Triggered only when Phase 1 retention numbers justify it. Lives behind auth.

**2.1 — "Drumul tău" module** (replaces the current `Vibe-uri` placeholder)
- For each saved career: 3 dated milestones, 1 reality-check challenge, 2 adjacent path hints.
- Notifications timed to real deadlines (Bac, admission windows, days-of-open-doors) — not streaks.

**2.2 — Reality-check challenges**
- "Vorbește cu cineva care face asta — iată scriptul. Încarcă o poză cu notele tale. Scrie 3 lucruri pe care nu le-ai știut."
- Gamification's useful skeleton without XP/streak cosplay.

**2.3 — Adjacency hints**
- For every saved career: 2-3 "vecine" so kids have permission to change their mind without leaving the app.

**2.4 — Parent companion view**
- Separate URL, leverages the parent emails captured via 1.5.
- "Întrebări de pus copilului tău săptămâna asta" based on archetype.
- Likely first paying segment (parents pay, kids consume — the RO consumer pattern).

### Phase 3 — Distribution & B2B (16+ weeks)

Only after Phase 2 has retention.

- **Romanian psych firm collab** (TestCentral / COGNITROM) — for credibility upgrade on paid tier, if needed.
- **Counselor marketplace** — vetted Romanian career counselors, 30-min reviews, marketplace fee.
- **University B2B** — admissions funnel for partner universities; their programs surface higher in matching results.
- **K-12 expansion** — earlier-grade quizzes, school district partnerships.

---

## Explicit non-goals (not in pilot, possibly never)

These come up regularly. Decision: **defer**, with reasoning.

- **Streak/XP/daily-check-in gamification.** The kids who'd engage are the ones who don't need the app. The kids who need it most bounce off streaks. Revisit only if Phase 2 data demands it.
- **Push notifications for engagement.** Tied to real deadlines only (Bac, admissions). No "you haven't opened the app in 3 days."
- **TikTok / Instagram OAuth.** No mature provider; teens don't want career data tied to social profiles.
- **Counselor-included paid tier from day 1.** Software margins > service margins. Counselor is a Phase 3 upsell, not the core product.
- **University partnerships before pilot validation.** Distribution conversations are 3-6 months and we don't have the leverage yet.

---

## Principles & trade-offs

- **Discovery free, depth paid.** The hook quiz is a viral asset and must stay free + anonymous. Paid value sits behind tests + reports + counselor.
- **Buyer is often the parent, not the teen.** Romanian families pay €30-50 for "ceva concret" (a PDF report), not for "30 min discuție." Design upsells accordingly.
- **Public-domain test items are good enough for pilot.** The moat is the integrated report (your scores + RO universities + RO trade schools + RO salary data + adjacencies + next steps), not the test items themselves. License real instruments only if the credibility objection comes up in real customer feedback.
- **Don't bolt commitment onto discovery screens.** Different screens, different mental modes. The user is in a "tell me about myself" mode during discovery and a "help me execute" mode during commitment.
- **Honesty hedges over false certainty.** A 6-question quiz cannot justify a career recommendation. Always frame results as "starting points, not verdicts." Kids see through false confidence.

---

## Open questions

- What's the **report content** for the €19-29 paid tier? Length, tone, visuals, how much is templated vs. personalized? Decide before launching the validator.
- Tab bar in V2 prototype (`Vibe-uri`, `Rezultat`) currently implies an account model that doesn't exist yet. Phase 1.4 makes it real, but copy/UX needs an interim state.
- When does **i18n** kick in? Pilot is RO-only; first export market most likely Moldova or Hungary. Don't pay the i18n tax until there's a real second locale.
- Is there a partner Romanian psych firm worth talking to **before** the paid validator launches, or is it cleaner to validate WTP solo first? Default plan: solo first.

---

## Working file references

- `/index.html` — live pilot (3-variant quiz hub)
- `/quiz-a.html`, `/quiz-b.html`, `/quiz-c.html` — pilot variants
- `/results.html` — pilot research dashboard + waitlist (Formspree `myklbprg`, Umami `signup_submitted`)
- `/cesafiu_prototype_v1/project/` — V2 prototype bundle (welcome, quiz, personality, vocational, results, deep-results, browse, profile)
- `/cesafiu_prototype_v1/project/data.js` — careers, paths, universities, RIASEC, Big Five
- `/cesafiu_prototype_v1/project/uploads/DESIGN.md` — design system tokens

---

*Roadmap is living. Update on every meaningful decision, prune what's no longer true.*
