# Explore Redesign — Implementation Plan

**Date:** 2026-07-03
**Source of truth:** claude.ai/design project `16f2e080` (`screens/browse.jsx` + `app.jsx`), verified byte-identical with the local export `CeSaFiu Prototype (standalone).html` (2026-07-03).
**Decisions (Adi, 2026-07-03):** collections replace the Worlds filter entirely; first pass ships Hub + Cariere; Instituții and Trasee follow in a second pass. PathDetail full-screen is deferred.

---

## 1. What the design proposes

Hub-first IA (Encoura-style). `/browse` opens on a **hub** with three large cards — Instituții, Cariere, Trasee — each showing item count and saved count, drilling into a section with a ← back-to-hub button.

- **Cariere:** search + a single "colecții" chip rail: Toate · ✨ Potrivite · 💰 Bine plătite · 🔥 În cerere · Fără facultate · Creative · ♥ Salvate. Match % badge on cards; Potrivite sorts by score, caps at 12.
- **Instituții:** search-first + tabs **Toate / ✨ Potrivite / ♥ Salvate** + city rail. "Potrivite" = institutions hosting programs linked to the user's top-3 match careers, with the matching program shown as a reason chip.
- **Trasee:** same card list; full-screen PathDetail with single-choice "Alege acest traseu" CTA (deferred — current inline expand + savePath already covers the behavior).
- Empty states designed for no-test ("Dă un test întâi") and no-saves — consistent with the one-path UX principle.

## 2. Data model fit — verdict: implementable, zero schema changes

The prototype's `QUIZ_DATA` schema is a strict subset of production. Field-for-field: prototype `careers` = `data/careers.json`, `universities` = `data/institutions.json`, `programs` = `data/programs.json`, `paths` = `data/paths.json`. Production only has more rows (184/163/357/6).

| Design need | Production support |
|---|---|
| Hub counts + saved counts | careers/institutions/paths arrays; `quiz-store.savedCareerIds`, `uni-store.savedUniIds`, authGate `savedPath` |
| ✨ Potrivite (careers) | `POST /api/match` from localStorage test results (same call rezultate uses) |
| ✨ Potrivite (institutions) | top-3 career ids → `programs[].careerIds` → `universityId` (357 programs have careerIds) |
| ♥ Salvate tabs | existing stores, Supabase-synced for careers/path |
| 💰 Bine plătite | ⚠ derive — `salary` is free text ("Junior: 1.200 — 2.500 €/lună · …"). Prototype regexes it in-component; we derive `salaryMaxEur` once instead |
| 🔥 În cerere | ⚠ derive — `demand` free text but low-cardinality (Extremă/Foarte mare/În creștere/…) → `demandLevel` enum |
| Fără facultate | `pathType ∈ {autodidact, profesional, creator, freelance, antreprenor}` (~77 careers; prototype also lists `postliceala`, which no career uses — drop) |
| Creative | `riasec` includes `A` |

Real gaps are all presentation-layer: derived fields, a shared match hook, i18n strings, and the worlds→collections migration below.

## 3. Worlds → collections migration

Careers tab currently filters by Worlds (Archetypes V2) + pathType. Both chip rails are replaced by the collections rail.

- `rezultate/results-client.tsx:555` links `/browse?world=<id>` from world chips. Keep `?world=` working: when present, apply it as a hidden `CAREER_WORLDS` filter shown as one dismissible chip ("Lumea: ⚖ Lege & Cetate ✕") above the collections rail. No dead links, no second permanent rail.
- `CAREER_WORLDS` / `WORLDS` stay untouched (results page still uses them).

## 4. Phases

### M0 — Foundation (no UI change)
- `lib/careers/collections.ts`: derive `salaryMaxEur` + `demandLevel`; collection predicates (`paid`, `demand`, `nodegree`, `creative`); unit tests incl. "Variabil — depinde de impact" salary (excluded from paid).
- `lib/results/use-matches.ts`: shared hook — reads stored results, POSTs `/api/match`, caches per session (avoid double-fetch between rezultate and browse). Returns `null` cleanly when no tests taken.
- i18n keys in `messages/ro.json` + `en.json` (hub cards, collections, empty states).

### M1 — Hub + Cariere (this pass)
- `browse-client.tsx`: hub landing (3 cards, counts, saved badges), default section `hub`; `?section=careers|paths|unis` deep links still land directly; bottom-nav Explorează resets to hub.
- Careers section: collections rail replaces Worlds+pathType rails; match % badge; Potrivite sorted desc, cap 12; Salvate via `savedCareerIds`; hidden `?world=` chip (§3).
- Umami: `browse_hub_card {id}`, `browse_collection {id}` per existing event schema.

### M2 — Instituții + Trasee (second pass)
- Instituții: Toate/Potrivite/Salvate tabs + match-reason program chip. **Keep** current program-aware diacritics-insensitive search (superior to prototype's name-only search).
- Trasee: cosmetic alignment only; inline expand stays.

### M3 — Optional, deferred
- Full-screen PathDetail with "Alege acest traseu" CTA.

## 5. Verification
- Vitest: collection predicates, salary parser, matched-unis derivation, `?world=` compat.
- Manual QA: no-test user (empty Potrivite states), test-taken user, saved flows, deep links from rezultate, dark mode, RO/EN.
- No commit/push/deploy until explicitly requested.
