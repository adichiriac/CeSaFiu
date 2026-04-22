# Ce Să Fiu? — Design System (v0.1)

> Working doc for Adi. Derived from the current Figma file (`x0UkMlH4pjh9fjsd2DLtFK`), pulled 2026-04-22.
> Scope: audit current state, document what exists, propose what's missing, formalize foundations — aligned with CeSaFiu's Phase 1 objectives (viral free quiz, conversational AI UX, parent involvement layer).

---

## 0 · TL;DR (read this first)

**What you have in Figma today:**
- 9 mockup screens on a single page — all at mobile 390px width, with 2 desktop variants
- **Zero Figma components or component sets defined** — every element is raw frames copy-pasted across screens
- 7 external community UI kits attached (Material 3, Simple Design System, iOS 26, iPadOS, macOS, watchOS, visionOS) — noise, none actually driving the design
- A strong, opinionated visual language is already emerging — the brand has a clear voice

**The three most important things to do next (in order):**
1. **Decide the brand name.** The Figma shows "VIITORUL TĂU" as the logo, but the project is "Ce Să Fiu?" — you need to commit to one. (See §2.)
2. **Convert the current screens into Figma components with variants.** Right now everything is a static mock — you'll copy-paste visual bugs into every new screen until this is fixed.
3. **Define 5 token collections in a Figma Variables file** (color, type, spacing, radius, shadow) — before any new screens are designed.

**Overall design-system score: 34 / 100.** Strong visual direction, zero systematization. This is typical and fine at your stage — but the cost of delaying compounds fast once you have ≥15 screens.

---

## 1 · Executive Audit

### Score breakdown

| Area | Score | Note |
|---|---|---|
| Visual language clarity | 8 / 10 | Distinct, memorable, Gen-Z appropriate |
| Token coverage | 1 / 10 | No variables in file — colors/type/spacing are raw |
| Component coverage | 0 / 10 | No components. Every screen is raw frames |
| Naming consistency | 4 / 10 | Mixed RO/EN, inconsistent desktop suffix pattern |
| Responsive coverage | 3 / 10 | Only 2 of 7 flows have desktop variants |
| Accessibility readiness | 4 / 10 | Good contrast in most places; no a11y annotations |
| Documentation | 0 / 10 | Nothing written down yet (this doc fixes that) |
| Attached libraries hygiene | 4 / 10 | 7 unused community kits add noise |
| Alignment with Phase 1 objectives | 6 / 10 | Viral quiz present; AI conversation UX + parent layer missing |
| Scalability for i18n | 4 / 10 | Romanian works; no text-length stress tests |
| **Total** | **34 / 100** | — |

### Priority actions (top 5)

| # | Action | Why | Effort |
|---|---|---|---|
| 1 | Commit to one brand name: "Ce Să Fiu?" or "Viitorul Tău" | Two names on the same product will fragment memory and paid-ads testing | ½ day |
| 2 | Create a Figma Variables collection (color, type, spacing, radius, shadow) | Everything after this becomes cheaper | 1 day |
| 3 | Componentize the 6 obvious candidates: Button, OptionCard, MatchCard, Pill, ProgressBar, BottomNav | Stops copy-paste drift | 1–2 days |
| 4 | Remove 6 of the 7 attached community libraries (keep only Simple Design System or M3 for icons) | Cleaner file, faster search | 10 min |
| 5 | Add the 3 missing flow-critical screens: AI Conversation, Parent Invite, Share Card | Phase 1 objectives aren't coverable without them | 2–3 days |

---

## 2 · Brand conflict (flag this first)

The Figma file shows **"VIITORUL TĂU"** (Your Future) as the visible product name — with a flag icon and in the top-left of every screen. Your project memory, strategy doc, and grant positioning all say **"Ce Să Fiu?"** ("What Should I Be?").

Both are strong, but they position differently:

| "Ce Să Fiu?" | "Viitorul Tău" |
|---|---|
| Asks the question the student is already asking | States the answer — aspirational |
| First-person, more intimate | Second-person, more marketing |
| Matches conversational AI UX ("I'm asking for help") | Matches motivational / inspirational framing |
| Slightly risky domain (what's on .ro?) | Generic phrase, widely used — less brandable |

**Recommendation:** Keep `ceSaFiu` / "Ce Să Fiu?" as the product brand. It's more distinctive, matches the conversational UX direction, and it's what your docs and grant positioning already assume. If "Viitorul Tău" is doing real work, consider making it the tagline (not the logo): e.g. `Ce Să Fiu? — Construiește-ți viitorul tău.`

Either way: **pick one and rename everywhere in Figma before componentizing.** Changing a wordmark after it's embedded in a Header component is 3× the work.

---

## 3 · Current visual language (observed)

Strong, coherent aesthetic already in place. Describable in five words: **collage, brutalist, Gen-Z, warm, confident.**

### Signature moves

- **Thick black borders** (1.5–2px) on cards, buttons, chips, icon tiles
- **Hard-offset drop shadows** (≈4px x, 4px y, 0 blur, pure black) — the "sticker pulled off paper" effect
- **Cream/off-white canvas** instead of pure white — feels warmer, more notebook-like
- **Highlighter accent**: bright lime-green rectangular block rotated ~3° behind a word (e.g. "CU ADEVĂRAT")
- **Floating collage stickers**: small rotated icon tiles (rocket, stethoscope) as decorative float
- **Uppercase, letter-spaced micro-labels**: "PENTRU GEN Z", "MISIUNE ÎN CURS", "REZULTAT QUIZ"
- **Display-weight headlines** in condensed bold sans (looks like Archivo Black / Outfit Black)

### Brand voice (observed RO copy)

- Casual/slang: "dă-i bătaie", "vibe-ul tău", "Cum îți zic prietenii?"
- Anti-institutional: "Fără teste plictisitoare de la consilierul școlar"
- Game/quest framing: "MISIUNE ÎN CURS", "Următoarea întrebare"
- Social proof: "Peste 10,000 de tineri au dat deja" (aspirational — you don't have 10k yet, but the copy is set up for it)

**Alignment with Phase 1 objectives: strong.** This tone matches the viral-quiz Phase 1 positioning. When you add Phase 3 (school/counselor licensing) you'll need a more restrained alt-voice for B2B contexts — flag for later.

---

## 4 · Foundations (proposed tokens)

Figma file has no variables defined today. Below is the token structure I recommend creating — values inferred visually from screenshots, verify exact hex in Figma before committing.

### 4.1 Color

**Brand (primitive):**

| Token | Value (approx) | Where used |
|---|---|---|
| `brand/ink` | `#0F0F10` | Text, borders, shadow |
| `brand/paper` | `#F5EFE3` | Canvas background |
| `brand/purple-600` | `#6B4AFF` | Primary button, icon tiles, result CTA |
| `brand/purple-100` | `#E9E4F5` | Match-card subtle background |
| `brand/lime-500` | `#BFFF3A` | Highlighter accent, progress fill, share CTA |
| `brand/mustard-500` | `#F5D94B` | Secondary CTA, chip background |
| `brand/mustard-600` | `#ECC94B` | Alt-emphasis card (e.g. UTCN) |

**Semantic (aliases that should wrap the above):**

| Semantic token | Maps to | Intent |
|---|---|---|
| `color/bg/canvas` | `brand/paper` | Screen background |
| `color/bg/surface` | `#FFFFFF` | Card background |
| `color/text/primary` | `brand/ink` | All headlines/body |
| `color/text/inverse` | `#FFFFFF` | Text on purple CTA |
| `color/border/strong` | `brand/ink` | Card/button border |
| `color/accent/primary` | `brand/purple-600` | Primary action |
| `color/accent/secondary` | `brand/mustard-500` | Progress/next |
| `color/accent/highlight` | `brand/lime-500` | Highlighter, share |
| `color/state/success` | `#2E7D32` (TBD) | Confirmations — MISSING |
| `color/state/error` | `#D32F2F` (TBD) | Form errors — MISSING |
| `color/state/info` | `brand/purple-600` | Inline info |

**Critical gap:** No error, warning, or success colors visible. You'll need them the moment you design the profile form's invalid state.

### 4.2 Typography

Only one visible family. The geometric bold display face looks like **Archivo Black**, **Outfit Black**, or **Bricolage Grotesque**. Body copy is a softer sans (**Inter** or **DM Sans**). Pick one display + one body.

**Recommended scale (mobile base):**

| Token | Size / Line-height | Weight | Use |
|---|---|---|---|
| `type/display-xl` | 40 / 44 | 900 | Hero headline ("AFLĂ CE ȚI SE POTRIVEȘTE") |
| `type/display-lg` | 32 / 36 | 900 | Screen title ("ARHITECTUL DIGITAL") |
| `type/display-md` | 28 / 32 | 800 | Question headline ("Cum îți place…") |
| `type/heading-lg` | 20 / 26 | 700 | Card title ("Politehnica București") |
| `type/heading-md` | 17 / 22 | 700 | Option label |
| `type/body-md` | 15 / 22 | 400 | Paragraph |
| `type/body-sm` | 13 / 18 | 400 | Helper text, footer |
| `type/label-caps-sm` | 11 / 14 | 700, +8% tracking, UPPER | Chips, section eyebrows |
| `type/button` | 16 / 20 | 800, UPPER | All CTA buttons |

All sizes above are the mobile base. On desktop (≥1024px), bump display tokens by ~1.25× — define a desktop override variable mode in Figma.

### 4.3 Spacing

Mobile screen gutter is clearly 20px (350 inner / 390 outer). Suggest a 4px grid:

| Token | Value |
|---|---|
| `space/0` | 0 |
| `space/1` | 4 |
| `space/2` | 8 |
| `space/3` | 12 |
| `space/4` | 16 |
| `space/5` | 20 *(page gutter)* |
| `space/6` | 24 |
| `space/8` | 32 |
| `space/10` | 40 |
| `space/12` | 48 |
| `space/16` | 64 |

### 4.4 Radius

| Token | Value | Use |
|---|---|---|
| `radius/sm` | 8 | Icon tiles |
| `radius/md` | 12 | Small cards |
| `radius/lg` | 16 | Option cards, CTAs |
| `radius/xl` | 20 | Match cards |
| `radius/full` | 999 | Pills, chips |

### 4.5 Shadow

The signature hard-offset shadow:

| Token | Spec |
|---|---|
| `shadow/stamp-sm` | 0 2 0 0 `brand/ink` |
| `shadow/stamp-md` | 4 4 0 0 `brand/ink` *(default — buttons, cards)* |
| `shadow/stamp-lg` | 6 6 0 0 `brand/ink` *(hero/match cards)* |
| `shadow/soft` | 0 4 12 0 rgba(15,15,16,.08) | for future "lifted" UI if ever needed |

Everything else should be flat.

### 4.6 Motion

Not defined in Figma yet. Propose:

| Token | Value | Use |
|---|---|---|
| `motion/duration/fast` | 120ms | Button press, chip toggle |
| `motion/duration/base` | 220ms | Card state change |
| `motion/duration/slow` | 360ms | Modal, screen transition |
| `motion/easing/standard` | cubic-bezier(.2,.8,.2,1) | Default |
| `motion/easing/playful` | cubic-bezier(.34,1.56,.64,1) | Sticker/highlight entrances |

---

## 5 · Component inventory (what exists today)

### 5.1 Screens present in the file

| # | Screen | Size | Phase relevance |
|---|---|---|---|
| 1 | Start (landing) | 390 × 894 | Phase 1 — entry |
| 2 | Întrebarea 3/10 | 390 × 1202 | Phase 1 — quiz body |
| 3 | Întrebarea 7/12 (mobile) | 427 × 1197 | Phase 1 — duplicate of above? |
| 4 | Întrebarea 7/12 — Desktop | 1280 × 1278 | Phase 1 — responsive |
| 5 | Rezultatul Tău | 390 × 2281 | Phase 1 — magic moment |
| 6 | Creează Profil | 390 × 885 | Phase 2 — capture |
| 7 | Explorator Cariere | 390 × 1543 | Phase 2 — depth |
| 8 | Explorator Cariere — Desktop | 1280 × 1024 | Phase 2 — responsive |
| 9 | Analytics Proiect | 390 × 2213 | Admin — founder dashboard |

**Issues:** two screens named "Întrebarea 7/12" (3 and 4) — confusing. Only 3/10 and 7/12 designed — final count is ambiguous (10 vs 12 questions). "Analytics Proiect" is a founder-facing dashboard mixed into the consumer file; keep it, but move to a separate page.

### 5.2 Components (that should be extracted)

Below is every reusable pattern I can identify. None are Figma components today — all should be extracted.

#### Button

| Variant | Where used | Color | Notes |
|---|---|---|---|
| Primary (purple) | "Începe Testul", "Află mai multe" | `purple-600` bg, `ink` border, white text, stamp-md shadow | Default CTA |
| Secondary (mustard) | "Următoarea Întrebare" | `mustard-500` bg, `ink` border, ink text | Quiz progression |
| Accent (lime) | "Trimite pe WhatsApp" | `lime-500` bg, `ink` border, ink text | Share/viral |
| Ghost (icon-only, top bar) | Back, Settings | transparent, ink icon | Nav |
| Tertiary (outline) | "Adaugă la Shortlist" | white bg, ink border, ink text | Secondary action in lists |

Missing states everywhere: `hover`, `pressed`, `disabled`, `loading`. Sizes needed: `sm`, `md` (default), `lg`.

#### Pill / Chip

| Variant | Use |
|---|---|
| Eyebrow pill | "PENTRU GEN Z", "REZULTAT QUIZ" — mustard bg, ink border, uppercase label |
| Progress chip | "3 din 10" — inline with progress bar |
| Filter chip | "Filter/Chips" in Explorator — selectable, need selected/unselected states |
| Badge | "#1 MATCH" — small, high-emphasis, lime bg |

#### OptionCard (quiz answer)

Observed on Întrebarea 3/10: icon tile + 1–2 line label + large card with thick border + hard shadow. Needs: `default`, `selected`, `hover`, `disabled`. Currently pure visual — no selected state designed.

#### MatchCard (university result)

Observed on Rezultatul Tău: university name heading + field subtitle + "Află mai multe" button + optional "#1 MATCH" badge + optional full-bleed background color (UTCN is yellow).

Variants needed: `rank-1` (featured), `standard`, `alternate-bg`.

#### ProgressBar

Observed on Întrebarea screens: full-width track, lime fill, paired with right-aligned "X din Y" chip, small "MISIUNE ÎN CURS" eyebrow above. Treat as one composite component.

#### BottomNav (mobile)

4 icons: Start / Arhetipuri / Profil / Admin. "Admin" should not be visible to end users — needs a role-gated variant.

#### TopAppBar

Brand wordmark + language toggle (globe icon). Variants observed: with/without back button, with/without settings button.

#### InputField

Observed on Creează Profil: label (uppercase eyebrow), field with thick border, placeholder in italic/muted. Needs: `default`, `focus`, `filled`, `error`, `disabled`. Currently only default visible.

#### Dropdown (Select)

"CLASA" — same border treatment as Input, chevron icon. Closed state only designed; need open/menu states.

#### StatCard (analytics)

"Total Completări", "Rata de Viralitate" — bento-grid pattern on Analytics. Title + big number + trend line (implied). Keep separate from consumer components — this is founder-only.

#### BarChart

Custom CSS bar chart on Analytics. Not a component — treat as a pattern for now.

#### ShareCard

"Vrei să vezi ce sunt și prietenii tăi?" — the WhatsApp share block on Rezultatul. Thick border, purple/ink background, lime CTA. **Critical Phase 1 component — but only one variant exists.** You'll need at least: WhatsApp, Instagram Stories, generic link-copy.

#### FloatingSticker

Rocket + stethoscope on Start screen. Decorative. Define as a component with a `icon` slot + rotation prop so you can reuse across screens.

---

## 6 · Missing components (propose & design)

These are required by your stated Phase 1 objectives — none exist in Figma today.

### 6.1 ChatMessage (Conversational AI UX)

The single most important missing component. Your positioning is "AI conversation, not static quiz" — but the Figma shows a static quiz with radio-style option cards. You need:

| Variant | Spec |
|---|---|
| `bot-message` | Left-aligned, off-white bubble, thick border, ink text, optional "typing…" loader |
| `user-message` | Right-aligned, purple bubble, white text, thick border |
| `user-quick-replies` | Horizontal chip row under bot message |
| `bot-rich-card` | Bot message embedding a MatchCard or image |
| `ai-thinking` | Three-dot loader with "Mă gândesc…" label |

Without this, Phase 1 differentiation (vs Cognitrom's static PDFs) doesn't land.

### 6.2 ParentView (Parent Involvement Layer)

Another stated objective, invisible in Figma today. Propose:

| Component | Spec |
|---|---|
| `ParentInviteCard` | On Rezultatul, alongside WhatsApp share: "Arată-i părintelui ce ai descoperit" + QR/link |
| `ParentLandingHeader` | When a parent opens a student's shared link, different top bar: "Rezultatul lui Maria, 17 ani" |
| `ParentExplainer` | Plain-language expansion of each match (different tone from student copy) |
| `ParentCTA` | "Discută cu Maria despre asta" — suggested conversation starters |

### 6.3 ShareCard (social output — the viral loop)

One exists but only for WhatsApp. Phase 1 viral loop needs:

| Variant | Spec |
|---|---|
| `story-vertical` | 1080×1920 — Instagram/TikTok Story export |
| `square-post` | 1080×1080 — Instagram feed |
| `whatsapp-preview` | 1200×630 — OG image for link |
| `copy-text` | Pre-written share caption, with emoji + site link |

Each should feature the archetype name + visual + one-line tagline. This is where you win attention at zero CAC.

### 6.4 Minor gaps

- **EmptyState** — "Nu ai salvat încă nicio facultate"
- **Toast / Snackbar** — confirmation feedback ("Salvat în shortlist")
- **Modal / Bottom Sheet** — no modal pattern exists; you'll need one for filters and parent-invite
- **LoadingState** — for AI thinking and first-match reveal
- **ErrorState** — what if the AI call fails?
- **LanguageSwitcher** (beyond the globe icon) — if i18n matters for Phase 1+

---

## 7 · Alignment with CeSaFiu objectives

### Viral free quiz (Phase 1) — 60% covered

| Component needed | Present? |
|---|---|
| Landing screen with social proof | ✅ |
| Quiz question screen with progress | ✅ |
| Result screen with match cards | ✅ |
| **Share card variants (IG, story, WA)** | ❌ — only WA |
| **Referral tracking UX** | ⚠️ footer only |
| Empty/loading/error states | ❌ |

### Conversational AI UX — 10% covered

| Component needed | Present? |
|---|---|
| ChatMessage (bot/user bubbles) | ❌ |
| Quick-reply chips | ⚠️ could repurpose OptionCard |
| AI typing / streaming state | ❌ |
| Rich-card in chat (match inside bubble) | ❌ |

**This is the biggest gap.** The quiz currently reads as a slicker Cognitrom — not as an AI product. If you keep the radio-card UX, you're competing on aesthetics, not positioning.

### Parent involvement layer — 0% covered

| Component needed | Present? |
|---|---|
| Parent invite from result screen | ❌ |
| Parent-specific landing | ❌ |
| Parent-tone explainer | ❌ |
| Family conversation starters | ❌ |

Consider: is this a Phase 1 objective or Phase 2? Be honest — if it's Phase 2, deprioritize now. If it's Phase 1, block out screens this sprint.

---

## 8 · Priority next steps (6-week plan)

### Week 1 — Decisions + cleanup
- Pick brand name (§2)
- Remove 6 of 7 community libraries from file
- Create `_tokens` page with color/type/spacing/radius/shadow variables
- Rename the duplicate "Întrebarea 7/12" frames to disambiguate

### Week 2 — Componentize what exists
- Extract Button (5 variants × 4 states × 3 sizes)
- Extract Pill, ProgressBar, BottomNav, TopAppBar
- Extract OptionCard, MatchCard, InputField, Dropdown
- Apply tokens retroactively to existing 9 screens

### Week 3 — Close Phase 1 gaps
- Design 3 new ShareCard variants (story, square, WA preview)
- Design EmptyState, Toast, Modal/Bottom Sheet

### Week 4 — Conversational AI UX
- Design ChatMessage component family
- Redesign Întrebarea screens as chat flow (or keep both options — A/B-testable)
- AI thinking + error states

### Week 5 — Parent layer (if Phase 1)
- ParentInviteCard on result
- ParentLanding screen
- Copy system for parent-tone variants

### Week 6 — Responsive + handoff
- Desktop variants for all Phase 1 flows (currently only 2 exist)
- Accessibility pass: contrast check on lime/mustard, focus states, touch targets
- Export a tokens.json from Figma variables for dev handoff

---

## 9 · Open questions (decide before Week 1)

1. **Brand name** — Ce Să Fiu? or Viitorul Tău? (See §2.)
2. **Quiz length** — 10 questions or 12? Current mockups disagree.
3. **Admin tab in bottom nav** — ship hidden (role-gated) or move to separate URL/app entirely?
4. **"Arhetipuri" tab** — second nav tab exists but no screen designed. What goes here?
5. **AI-conversation vs radio-card quiz** — commit to one as the default; the other becomes an A/B test only.
6. **Font commitment** — pick display + body family; current file uses default fallback in places.
7. **Parent layer priority** — Phase 1 or Phase 2?
8. **Analytics screen** — separate file or gate inside the same app?

---

## 10 · Appendix

### 10.1 Figma file facts (as of 2026-04-22)

- File key: `x0UkMlH4pjh9fjsd2DLtFK`
- Pages: 1 ("Page 1" — rename this)
- Top-level frames: 9
- Components / component sets: **0**
- Nested frames: 560
- Text nodes: 197
- Vector (icon) nodes: 83
- Attached libraries: 7 (Material 3, Simple DS, iOS 18, iOS 26, iPadOS, macOS 26, watchOS 26, visionOS 26) — remove 6 of them

### 10.2 What I verified vs what I inferred

- **Verified in Figma:** file structure, frame hierarchy, screen names, RO copy, layout dimensions, attached libraries, absence of components.
- **Screenshotted (verified visually):** Start, Întrebarea 3/10, Rezultatul Tău.
- **Inferred from metadata only (not screenshot-verified):** Analytics Proiect, Creează Profil, Explorator Cariere, Întrebarea 7/12 — structural claims are accurate; exact visual details may vary.
- **Inferred / approximated:** exact hex values (screenshots, not variables), exact font family (not pulled — needs verification), exact stroke widths, exact shadow offsets.
- **Could not pull:** Figma Variables / tokens — the get_variable_defs call needs an active desktop selection, not possible over MCP. Hit the Starter-plan MCP call limit after 3 screenshots, so deeper inspection stopped there.

### 10.3 How to use this doc

Keep it version-controlled next to the Figma file. When you make a design-system decision, update the relevant section and bump the version at the top. When you add a new component, add a row to §5 and — if it's novel — §6. Review §7 quarterly: the alignment score is the cheapest way to notice that your Figma has drifted from your strategy.

---

*Authored against Figma state as of 2026-04-22. Next review recommended after Week 2 componentization pass.*
