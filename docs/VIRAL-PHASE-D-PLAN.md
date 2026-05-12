# Viral Sharing — Phase D: Shareable Card and Compatibility Blend

Status: plan draft, 2026-05-12. Awaiting review.
Builds on: `VIRAL-SHARING-REFERRALS-PLAN.md` (Phase A+B shipped, Phase C deferred admin-only).
Trigger: designer-led prototype in `Share_VIral_cards/` proposing visual share cards, a "guess colleague" public landing, and a class dashboard.

## 1. Why this plan exists

Phase A shipped a text-only share card (`apps/web/src/components/referrals/referral-share-card.tsx`). The mechanic is "copy a WhatsApp link with a career name in it" — there is no screenshot-able artifact. Comparable consumer products (Spotify Wrapped, Strava Year in Sport, BeReal recaps) work because the share asset is a *visual object the user wants to post*, not a hyperlink. That's the gap Phase D closes.

A standalone designer prototype proposed solving this by adding public `/u/CODE` profile pages, a "guess what your colleague got" game, and a class leaderboard at 5+ classmates. Several of those collide with privacy decisions already settled in §3 and §10 of the master plan:

- "No test result visible to the referrer."
- "No 'Maria took IPIP' event visible to another student."
- "No public real-name leaderboard by default."
- "Class/team challenge: no."

This document keeps the visual asset idea and the social-loop intent of the prototype, but routes both through mechanics that respect those decisions.

## 2. What we are building

### 2.1 Shareable PNG card (the artifact)

Generated client-side at the end of any results screen. Three layout variants × two crops (Story 1080×1920, Feed 1080×1080). The three variants exist so cards from different students don't all look identical in the same Instagram or WhatsApp feed — visual variety is what keeps a card stack re-shareable past the first wave.

Variants share the same content fields, differ in composition and accent:

- **Minimal** — black on cream, dotted grid, tight typographic hierarchy. The default. Aims at readability and "Notion screenshot" aesthetic.
- **Paint** — high-saturation accent block (purple or yellow), brand sticker rotated, sticker-stamp typography. Aims at "scrapbook / sticker pack" feel.
- **Split** — diagonal two-tone composition, archetype name on one side, top 3 careers on the other. Aims at "magazine cover" feel and works well in Feed crop.

Each variant displays:

- "CeSăFiu?" sticker stamp.
- Top RIASEC pair → curated archetype name + neutral, descriptive tagline (see §3).
- 4-letter code (e.g. `RIAS`) plus top-match score.
- Top 3 careers with match %.
- Footer URL: a short personalized redirect path. **D1 shipped with `cesafiu.ro` only.** **D1.1 changes this to `cesafiu.ro/r/CODE`** for signed-in users (302 → home with `?ref=CODE`) and `cesafiu.ro/quiz` for anonymous users (302 → first quiz). This is *not* a `/u/CODE` profile page — there is no public page that reveals the user's archetype to a visitor; the redirect drops them into the existing quiz funnel.

Selection: a small carousel-style picker above the share buttons lets the user flip through the three variants before downloading. Default selection is randomized per session to avoid the first variant becoming a de-facto monoculture.

Generation: `html-to-image` PNG export at pixel-ratio 3. Buttons: Download · WhatsApp · Web Share API · Copy link. No server roundtrip, nothing persisted.

### 2.2 Compatibility blend (replaces the "guess colleague" mechanic)

The designer's `/u/CODE` page revealed the referrer's archetype to the visitor. That's a §3 violation. Same engagement hook, different mechanic:

- Maria shares a referral link (already supported by Phase A+B).
- David clicks. He lands on the normal quiz page with a small banner: *"Provocare de la Maria — vezi pe ce trasee ai ieșit."* He does **not** see Maria's result.
- David takes the quiz. At his results he sees his own full result, plus a small "Blend cu Maria" panel showing:
  - The RIASEC *letters* the two share (e.g. "Voi doi împărțiți I și S"). RIASEC letters are interest dimensions, not psychometric profiles — leaking "you both lean Investigative" is a different order of disclosure than leaking an archetype name + score.
  - Three careers where the two profiles would complement each other (algorithm: top careers requiring strengths from both top RIASEC letters).
  - **No archetype name, no scores, no career match list of Maria's** leaks to David.
- Maria, signed-in, sees an opt-in counter ("David completed your challenge"). She does **not** see David's results.

The social hook ("see how I match a friend") is preserved; both profiles stay private from each other.

### 2.3 Comparison mode `/vs/CODE-A/CODE-B`

Ephemeral, gated. Ship in D4 only if D3 shows traction.

- Both users must be signed in.
- Both must have toggled `referral_opt_ins.show_compare = true` once.
- URL valid 24 hours, then 410 Gone. `robots.txt` disallow + `noindex` meta.
- Page shows only the same shape as the blend: shared RIASEC letters + 3 complementary careers.

## 3. Archetype curation

The prototype maps top-2 RIASEC pairs → 30 archetypes in `Share_VIral_cards/screens/share-card.jsx`. The mapping itself is sound (deterministic, evidence-anchored). The *names and taglines* need editing — several claim attributes that an 8-question scenario test cannot measure, which undercuts the credibility tier we built for the 19 EUR IPIP-NEO-60 + vocational-deep paid bundle.

**Replace these four** (claim trait-level competencies a 90-second test does not measure):

| Code | Current | Replace with | New tagline |
|---|---|---|---|
| SE | LIDERUL EMPATIC | CONECTORUL DE OAMENI | "Te atrag rolurile între oameni: HR, sales, organizare de echipe." |
| SA | TERAPEUTUL | INTERPRETUL SOCIAL | "Te atrag rolurile între oameni și expresie creativă." |
| SI | MENTORUL | EDUCATORUL | "Te atrag rolurile între oameni și cunoaștere: predare, coaching, scriere educațională." |
| SR | AJUTORUL | OPERATORUL SOCIAL | "Te atrag rolurile între oameni și activitate practică." |

**Rewrite all 30 taglines** in the same neutral-descriptive register. Pattern: "Te atrag rolurile X" / "Pătrunzi mai bine în domenii Y" — not "Spui povești care vindecă oameni" / "Lumea funcționează pentru că tu o ții."

Reason: an interest-typology quiz can honestly say "you lean toward narrative-creative roles." It cannot honestly say "you heal people with stories." The first is a vocational hypothesis the user can verify; the second is a clinical claim the test does not support.

## 4. What we are NOT building (and why)

Listed explicitly so these do not have to be re-debated:

- **Public `/u/CODE` pages.** Indexable URLs containing a minor's psychometric profile cannot survive DPIA review and conflict with §3.
- **Class dashboard auto-unlocked at 5+ students.** Violates §10 ("Class/team challenge: no"). A B2B teacher dashboard via an authenticated teacher account is a separate surface that may revisit later — but it is not this plan.
- **School leaderboards.** Vanity metric; structurally favours large urban schools; conflicts with mission.
- **AR filters / Instagram lenses / TikTok branded effects.** Build and maintenance cost is high; we have no evidence the 14-18 RO segment converts on these specifically.
- **"Reveal the friend's archetype" guess game.** The version where the visitor sees Maria's real result violates §3. The replaced version is the blend in §2.2.

## 5. Implementation phases

### D1 — Shareable PNG card  [SHIPPED 2026-05-12, commit b6db0fb]

- New module `apps/web/src/lib/results/archetypes.ts` with the curated 30-entry mapping from §3, RO + EN co-located in the module.
- New component `apps/web/src/components/results/result-card.tsx` rendering three variants at fixed dimensions (360×640, captured at pixelRatio 3 = 1080×1920 PNG).
- New component `apps/web/src/components/results/shareable-card.tsx` — consolidated orchestrator (picker + download + share-image into one file rather than three; state is shared so the split was extra plumbing for no gain).
- New module `apps/web/src/lib/analytics/umami.ts` — minimal SSR-safe event helper.
- Wired into `results-client.tsx` *next to* the existing `<ReferralShareCard>`. **This coexistence is temporary** — see D1.1.
- Umami events: `card_generated`, `card_variant_selected`, `card_downloaded_png`, `card_shared_native`.
- `html-to-image` added to package.json; runs `npm install` to fetch.

Deviations from the plan as originally written:

- Shipped Story crop only (9:16). Feed crop (1:1) deferred until telemetry suggests it's needed.
- Three "components" collapsed to one orchestrator file. Easier state ownership.

### D1.1 — Share-first modal (next)  [PLANNED 2026-05-12]

D1 placed the card inline below the results, alongside the existing text-based `<ReferralShareCard>`. That left five competing CTAs on /rezultate (save vibe, share card, share text, profil complet, browse) — too many for a 14-18yo at a vulnerable moment. D1.1 sequences the surface: share is the *primary post-quiz action*, then save-vibe is the inline next step on the page beneath.

**Decisions locked 2026-05-12:**

1. **Personalized URL is rendered onto the card image itself**, not delivered separately via Web Share text (which Instagram Stories strip). Footer becomes `cesafiu.ro/r/CODE` for signed-in users, `cesafiu.ro/quiz` for anonymous. No QR code in D1.1 (revisit if needed).
2. **Anonymous users see the card with the generic `cesafiu.ro/quiz` link.** Modal offers a secondary "Autentifică-te ca să primești linkul tău" CTA but doesn't gate access. Pierdere de attribution pe linkurile anonime e mai mică decât pierderea ratei de share.
3. **Auto-open the modal once per user**, gated by a localStorage flag. After dismiss, the page is reachable normally, with a small re-trigger button for revisits.
4. **Remove the existing `<ReferralShareCard>` from the inline page.** The modal absorbs its function. One share surface, not two.

**Scope:**

- New short redirect routes:
  - `apps/web/src/app/r/[code]/route.ts` → 302 to `/[defaultLocale]/?ref=CODE&utm_source=share&utm_medium=card&utm_campaign=student_share`. Reuses the existing referral first-touch capture in `referral-tracker.tsx`.
  - `apps/web/src/app/quiz/route.ts` → 302 to `/[defaultLocale]/test/scenarii?utm_source=share&utm_medium=card&utm_campaign=anonymous_share`. Drives anonymous link clicks directly into the first quiz.
- Modal component `apps/web/src/components/results/shareable-card-modal.tsx`: wraps the existing `<ShareableCard>` body. Backdrop, X close, ESC, click-outside dismiss, focus trap, mobile-full-screen below ~480px. Reuse the visual language of `authGateBackdrop` / `authGatePanel` for consistency with the existing auth gate.
- New localStorage key `cesafiu:shareableCardModal:seenAt` (timestamp). Auto-open on /rezultate if absent. Set on dismiss.
- `ShareableCard` updates:
  - New prop `referralCode: string | null` (caller passes `stats.code` for signed-in, `null` for anonymous).
  - Footer URL becomes `cesafiu.ro/r/${code}` or `cesafiu.ro/quiz` based on prop.
  - Drop the "Share din nou" inline button on the page; replace with a small text-button in the top corner of the results header.
- Remove `<ReferralShareCard>` from `results-client.tsx`. Keep the component file for now in case we revive text-only share later; mark with a doc comment.
- Translations: new `shareableCard.modal.*` namespace — title, dismiss label, anonymous CTA, re-trigger button label.
- Umami: `card_modal_opened` (with `trigger: 'auto' | 'manual'`), `card_modal_dismissed` (with `time_open_ms`, `did_share: boolean`).

**Acceptance:**

- First /rezultate visit with completed quiz auto-opens the modal exactly once.
- Re-trigger button reopens the modal manually.
- Modal traps focus, closes on ESC and outside-click on mobile + desktop.
- Card footer URL is the personalized `/r/CODE` for signed-in users, `/quiz` for anonymous.
- Hitting `cesafiu.ro/r/SOMECODE` lands the visitor on the home page with `?ref=SOMECODE` captured by the existing `<ReferralTracker>`.
- Hitting `cesafiu.ro/quiz` lands the visitor on /ro/test/scenarii.
- `<ReferralShareCard>` no longer appears on /rezultate.

**Scope NOT in D1.1:**

- Demoting `<save vibe>` to secondary — Adi did not request this; the inline save-vibe CTA stays as-is post-modal-dismiss.
- QR code on card — revisit if `card_downloaded_png` events on Story-context users stay low.
- Feed crop (1:1) — still deferred to telemetry.

### D2 — A/B test the card

Scope: 2 weeks of running.

- Variant A: text-only share card (current).
- Variant B: card download + share.

Primary metric: `referral_test_completed / share_card_views`.

Decision rule: ship D3 only if Variant B lifts the primary metric by >25% over a 2-week window with at least 200 share events. Otherwise stop here — the card is a worthwhile UX improvement even without virality lift.

### D3 — Compatibility blend

Conditional on D2 passing.

- New RPC `getBlendWithReferrer({referredUserId, referrerCode})` returning *only* shared RIASEC letters + complementary careers. No archetype name, no scores, no career list from the other side.
- New component `<BlendPanel>` on the results page, visible only when a referral code is present in localStorage at the time of completion.
- Tightened RLS: the RPC can read both users' results, but the response shape never includes scoring data.
- Umami: `blend_viewed`, `blend_shared`.

### D4 — Comparison mode

Conditional on D3 retention (pairs re-opening their blend within 7 days).

- Ephemeral `/vs/...` route, 24h TTL enforced server-side, `noindex` + `robots.txt` disallow.
- Profile toggle for `referral_opt_ins.show_compare`.

## 6. Privacy mapping back to master plan §3

| New surface | §3 rule | How it complies |
|---|---|---|
| PNG card | "No raw friend list import" | Client-side render, no upload, no contacts API |
| PNG card (D1.1 personalized URL) | "No test result visible to referrer" | The `cesafiu.ro/r/CODE` redirect lands the visitor on the home page with `?ref=CODE` captured — there is no public page that reveals the cardholder's archetype or scores. The visitor sees only their own results after they take the quiz themselves. |
| Blend | "No 'Maria took IPIP' event visible to another student" | Only RIASEC letters shown, never archetype, never which test, never scores |
| Comparison | "No public real-name leaderboard" | Ephemeral 24h URL, both users must opt in, `noindex` |
| Comparison | "No named friend tracking unless opted in" | Explicit toggle required before any compare link works |

## 7. Open questions

- Card variants: ship all three (minimal / paint / split) at D1 — decided 2026-05-12. Rationale: visual monoculture in shared feeds kills re-share rate. A single layout would make every CeSaFiu card look identical in a class WhatsApp group, which fatigues fast. Carrying three from launch is a small dev cost (~1-2 days) against a meaningful drop in feed fatigue. We can prune unused variants post-launch based on `card_variant_selected` telemetry.
- Localization: ship RO first in messages, EN to follow in the same release.
- iOS Safari PNG export: `html-to-image` has documented edge cases on iOS. Validate on a real device, not just simulator, before merging D1.
- Should the card include the user's display name? Recommend no — adds a personal data field without uplift evidence. The 4-letter code is sufficient as identifier and is non-sensitive.
- Should the blend show the *count* of completed challenges from a single referrer (e.g. "3 colegi au făcut deja"), or hide it? Recommend hiding for D3 launch; that surface invites a "who" question we can't safely answer.

## 8. What this plan supersedes

If approved, this document expands `VIRAL-SHARING-REFERRALS-PLAN.md` §9 Phase D, which currently lists possibilities without commitments. Once D1 is shipped, fold the §1-§6 content into the master plan and keep this file as historical context.
