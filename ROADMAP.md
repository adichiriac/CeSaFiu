# Ce Să Fiu? — Product Roadmap

*Living document. Last updated: 2026-07-03.*

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
- **Infra/polish** — dark mode, quiz resume, feedback widget + security baseline on `/api/feedback`, Sentry, Umami analytics.

---

## Priorities (next 8-12 weeks, in order)

### P1 — Calibration before features

The matching engine's weights (signals 15%, RIASEC, Big Five, quiz) are theory, not data. A wrong #1 recommendation kills teen trust faster than any missing feature.

- Get 20-50 authenticated users through quiz + at least one deep test, with `chosen` archetype recorded.
- Analyze top-1 / top-3 hit-rate; recalibrate signal weights and archetype thresholds.
- This gates P2-P4 — no point ranking programs with a miscalibrated profile.

### P2 — Program-level match sort (was 1.7 — now unblocked)

Auth is live, so profiles persist; the original blocker is gone.

- Score each program (programs[] already has riasec[] + pathType) against the user profile; surface institutions by best-program match.
- UI: "Pentru tine" toggle on Browse → Universități; institution card shows *"Best for you: <Program X> · 87%"*; detail view surfaces matching programs first.
- Same posture for Browse → Trasee.

### P3 — Deadline utility layer (NEW — the student-retention bet)

Teens return for **utility**, not engagement mechanics. Give them data they can't easily get elsewhere:

- Last-year admission cutoffs (medie de admitere) per program, where public.
- Bac + admission calendar with countdowns, surfaced in `/drum` and on program pages.
- "Your grades vs. this program" reality check (self-reported medie → honest feasibility framing, with the usual hedges).
- This is also what our deadline-only notification principle finally fires on: notifications tied to Bac/admission dates, nothing else. Makes `/drum`'s "Verifică admiterea" step live instead of manual.
- Data risk: cutoff data is scattered per university. Start with top ~20 institutions by user interest; mark coverage honestly.

### P4 — Story-format shareability (NEW)

The referral loop exists but the unit of teen sharing is a 9:16 screenshot on IG/TikTok stories.

- Redesign the shared result card as 9:16, identity-flattering, archetype-forward (Gen Z naming from Archetypes V2 helps here).
- One-tap "save image" / native share sheet from results; referral code baked into the image URL.
- Follows the one-path CTA principle: share is the primary post-result action, modal-first.

### P5 — Landing page: hierarchy & one path (NEW — from 2026-07-03 review)

The landing works, but the hero fires ~6 messages before the first action. Core fix is **hierarchy, not decoration** — the one-path CTA principle applied to `/ro`:

- **Hero simplification:** one big title, one-line subtitle, one dominant CTA ("Începe aici" full-width / highest-contrast element). Badge, tag-line chips, and colored keywords move below the fold or go.
- **Recommended card:** Scenarii gets visual priority (it's the validated Phase 0 winner and funnel entry); Vocațional/Personalitate step back. Not an aesthetic choice — it's what the pilot data says.
- **One action color:** reserve a single color exclusively for CTAs; category colors (mov/galben/lime) stay for identity and categories. Don't dilute the neo-brutalist palette — just make "the color you press" learnable.
- **Bottom nav:** labels under icons + clear active state. Solve together with the open interim-copy question (`Vibe-uri`/`Rezultat`).
- **Andra higher:** move the real example up; keep it raw and authentic — no corporate-testimonial styling (teens smell fabricated marketing).
- **Result preview:** show what you get before starting — reuse P4's 9:16 share card as the preview asset (one deliverable, two uses). Note: NOT a "PDF report" preview — monetization is parked.
- **Feedback button:** fix the content overlap (shrink or hide-on-scroll-down). Do NOT fold into bottom nav; keep it easy to reach — it's the main signal channel during calibration.

Explicitly deprioritized from the same review (cosmetic, no metric moves): scroll micro-animations (generic-template feel + CLS cost; if ever, respect `prefers-reduced-motion`), extra whitespace/separators (density is brand — fix crowding via hierarchy, not air), distinct test iconography, meta badges. Desktop grid pass: 30-min check, audience is phone-first. Contrast on lime/galben was checked (2026-07-03): `ink-fixed` ≈ 14.9:1, `ink-soft` ≈ 6.9:1 — passes WCAG AA; any fatigue issue is saturation *area*, not text contrast.

### P6 — Real voices per career (NEW)

Teens trust people, not taxonomies.

- 3-5 quoted sentences from a real Romanian professional ("ce aș fi vrut să știu la 16 ani") on career detail pages.
- Fully manual pipeline: outreach → short form → curated quote + first name + city. No video infra.
- Start with the ~20 careers that appear most in match results; expand by demand.

### P7 — Do-it-with-a-friend mode (NEW — candidate, validate first)

Teens take quizzes together; a social payoff beats a transactional referral code.

- After results: "Compară-ți arhetipul cu un prieten" → shareable pairing link → both see a compatibility/contrast card.
- Cheap v1: reuse the referral plumbing, add a compare view. Ship behind a flag; keep only if it moves quiz starts.

---

## Phase 2 remainder (behind auth, after P1-P3)

- **Dated-milestone notifications** for `/drum` — depends on P3's calendar data.
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
- **Honesty hedges over false certainty.** Results are "starting points, not verdicts." Kids see through false confidence. Applies doubly to P3's feasibility framing.
- **Utility beats engagement mechanics.** (New, from P3.) A teen returns for the admission cutoff, not for a badge.

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
