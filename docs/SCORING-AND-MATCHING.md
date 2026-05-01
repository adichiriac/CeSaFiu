# Scoring & Matching — how recommendations are computed

*Living document. Last updated: 2026-04-30.*

This page is the canonical reference for **how a student's test answers turn into a ranked list of careers**. If you're rebuilding the algorithm in another language, designing the paid PDF report, or writing copy that references "match %", read this first.

Companion docs: [PSYCHOMETRICS.md](./PSYCHOMETRICS.md) (what tests we ship and why), [DATA-ARCHITECTURE.md](./DATA-ARCHITECTURE.md) (entity shapes).

---

## TL;DR

- Multi-axis cosine similarity between a user profile vector and a career profile vector. Four axes: **RIASEC** (Holland Code), **path bias** (facultate / autodidact / etc.), **traits** (legacy 7-bucket), **Big Five**.
- Weights are **sample-size-aware**: with only the quick quiz, RIASEC carries 60% of the score. With all 5 tests done, weights redistribute (RIASEC 50, paths 10, traits 10, Big Five 30).
- Score is calibrated to a **floor 25%, ceiling 80-95%** range. Ceiling rises with test breadth — a quick-quiz-only user can never exceed 80% match.
- **Confidence** (0-1) is a separate signal exposed alongside the match list. Driven primarily by test breadth, secondarily by spread between top-1 and top-3.
- Top-N is **diversified via MMR** so the user doesn't see four near-clones of #1.
- Each test source has a **defined override rule**: deep Holland (60-item O*NET) overrides light Holland (12-item forced-choice); IPIP-NEO-60 overrides the 15-item personality test.
- After matching, the engine returns an **adaptive next-test recommendation** — the most useful test the user hasn't taken yet.

All implementation lives in [`cesafiu_prototype_v3/project/app.jsx`](../cesafiu_prototype_v3/project/app.jsx) — search for `function buildUserProfile`, `rawScore`, `getWeights`, `computeMatches`, `recommendNextTest`.

---

## 1. Inputs — the test sources

The user can take up to **5 tests**, each contributing different signals. The algorithm reads from `answers` (quick quiz state) plus `deepScores` (everything else).

| Test | Items | Signals produced | Persisted as |
|---|---:|---|---|
| Quick quiz | 6 | RIASEC tags, path bias, legacy traits | `answers` |
| Vocational scurt (light Holland) | 12 | RIASEC counts (forced-choice) | `deepScores.vocational.raw` |
| Personalitate scurt (Big Five short) | 15 | O/C/E/A/N percentages | `deepScores.personality` |
| Vocational aprofundat (deep Holland, O*NET) | 60 | RIASEC means (Likert 1-5) | `deepScores.vocationalDeep.raw` + `top` + `validated:true` |
| IPIP-NEO-60 (Big Five validated) | 60 | O/C/E/A/N percentages | `deepScores.ipipNeo60` |

### Override rules

When **two tests of the same family** are taken, the deeper one wins:

- `vocationalDeep` **replaces** `vocational` in the RIASEC tally (not added to it).
- `ipipNeo60` **replaces** `personality` for Big Five.

Implementation: in `buildUserProfile`, the `if (vocDeep) {...} else if (vocLight) {...}` branch is mutually exclusive. Same for Big Five sources via `mergeBig5IntoProfile` shape (latest wins).

This matters because: (a) deeper tests are validated and we want their scores authoritative, (b) double-counting would inflate confidence and bias scores; (c) keeps the math clean — never weight by source quality, just pick the best source available.

### What's tracked as a `source`

`userProfile.sources` is an array of strings driving weight + confidence calculation:

```
['quick', 'vocational' OR 'vocational-deep', 'personality-15' OR 'ipip-neo-60']
```

Each "family" contributes at most one entry. Three families → max 3 sources.

---

## 2. The user profile

`buildUserProfile(answers, deepScores)` produces:

```js
{
  riasec: { R: 4, I: 7, A: 3, S: 1, E: 2, C: 1 },   // counts/sums per Holland code
  paths:  { facultate: 3, autodidact: 1, mixt: 2 }, // counts per path bias
  traits: { build: 2, analyze: 4, create: 3 },     // counts per legacy 7-bucket trait
  big5:   { O: 75, C: 60, E: 30, A: 55, N: 40 },   // 0-100 percentages, only if Big Five test taken
  sources: ['quick', 'vocational', 'personality-15'],
}
```

### Where each signal comes from

**RIASEC (`riasec`).** Three contributors:
1. **Quick quiz answers** — each option's `riasec[]` array adds +1 per letter (typically 1-2 letters per option × 6 answers ≈ 9-12 votes).
2. **Light vocational (12-item)** — each chosen option's `code` adds +`VOCATIONAL_WEIGHT` (=2) to that letter (12 items × 2 = 24 effective votes).
3. **Deep vocational (60-item O*NET)** — each item's mean Likert per code is centered on 3 (neutral) and scaled: `max(0, (mean - 3) × 6)`. Range: 0 to +12 per code. Subtraction-from-neutral means dislikes don't penalize, only above-average interest contributes.

When the deep test is present, the light test's contribution is **skipped entirely** (else-if).

**Paths (`paths`).** Only the quick quiz contributes to `paths`. Each option has a `path` field (one of `facultate`, `autodidact`, `antreprenor`, `profesional`, `freelance`, `creator`, `mixt`) — adds +1 to that path's tally.

**Traits (`traits`).** Only the quick quiz contributes. Legacy 7-bucket: `build`, `tech`, `analyze`, `social`, `lead`, `create`, `visual`. Each option's `traits[]` array adds +1 per trait listed.

**Big Five (`big5`).** Only the personality / IPIP test contributes. The result is a `{O, C, E, A, N}` object with values 0-100, copied into `userProfile.big5` directly (no aggregation across tests — most-recent wins; IPIP-NEO-60 wins over short test if both are taken).

### Edge case: no answers at all

If `answers` is empty AND no deep tests are taken, `noAnswers` is true. `computeMatches` returns the careers list with `score: 0` and an empty `sources` array. The UI handles this by showing zero-score bars (the floor at 25% only applies when at least one source contributed).

---

## 3. The career profile

`buildCareerProfile(career)` produces a parallel-shape vector from the static career metadata:

```js
{
  riasec: { I: 3, A: 2, R: 1 },          // primary→tertiary weighted 3/2/1
  paths:  { facultate: 1 },              // pathType → 1, plus mixt fallback
  traits: { build: 1, tech: 1, ... },    // each declared trait → 1
  big5:   { O: 1, C: 1 },                // each declared anchor → 1
}
```

### Weighting the RIASEC codes

Career RIASEC is declared as an ordered array (`['I', 'A', 'R']`) — primary, secondary, tertiary in that order. The first code gets weight 3, second 2, third 1. Anything beyond is also 1 (rare; most careers list at most 3). This reflects the standard Holland convention that the first code is the dominant one.

### `mixt` path expansion

Careers with `pathType: 'mixt'` are wired to *also* resonate with `facultate` and `autodidact` paths at half-weight. So a `mixt` career's path vector is `{ mixt: 1, facultate: 0.5, autodidact: 0.5 }`. This prevents the "I'm undecided about my path" user from being penalized when matching mixt-tagged careers.

### Big Five anchors

Careers declare a list of dominant Big Five letters (e.g., `big5: ['O', 'C']`). Each declared letter becomes weight 1.0; non-anchored letters are 0 (neutral, not penalized). Only the upper Big Five matter — there's no convention to anchor "low N" or "low E", so we don't.

**Known data limitation:** of 107 careers, the Big Five anchor distribution is `O:50, C:84, E:29, A:30, N:0` plus one stray `I` (typo). N is never anchored. This is a real gap (see §13 Open Issues).

---

## 4. The scoring formula

`rawScore(userProfile, careerProfile, weights)` returns a single 0-1 score per career:

```
rawScore = W.riasec × cos(user.riasec, career.riasec)
         + W.paths  × cos(user.paths,  career.paths)
         + W.traits × cos(user.traits, career.traits)
         + W.big5   × big5Cosine(user.big5, career.big5)
```

Each `cos()` is standard cosine similarity over the 6 / 7 / 7 / 5-dim vectors (RIASEC keys, PATH_KEYS, TRAIT_KEYS, BIG5_KEYS).

### Big Five cosine with centering

Big Five user values are percentages 0-100. A naive cosine treats `{O: 50}` (average) as moderately matching every career anchored on O. To fix: **subtract 0.5 (centered) and clamp at 0** before the cosine, so only the *above-average* part counts:

```js
function big5Cosine(userBig5, careerBig5) {
  const userVec = BIG5_KEYS.map(k => Math.max(0, (userBig5[k]/100) - 0.5));
  const careerVec = BIG5_KEYS.map(k => careerBig5[k] || 0);
  return cosine(userVec, careerVec);
}
```

This means: a user at exactly 50 on Openness contributes 0 to a career anchored on O. A user at 80 contributes 0.30. A user at 30 contributes 0 (not −0.20 — we don't penalize, just don't reward).

**Why centering and not z-score normalization?** Z-score would require knowing population means, which we don't have for Romanian teens. Centering at 0.5 is a pragmatic proxy that says "scores above average lift the match; below average leaves it neutral."

---

## 5. Weights (sample-size-aware)

`getWeights(userProfile)` returns one of six weight tables based on which sources contributed. The principle: **more sources → RIASEC's share comes down, Big Five activates, paths/traits stay roughly stable**.

| Sources contributing | RIASEC | Paths | Traits | Big Five |
|---|---:|---:|---:|---:|
| Quick only | **0.60** | 0.25 | 0.15 | 0.00 |
| Quick + light Holland | **0.65** | 0.20 | 0.15 | 0.00 |
| Quick + deep Holland | **0.70** | 0.15 | 0.15 | 0.00 |
| Quick + Big Five (no Holland) | **0.45** | 0.20 | 0.10 | 0.25 |
| Quick + light Holland + Big Five | **0.45** | 0.15 | 0.10 | 0.30 |
| Quick + deep Holland + Big Five | **0.50** | 0.10 | 0.10 | 0.30 |

Reasoning:

- **Quick-only user has thin RIASEC data** (~9 votes from 6 questions), so the algorithm needs to lean on RIASEC because that's all it has — but the *score ceiling* (§6) caps confidence to compensate.
- **Adding any Holland test boosts RIASEC's reliability**, so its weight goes up slightly while paths/traits drop. Deep Holland is more reliable than light, so RIASEC gets even higher trust (0.70).
- **Adding Big Five activates the 4th axis**, redistributing weight toward `big5: 0.25-0.30`. Path and trait shares both shrink because they were partly compensating for missing motivational data.
- **All three families together** yield the most balanced weighting — the algorithm has all the signals it needs.

These tables are tuned by *reasonableness*, not by validation — there's no held-out empirical study saying "0.55 RIASEC weight is optimal." If we ever get user-feedback data (top-1 match validated by user as "yes that's me"), tune these against that.

---

## 6. Score calibration

Cosine similarity produces 0-1 raw scores, but those need to land in a 0-100 percentage range that students can read. Calibration:

```
norm   = rawScore / max(rawScore across all careers, 0.001)   // 0..1 normalized within this user's space
curved = FLOOR + Math.pow(norm, 0.85) × (CEIL - FLOOR)        // power curve
score  = round(curved)
```

### Floor: 25%

Even the worst match shows a visible bar (25% — not zero). Students panic at "0% match" even when the match is genuinely irrelevant. 25% means "no really, this isn't for you" without being demoralizing.

### Ceiling: dynamic, by test breadth

| Sources | Ceiling |
|---|---:|
| 1 (quick only) | **80%** |
| 2 (quick + 1 deeper test) | **88%** |
| 3 (quick + Holland + Big Five) | **95%** |

Never 100%. Two reasons:
1. Honesty principle: we never claim certainty from any test combo.
2. Even validated psychometric instruments have measurement error. Capping at 95% communicates "very high fit, but go verify."

### Power curve `^0.85`

Without the curve, scores would be linear from floor to ceil. The 0.85 exponent slightly bends the curve so that **weak matches stay visibly weak** (the bottom of the distribution doesn't compress), and **strong matches separate** (the top has more visual contrast). This is purely a display heuristic — the underlying ranking by raw score is unchanged.

---

## 7. MMR diversity (top-N selection)

The matching algorithm produces 100+ ranked careers. The UI shows top 6. Picking the top 6 by raw score is a bad idea: when a user's profile is RIASEC `I+A`, the top 6 by raw score are often 6 near-clones (Cercetător, Researcher, Investigator, Analyst, etc.). Boring.

**MMR (Maximum Marginal Relevance)** picks each next entry by trading off relevance vs. similarity to already-picked entries:

```
mmr = LAMBDA × candidate.raw - (1 - LAMBDA) × maxSim(candidate, picked[])
```

- `LAMBDA = 0.7` — favors relevance 70%, diversity 30%
- Similarity is RIASEC vector cosine to already-picked careers
- Top 6 picked this way; remaining tail kept in pure raw-score order

End result: top 6 includes the highest-relevance entries but with deliberately distinct RIASEC profiles. Sorted by display score (calibrated %) for monotonic UI.

**Caveat:** MMR diversity uses *only* RIASEC similarity. If a user has Big Five data, that's not factored into diversity — same RIASEC profile but different Big Five anchors would still look like clones. Not yet fixed.

---

## 8. Confidence

Returned on the matches array as `matches.confidence` (0-1). Drives the UI's "ÎNCREDERE: Scăzută/Medie/Solidă" chip + adaptive next-test prompts.

```
breadthBase = breadth >= 3 ? 0.70 : breadth === 2 ? 0.40 : 0.10
spread      = (top1.raw - top3.raw) / top1.raw
spreadBonus = min(0.30, spread × 1.5)
confidence  = min(1, breadthBase + spreadBonus)
```

| Breadth | Typical range |
|---|---|
| 1 (quick only) | 0.10-0.35 (Scăzută) |
| 2 (+ Holland or Big Five) | 0.40-0.70 (Medie) |
| 3 (all three families) | 0.70-1.00 (Solidă) |

Confidence labels:
- `< 0.30` → **Scăzută** (yellow chip)
- `0.30 to 0.60` → **Medie** (green chip)
- `≥ 0.60` → **Solidă** (purple chip)

### Why breadth dominates spread

An earlier formula was `spread × sqrt(breadth)`. It was wrong: adding *more* tests can *reduce* spread (because more careers cluster near the top — they all match well across multiple axes). The naive formula penalized this. Current formula treats breadth as the primary signal and spread as a secondary refinement: more tests = inherently more confident, regardless of whether scores are tightly clustered or sharply separated.

---

## 9. Adaptive next-test recommendation

`recommendNextTest(userProfile)` returns `{ kind, reason }` for the most-useful next step the user hasn't taken, or `null` if they've done all useful tests.

### Chain order

1. **Quick** — if not done, do it first.
2. **Light Holland** — sharpens RIASEC (adds ~24 votes to a RIASEC tally that was ~9 from quick alone).
3. **Personality short** — adds Big Five (different signal type, not refining what's there).
4. **Deep Holland (O*NET)** — replaces light Holland with validated 60-item version.
5. **IPIP-NEO-60** — replaces short personality with validated 60-item Big Five.

Why this order: after light Holland, **Big Five comes before deep Holland** because a *new signal type* (motivational fit) adds more match value than refining the one we already have (Holland from 12 → 60 items). Once Big Five is in, the user has the breadth-3 ceiling unlocked; the deep variants then refine within that breadth.

### Reason copy

Student-language imperative + benefit, not psychometric jargon:

| Step | Reason text |
|---|---|
| → Light Holland | "Continuă cu testul vocațional scurt (12 itemi, 5 min) ca să afli mai precis ce ți se potrivește." |
| → Personalitate | "Continuă cu testul de personalitate scurt (15 itemi, 4 min) ca să vedem și ce te motivează cu adevărat." |
| → Deep Holland | "Continuă cu testul vocațional aprofundat (60 itemi, 8-10 min). E cel folosit oficial în SUA — îți dă o predicție mult mai precisă decât testul scurt." |
| → IPIP-NEO-60 | "Continuă cu testul de personalitate validat (60 itemi, 12 min). E versiunea științifică a celui scurt — cea mai precisă predicție a profilului tău." |

The result-screen UI also surfaces concrete acuratețe-gain hints ("Acuratețea crește de la ~17% la ~50%") to motivate completion.

---

## 10. Explainability

Each match also returns a `why` object:

```js
{
  text: "RIASEC I+A · drum facultate · Big Five aliniate",
  axes: { riasec: 0.78, paths: 1.0, traits: 0.62, big5: 0.55 },
  riasecHit: ['I', 'A'],
  pathHit: true,
}
```

- **`text`** — short summary string for the result hero
- **`axes`** — per-axis sub-scores (each in 0-1) for the "DE CE — pe axe" panel in the UI
- **`riasecHit`** — which of the user's top 2 RIASEC codes overlap with the career's codes
- **`pathHit`** — boolean: does the career's pathType match the user's top path

The student-facing "PROFILUL TĂU" panel reads from the user profile (not the per-match `why`) to render plain-language summaries:

- **STILUL TĂU** — top RIASEC codes mapped to verbs: R=Faci, I=Înțelegi, A=Creezi, S=Asculți, E=Conduci, C=Pui ordine.
- **DRUMUL PREFERAT** — top path bias (Facultate / Autodidact / etc.).
- **PERSONALITATEA** — Big Five percentages with hi/lo descriptions ("Curiozitate: te atrag idei noi" vs "rutine cunoscute").

These translations live in `screens/results.jsx` as `RIASEC_PLAIN` and `BIG5_PLAIN` constants. Calibrated for 16-year-olds, not psychologists.

---

## 11. Persistence and state shape

User test state is **in-memory only** by default (`useState`). Phase 1 added localStorage persistence for the user's *picks* (saved careers, chosen path, etc.) but **not** for test scores. Reload = lost test scores = matching falls back to whatever's still in `answers`/`deepScores`.

This is intentional for now: test scores are 1-session deep, not 6-month-deep. When Supabase profile lands (Phase 2 §4 of PHASE-2-PLAN.md), test scores will persist on the user account.

If you change persistence: `loadProfile`/`persistProfile` helpers from v1's app.jsx are the reference pattern. They merge each test type into a unified profile object, with `big5_source` tracking which test produced the most-recent Big Five (so re-taking the short test doesn't clobber an IPIP score).

---

## 12. Honesty principles baked into the algorithm

These are non-negotiable design constraints:

1. **Never claim 100% match.** Hard ceiling at 95% with all 3 tests; 80% with quick alone.
2. **Always show confidence.** The user sees Scăzută/Medie/Solidă on every result, not a hidden internal value.
3. **Show what fed the result.** "Bazat pe: Quiz rapid + Holland scurt + Big Five (IPIP-NEO-60)" — sources are visible.
4. **Don't penalize sparse data.** Floor at 25% so even weak matches show a visible bar; cosine similarity for missing axes returns 0 (neutral, not negative).
5. **No source double-counts.** Deep tests REPLACE light tests; IPIP REPLACES short personality. The user can't accidentally inflate confidence by re-taking a similar test.
6. **Match copy doesn't oversell.** Quick quiz result says "indicii mai solide", not "real data". Adaptive next-test framing uses "mai precis", not "verified".

If a future change relaxes any of these (e.g., charging for the result via paid PDF), revisit them explicitly. They protect us legally (against "we promised certainty") and ethically (against parents/students taking the result as gospel).

---

## 13. Open issues / known limitations

These are real gaps. Some are tracked in `DATA-MAP-TODO.md`; others I'm noting here for the first time.

### Career-side data is sparse

- **RIASEC codes per career are 1-3 letters**, ordered, weighted 3/2/1. A real Holland measurement assigns *all 6* codes a percentile. We could enrich the schema to `riasec: { R: 0.2, I: 0.85, A: 0.65, S: 0.1, E: 0.4, C: 0.3 }` — would make matching much more nuanced, but requires re-validating 107 careers. Tracked as `#25` in the task list.
- **Big Five anchors are sparse and biased toward C and O** (84/107 careers have C, 50/107 have O). Almost no career anchors `E`, `A`, or `N`. This means a high-E (extraverted) user gets little signal from Big Five matching — most careers don't claim E as relevant, even when it should be (sales rep, social entrepreneur, etc.).
- **No "low N" anchors.** Many careers benefit from emotional stability (medic urgență, paramedic, founder) but the schema only encodes "high X" anchors. A high-N user is never penalized for high-stress careers, when they probably should be steered toward calmer roles.

### Algorithm assumptions worth challenging

- **Path bias is binary.** A career's pathType is one of seven enums; the user's path tally is integer counts. The current cosine treats "user with `facultate: 3, autodidact: 1`" as nearly orthogonal to a `pathType: autodidact` career. Real students have *fluid* path preferences. A weighted multi-bucket approach (tag each career with `{facultate: 0.7, autodidact: 0.3}`) would be more honest.
- **Traits axis is legacy and probably redundant.** The 7-bucket trait system (build/tech/analyze/social/lead/create/visual) is a shadow of RIASEC. They correlate heavily. Currently weighted 0.10-0.15 — keeping it as decoration. Could be dropped without much effect, freeing 10% of weight for something more useful.
- **MMR diversity uses only RIASEC.** Two careers with identical RIASEC but very different Big Five anchors can still appear as "clones" in top-N. Could extend MMR similarity to include Big Five vector when present.
- **Big Five percentage centering at 0.5 is a heuristic.** Should be at the population mean for Romanian teens. We don't know that mean. Possible follow-up: collect IPIP-NEO-60 results from N=1000+ users, compute population means, replace the 0.5 constant.

### UX/data integration gaps

- **No "why X over Y" comparison.** A user sees that career A is 78% and career B is 75%. They don't see *what specifically* would need to change for B to become #1. This is a Phase 2 feature.
- **Adaptive recommendation doesn't consider user time/effort.** A student in 11th grade with BAC in 6 months gets the same recommendation chain as one with 18 months ahead. A time-aware version would prioritize the highest-precision-per-minute test.
- **Failed/skipped items are treated as neutral.** If a user rates 50 of 60 IPIP items and skips 10, the skipped items default to 3 (neutral). They should arguably default to "exclude from sum" or "use prior probability." Real psychometric tools handle this with imputation.

### Things that would help validate the math

- **A "did we get you right?" feedback loop.** After result rendering, ask "1-5: how well does this top match describe you?" Save the rating. After ~500 ratings, we can compute correlation between predicted score and felt-fit. If they correlate weakly, the weights are wrong.
- **A test/retest reliability check.** Ask 100 users to take the IPIP-NEO-60 twice, two weeks apart. If their top-3 careers swap > 20% between sessions, the algorithm is too noisy.
- **Demographic bias check.** Are the matches biased toward certain demographics (urban vs rural, specific liceu profiles)? Would need to capture demographics post-result.

---

## 14. References to actual code

| Concept | File | Function |
|---|---|---|
| Build user profile from all sources | `cesafiu_prototype_v3/project/app.jsx` | `buildUserProfile(answers, deepScores)` |
| Build career profile from static data | `cesafiu_prototype_v3/project/app.jsx` | `buildCareerProfile(career)` |
| Compute single-career score | `cesafiu_prototype_v3/project/app.jsx` | `rawScore(userProfile, careerProfile, weights)` |
| Big Five centered cosine | `cesafiu_prototype_v3/project/app.jsx` | `big5Cosine(userBig5, careerBig5)` |
| Sample-size weight tables | `cesafiu_prototype_v3/project/app.jsx` | `getWeights(userProfile)` |
| Full pipeline (rank, calibrate, MMR, confidence) | `cesafiu_prototype_v3/project/app.jsx` | `computeMatches(answers, careers, deepScores)` |
| Per-match explanation | `cesafiu_prototype_v3/project/app.jsx` | `explainMatch(userProfile, career, careerProfile, weights)` |
| Adaptive next-test recommendation | `cesafiu_prototype_v3/project/app.jsx` | `recommendNextTest(userProfile)` |
| Plain-language student translations | `cesafiu_prototype_v3/project/screens/results.jsx` | `RIASEC_PLAIN`, `BIG5_PLAIN`, `topRiasecCodes()` |
| Light Holland scoring (12-item) | `cesafiu_prototype_v3/project/screens/vocational.jsx` | `computeRIASEC(responses, data)` |
| Deep Holland scoring (60-item O*NET) | `cesafiu_prototype_v3/project/screens/vocational-deep.jsx` | `computeVocationalDeep(responses, data)` |
| Big Five scoring (15- or 60-item) | `cesafiu_prototype_v3/project/screens/personality.jsx` | `computeBig5(responses, data)` |

Constants you'll find scattered:

- `RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C']`
- `PATH_KEYS = ['facultate', 'autodidact', 'antreprenor', 'profesional', 'freelance', 'creator', 'mixt']`
- `TRAIT_KEYS = ['build', 'tech', 'analyze', 'social', 'lead', 'create', 'visual']`
- `BIG5_KEYS = ['O', 'C', 'E', 'A', 'N']`
- `VOCATIONAL_WEIGHT = 2` (light Holland multiplier)

---

## 15. Decision log — why each major choice was made

Newest first. Add to this section whenever the algorithm changes.

### 2026-04-30 — Big Five wired into matching (Phase A)

Before this, `deepScores` was collected and *displayed* (in the profile card) but never fed into `rawScore`. Even taking IPIP-NEO-60 — 12 minutes of careful answering — produced *zero* change in the recommendation. That was misleading. Phase A made `useMemo` include `deepScores` in its dependency array and added the Big Five axis with sample-size-aware weights. Documented in commit `367d72b`.

### 2026-04-30 — Sample-size-aware weight tables

Replaced the fixed `{riasec: 0.55, paths: 0.25, traits: 0.20}` weights with the 6-table scheme in §5. Reasoning: a quick-quiz-only user has thin RIASEC data but it's all they have, so weight it higher; an all-tests-done user has reliable Big Five, so weight that in. The previous flat scheme overweighted RIASEC for sparse-data users and underweighted Big Five for full-data users.

### 2026-04-30 — Confidence formula switched to breadth-driven base

Original `spread × sqrt(breadth)` was wrong: more sources can *reduce* spread (more careers cluster near top). Switched to `breadthBase + spreadBonus` with breadth as the dominant signal. Verified empirically: quick-only ≈ 0.17, +Holland ≈ 0.49, +Big Five ≈ 0.74 — monotonic, intuitive.

### 2026-04-30 — Score ceiling adapts to test breadth

Added 80%/88%/95% caps based on `sources.length`. Stops the quick-quiz-only user from seeing "94% match" (they shouldn't be able to). Honesty principle: never oversell what 6 questions can predict.

### 2026-04-30 — Deep Holland (60-item O*NET) shipped as override tier

Added `vocationalDeep` data + screen + `computeVocationalDeep` scoring. Treated as override of light Holland in `buildUserProfile` (not additive). Items are O*NET Interest Profiler (US Department of Labor, public domain), translated to Romanian. Four items flagged for cultural review.

### 2026-04-30 — Adaptive next-test recommendation chain reordered

Originally: quick → vocational → ipip-neo. Reordered to: quick → light Holland → personality short → deep Holland → IPIP-NEO-60. Big Five comes *before* deep Holland because a new *signal type* adds more value than refining an existing axis.

### Earlier (pre-Phase-A) — original cosine-based algorithm

Multi-axis cosine similarity over RIASEC + path + traits. RIASEC at 55%, paths 25%, traits 20%. Score floor at 25%, ceiling at 92% (then). MMR for top-N diversity at LAMBDA=0.7. Honest 0-100 calibration with power-curve display. Documented in v3 commit history; this is the baseline the Phase A changes built on.

---

## 16. Glossary

- **Cosine similarity** — measures how aligned two vectors are (0 = orthogonal, 1 = identical direction). Used here to compare user-profile-vector to career-profile-vector axis-by-axis.
- **MMR (Maximum Marginal Relevance)** — algorithm for picking top-N from a ranked list while penalizing too-similar entries. Originated in IR (information retrieval); we use it for top-6 career display.
- **RIASEC** — Holland's 6-code interest typology: Realistic, Investigative, Artistic, Social, Enterprising, Conventional.
- **Big Five (OCEAN)** — Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism. The validated personality model used since the 1980s.
- **IPIP-NEO-60** — public-domain 60-item Big Five inventory derived from the IPIP item pool. Validated, free, commercially usable.
- **O*NET Interest Profiler** — US Department of Labor's public-domain 60-item Holland-aligned interest test. Validated, free.
- **Source** — a test that contributed signals to the user's profile. Three families: quick, vocational (light or deep), Big Five (short or full IPIP).
- **Breadth** — how many *families* of source contributed (1, 2, or 3). Drives confidence and weights.
- **Validated tier** — a test with peer-reviewed psychometric validation. Currently: O*NET IP and IPIP-NEO-60. The 12-item Holland and 15-item personality tests are *original* (not validated).
