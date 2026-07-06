# Work values test — O*NET Work Importance Locator (RO adaptation)

*Created 2026-07-04. Status: **V1–V4 shipped** — V1–V3 + UI surfaces 2026-07-04 (`data/work-values.json`, `/test/valori` sequential card sort, WIL scoring + result screen, profil/drum/rezultate surfaces); V4 2026-07-06: all 184 careers backfilled with estimated vectors (`scripts/backfill-work-values.mjs`, `workValuesSource: 'estimated'`), matcher component at **15% provisional weight** (`VALUES_WEIGHT`, ipsative-centered cosine, other weights scale ×0.85), „match-ul s-a recalculat" reveal on the values result screen. Tests: `apps/web/src/lib/values/types.test.ts`, `apps/web/src/lib/matcher.values.test.ts`. **Open:** recalibrate the 15% with P1 pilot data; replace estimated vectors with real O*NET ratings once a SOC crosswalk exists. Companion to `docs/PSYCHOMETRICS.md` (add a §5 there).*

## Why this test

RIASEC tells you the **domain**; Big Five tells you the **temperament**; neither differentiates between two jobs in the same domain with different working lives (corporate lawyer vs. NGO lawyer, hospital nurse vs. private-clinic nurse, employed dev vs. freelance dev). Work values do exactly that. This is the single highest-leverage addition to the profile, and it's free.

It also feeds matching for the **profesional path**, where interest profiles cluster (Realistic-dominant) but values diverge sharply (security vs. independence vs. compensation).

## The instrument

- **Name:** O*NET Work Importance Locator (WIL), v3.0 — U.S. Department of Labor / ETA.
- **Important:** the computerized *Work Importance Profiler (WIP)* is **retired and no longer distributed**. WIL is the maintained form. Do not brand ours "WIP".
- **Format:** card sort. 20 need statements ("Îmi folosesc abilitățile la maximum", "Am siguranța locului de muncă"…) sorted into 5 importance columns with a **forced distribution of exactly 4 cards per column** (5 = most important … 1 = least). The forced choice is the psychometric point — everyone "wants everything"; the sort forces trade-offs.
- **Output:** scores on 6 work values (O*NET naming / MIQ theory naming):
  1. **Achievement** (Realizare) — results, using abilities fully
  2. **Independence** (Independență) — autonomy, creativity, own decisions
  3. **Recognition** (Recunoaștere) — advancement, prestige, leadership
  4. **Relationships** (Relații) — colleagues, service to others, non-conflicting moral values
  5. **Support** (Suport) — company backing, competent supervision
  6. **Working Conditions** (Condiții) — security, pay, activity, variety
- **Theory base:** Theory of Work Adjustment (Dawis & Lofquist); derived from the Minnesota Importance Questionnaire.
- **Scoring:** per the WIL User's Guide — each value = sum of the column points of its need statements, normalized (values own unequal numbers of needs). Implement exactly from the official guide (`onetcenter.org/dl_files/WIL_zips/WIL-UG-deskp.pdf`); note the need→value mapping table from the guide in `data/work-values.json` at implementation time.
- **Occupation-side data:** the O*NET database publishes work-values ratings **per occupation** (the same 6 scales). This is what makes the test matchable rather than decorative.

## Licensing

- WIL instrument: **CC BY 4.0** (attribution required — unlike IPIP). Attribution line: *"Bazat pe O*NET® Work Importance Locator™, U.S. Department of Labor / ETA, licență CC BY 4.0. Adaptare românească Ce Să Fiu — nevalidată pe populația RO."*
- O*NET database (occupation work-values ratings): CC BY 4.0, same attribution posture as our existing O*NET Interest Profiler usage.
- Translation/adaptation explicitly permitted under CC BY. Same honesty posture as IPIP-NEO-60: the *instrument* is validated in English; **our RO translation is v1, unvalidated** — disclaimer required, psycholinguist review before any future paid use.

## Product shape

- **Name in app:** „Valorile tale" (working title; NOT "test de valori" — sounds like ethics class).
- **Duration:** ~5 min. 20 cards, drag-into-columns (mobile: tap-to-assign with a visible column counter; drag is a progressive enhancement).
- **Consent tier:** same as short tests (anonymous-friendly, results in localStorage until account save), NOT parent-gated — it measures job preferences, not personality/clinical constructs. Confirm against AUTH-CONSENT-FLOW.md at build time.
- **Result screen:** top-2 values large (O*NET convention labels occupations by top values), all 6 as bars, one honest paragraph per top value, then **immediate visible effect**: "match-ul tău s-a recalculat — 3 cariere au urcat, uite de ce" with the careers whose rank moved. A test whose effect is invisible in matching is a test users won't finish.

## Matching integration

1. Add `workValues: {achievement, independence, recognition, relationships, support, conditions}` (0-100) to career records in `data/careers.json`. Source: O*NET occupation ratings via the existing corCode/escoUri crosswalk where present; manual estimation (flagged `workValuesSource: 'estimated'`) for RO-specific careers without a clean O*NET mapping.
2. New component in the cosine matcher alongside RIASEC / Big Five / signals. Proposed initial weight: **10-15%**, taken proportionally from the existing components; calibrate with the P1 pilot data like everything else. Missing test = weight redistributed (existing pattern).
3. The values vector also feeds `/drum`: top value modulates which reality-check steps surface first (e.g., high Working Conditions → the "verifică salariile reale" step earlier).

## Where it lives in the UI (decided 2026-07-04 — do NOT add to home)

The home screen stays one-path (ROADMAP §P5). The test surfaces in three places:

1. **Profil — tests carousel (primary home of ALL tests).** A horizontal carousel listing every instrument: Scenarii, Vocațional, Personalitate, IPIP-NEO-60, Vocațional Complet, Valori (NOU). Done tests show ✓ + retake; undone show time badge. Above it, a **profile completeness card**: "Profil 64% complet — adaugă valorile de muncă pentru diferențiere între cariere similare". Completeness = weighted count of completed instruments (quiz 20%, vocational 20%, personality 20%, values 20%, deep tests 20% — exact split TBD).
2. **Drum — optional step.** Per-path optional step with cosmetic XP: „Descoperă-ți valorile · 5 min · opțional". Fits the existing journey step pattern (S3 manual steps).
3. **Rezultate — precision hook.** One card under the match list: „Rezultatul e calibrat pe interese + personalitate. Adaugă valorile ca să separi cariere care îți ies la egalitate." CTA → test. Shows only if values test not done. This is the natural conversion point — the user is *looking* at ties they can't break.

## Milestones

- **V1 — data + translation (1-2 sessions):** `data/work-values.json` (20 items RO + need→value mapping + scoring table from the User's Guide), RO translation v1 of the 20 statements, attribution + disclaimer copy.
- **V2 — card sort UI (2-3 sessions):** `/test/valori` route on the existing `test/[slug]` infrastructure; the card-sort interaction is the only new UI primitive (existing questionnaire renderer is Likert/choice-based). Forced 4-per-column validation.
- **V3 — scoring + result screen (1-2 sessions):** WIL scoring, result screen with top-2 values, disclaimers, Umami events (`values_start`, `values_complete`).
- **V4 — matching + surfaces (2-3 sessions):** careers.json workValues backfill (top ~60 careers by match frequency first), matcher component + weight, profil carousel + completeness card, drum optional step, rezultate hook.

Total: ~6-10 sessions. V1-V3 shippable without V4, but per the "visible effect" principle, don't announce the test until at least the matcher component works.

## Risks / open questions

- **Card sort on 390px** is the main UX risk: 5 columns × 4 cards doesn't fit a phone screen as a literal board. Mitigation: sequential UI — one card at a time, assign to a column via 5 buttons with live counters (4/4 locks a column); a summary board at the end allows rearranging. Prototype before committing.
- **Forced distribution frustration:** teens will want 8 cards in "most important". The lock is the instrument — keep it, but explain it in-line („aici e șmecheria: trebuie să alegi").
- **Need→value mapping and normalization** must come from the official User's Guide, not from memory — the values own unequal numbers of needs and at least one need statement (independence-as-need vs. Independence-as-value) is confusingly named.
- **RO-specific careers without O*NET crosswalk** get estimated values vectors — mark them and revisit after pilot feedback.
- ~~Where does this sit vs. ROADMAP priorities?~~ **Decided 2026-07-04: this is ROADMAP P2** — Adi: the current algorithm detects abilities well enough; between-job differentiation is the actual gap. V1-V3 run immediately; the V4 matcher weight is tuned together with P1 calibration data.
