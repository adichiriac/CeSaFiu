# Drumul tău — Implementation Plan (v2)

*2026-06-12 · Source: shared design bundle (`cesafiu/project/screens/journey.jsx`) + Adi's revisions: no paid tier (all free for now), path-specific reality-check steps with impression notes, rewards mechanism.*

> **Status: IMPLEMENTED 2026-06-12** (M0–M3, uncommitted). Route `/[locale]/drum`, engine in `lib/journey/`, stores `journey-store` + `uni-store`, data in `data/journey-paths.json`. 13 unit tests, typecheck + build green. Implementation detail that differs from §2: section order is S1 Descoperă-te → S2 Alege direcția → S3 Testează realitatea (manual, per path) → S4 Fă planul (unis only for institution paths + share); the derived chain S1→S2→S4 is sequential while S3 is a parallel, unordered track so seasonal steps (open days) never block the plan.

## 1. What the design specifies (prototype)

Duolingo-style gamified journey screen:

- Steps in sections, +25 XP per step; XP and progress derived from real app state.
- **Objective header card** (purple): chosen career, else top match with "sugerat din teste — confirmă-l", else empty-state copy.
- **Sequential lock:** first not-done step is "current" (pulsing, yellow, "ACUM →"); later steps locked (🔒 + 1.6s nudge "Termină pasul anterior întâi").
- **Milestone stamps** per section (dashed → green "DEBLOCAT ✓"), finish line ("🎉 AI UN PLAN!").
- Winding node offsets `[0, 36, 64, 36]`, neo-brutalist styling, tab in bottom nav.

## 2. Step model (revised)

**No paid steps.** Profil Complet / paid PDF removed from the journey; everything free until decided otherwise. The journey gains a 4th, path-specific section.

### S1 — DESCOPERĂ-TE *(derived)* — milestone: "Profilul tău psihometric e gata"
1. Scenarii reale (6 scenarii · 90 sec)
2. Vocațional (Holland · 5 min)
3. Personalitate (Big Five · 4 min)

### S2 — ALEGE DIRECȚIA *(derived)* — milestone: "Ai o direcție clară"
4. Alege cariera #1 (din 80+ cariere)
5. Alege traseul (din 6 drumuri)
6. Salvează 2 alternative

### S3 — TESTEAZĂ REALITATEA *(manual + notes, unordered)* — milestone: "Ai văzut-o pe viu"
Unlocks once the path is chosen (step 5); content comes from `data/journey-paths.json`, keyed by path id. 3–4 steps per path, each **self-marked done** and followed by an **impression-note prompt**. Unordered and run as a **parallel track**: real-world opportunities (open days, conversations) are seasonal and must never block S4. Draft step sets per path:

| Path | Steps (draft) |
|---|---|
| `facultate` | Mergi la o zi a porților deschise · Vorbește cu un student din domeniu · Asistă la un curs / vizitează campusul |
| `profesional` | Vizitează un atelier / o firmă (job shadow) · Vorbește cu un meseriaș din domeniu · Încearcă un mini-proiect practic |
| `autodidact` | Termină un modul dintr-un curs online gratuit · Construiește un mini-proiect · Intră într-o comunitate și pune o întrebare |
| `antreprenor` | Vorbește cu un fondator · Întreabă 5 oameni dacă ar plăti pentru ideea ta · Vinde ceva mic (orice) |
| `freelance` | Fă o piesă de portofoliu · Ia un mini-proiect (chiar și gratuit, pentru cineva cunoscut) · Vorbește cu un freelancer activ |
| `creator` | Publică 3 postări pe o temă · Uită-te la statistici și notează ce a mers · Vorbește cu un creator cu audiență |

Copy angle: aceste experiențe previn surprizele de mai târziu — "vezi pe viu înainte să te angajezi pe drum". Switching path swaps S4 steps; completions are kept per `(pathId, stepId)` so nothing is lost if the student flips back.

**Impression notes:** on completing an S3 step, a small sheet asks "Cum a fost? Ce te-a surprins?" — free text, optional but encouraged (completing works without it; note can be added/edited later from the step). Notes shown on the step card (collapsed). This is the durable value: a self-built reality journal per path.

**Minor safety:** S3 steps that involve contacting people, public posting, or selling carry a visible safety note ("pentru întâlniri sau discuții cu necunoscuți, implică un adult de încredere"). The final share step is "Arată-i unui adult de încredere" (părinte, profesor sau consilier) — not parent-only, so students without a safe parent relationship aren't blocked.

### S4 — FĂ PLANUL *(derived)* — milestone: "Plan concret + împărtășit"
Composition depends on the chosen path:
- institution paths (`facultate`, `profesional`): Salvează 2 facultăți → Verifică admiterea → Arată-i unui adult
- all other paths: Arată-i unui adult only

"Verifică admiterea" completes only when a uni whose detail page was opened is also among the saved ones (viewed ∩ saved ≠ ∅) — viewing an unrelated uni doesn't count.

**Lock model (canonical):** the derived chain S1 → S2 → S4 is sequential with one pulsing "current" step; S3 is parallel/unordered. Section ids `s1..s4` in code, analytics, and milestone badges follow THIS order.

## 3. Rewards mechanism

- Keep **+25 XP per step**.
- **Reward ledger** in journey-store: `{id, type: 'step'|'milestone'|'journey', xp, badgeId?, at}`. Derived steps log on first observed completion; manual steps on self-mark. Logging is idempotent by id.
- **XP semantics (decided): lifetime, append-only.** Displayed XP comes from the ledger, not from current completion — unsaving a career/path/uni does NOT take XP away (the work was done). Single exception: undoing a manual step ("I didn't actually do it") withdraws its reward, for honesty. Because logging is idempotent, nothing can be double-earned.
- **Backfill:** progress made before first journey visit (or while away) is logged silently with ONE aggregate "+N XP" toast instead of a toast storm.
- **Badges per milestone** (4) + finish badge. Stored by id; visuals reusable from share-card style.
- What rewards translate into is deliberately open — the ledger is the future-proof part. Natural candidates already in the repo's orbit: dynamic certificates (see `DYNAMIC-CERTIFICATES-PLAN.md`), share-card flair, future perks. No promises in copy until decided ("XP-ul tău" — nothing about what it buys).
- **ROADMAP note:** this supersedes ROADMAP §2.2's "no XP/streak cosplay" stance — XP is cosmetic, derived from real actions, with no streaks or daily pressure; the reality-check-challenge core of §2.2 is exactly what S3 implements. Deadline-aware elements (§2.1 notifications timed to Bac/admission windows) remain future work; "Verifică admiterea" is the v1 deadline touchpoint.

## 4. Gap analysis — production state

| Journey input | Production today | Action |
|---|---|---|
| Tests done (scenarii/voc/pers) | `cesafiu:test` results | derive ✓ |
| `chosenPath` | `savedPath` in quiz-store | derive ✓ |
| `chosenCareer` (#1) | **missing** — only `savedCareerIds` | add `chosenCareerId` to quiz-store + "Alege ca obiectiv" CTA on career page |
| `savedAltCount` | `savedCareerIds` minus chosen | derive ✓ |
| `savedUniCount` | `cesafiu:saved-universities` read via local state in `profile-client.tsx` | extract into shared store |
| `seenUniDetail`, `seenShareCard` | **missing** | flags in journey-store |
| S4 manual completions + notes | **missing** | journey-store: `manual: {[pathId:stepId]: {at, note?}}` |
| Reward ledger | **missing** | journey-store: `rewards: RewardEvent[]` |
| `topMatch` | `/api/match` results | reuse |
| S4 step content | **missing** | new `data/journey-paths.json` (i18n-ready, same pattern as other data files) |

## 5. Decisions (made; flag if you disagree)

1. **Notes stay local-first (localStorage) in v1.** Local-only storage is still app-controlled processing — it reduces exposure, it doesn't remove transparency duties. Therefore: purpose = personal reflection journal, retention = until the student deletes it or clears browser data, deletion = "Șterge jurnalul și progresul" action on /drum (implemented), and note text NEVER enters analytics or error events (only booleans like `has_text`). Add one transparency line to the privacy policy at next legal pass. Supabase sync stays a separate decision (M4) with its own DPIA addendum. Don't promise cross-device or permanence in copy.
2. **Sequential lock applies to the derived chain S1 → S2 → S4; S3 manual steps are unordered** (real-world opportunities don't come in order — an open day happens when it happens). S3 unlocks as a block once the path is chosen and never blocks S4.
3. **Navigation:** 5th bottom-nav tab at `/[locale]/drum`. Journey becomes *the* "what next" surface (one-path principle).
4. **Theming:** map prototype's hardcoded `#000`/`#15110d` to existing tokens so dark mode works.
5. **Deep tests count for their family:** vocational = `vocational` OR `vocational-deep`; personalitate = `personalitate` OR `ipip-neo-60`. A student who only did a deep variant is never blocked on the short one.
6. **`chosenCareerId` lives in journey-store** (not quiz-store as first drafted) — it's a journey concept. Choosing auto-saves the career; unsaving the objective career clears the objective. `savedAltCount` filters the objective out, so the count is correct either way.

## 6. Phases

### M0 — State foundation (~1 day)
- Extract `savedUniIds` into `stores/uni-store.ts` (same localStorage key, no migration).
- New `stores/journey-store.ts`: `chosenCareerId` (see decision 6), `admissionViewedUniIds`, `seenShareCard`, `manual` map (completions + notes), `rewards` ledger, actions (`completeManualStep`, `undoManualStep`, `saveNote`, `logReward` idempotent, `resetJourney`).
- `data/journey-paths.json` + loader/types; RO content first, EN keys in messages.
- `lib/journey/progress.ts`: pure `deriveJourney(state) → {sections, doneCount, xp, pct, currentId, objective}` incl. S4 merge. Unit tests: lock logic, path-switch persistence, ledger idempotency.

### M1 — Journey screen (~1–1.5 days)
- `app/[locale]/drum/`: objective card, S1–S3 path with lock/nudge/pulse, S4 block (unordered nodes, "done" via confirm + note sheet), milestone stamps, finish line.
- Note sheet component: textarea, save/skip, edit-later from step card.
- i18n RO+EN; token-based styling; a11y (real buttons, aria-labels, contrast, reduced-motion).

### M2 — Integration (~1 day)
- Bottom nav 5th tab "Drum".
- Career page "Alege ca obiectiv #1" toggle; `admissionViewedUniIds` recorded on uni detail view; `seenShareCard` set ONLY on a real share action (the modal auto-opens once, so modal-open must not award progress).
- Reward logging wired to derived completions (first-observation) + milestones; small "+25 XP" toast/animation on earn.
- Umami: `journey_view`, `journey_step_click {step, locked}`, `journey_manual_complete {path, step, has_note}`, `journey_milestone {n}`, `journey_complete`.

### M3 — Polish + QA (~½ day)
- 100% celebration, fresh-user empty state, path-switch UX for S4.
- Manual pass: light+dark, RO+EN, mobile widths; lint/typecheck/tests.

### M4 (later, separate decision) — Account sync
- Move journey-store (incl. notes) to Supabase for logged-in users → requires DPIA addendum + privacy-policy line for impression notes. Not in scope now.

## 7. Risks / honest notes

- **Self-reported S4 steps are gameable** — fine: the reward is currently symbolic, and the note prompt itself nudges honesty. Revisit only if rewards gain real value.
- **Notes are device-bound in v1** — a student who clears storage or switches phones loses their journal. Acceptable now; M4 fixes it. Don't market the journal as permanent.
- **S4 content quality is the feature.** Draft steps above need a pass per path (and per-locale realism — "porți deschise" timing differs by city). Keep 3–4 max per path; specific beats exhaustive.
- **XP stays cosmetic** until rewards translation is decided; ledger makes the future swap cheap.
- Total estimate: **~4 dev-days**. No API/DB changes, no consent-flow changes in v1.
