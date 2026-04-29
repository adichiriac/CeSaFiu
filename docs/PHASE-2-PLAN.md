# Phase 2 — Production Rebuild Plan

*Status: planning doc, not started.  Drafted: 2026-04-29.  Owner: Adi.*

This is the load-bearing document for the Phase 2 rebuild. The prototype (`cesafiu_prototype_v1/`) and live closed-circle preview (`/phase1.html`) stay running while this is built; cutover happens at end of Phase 2.

If you're a future session reading this: this is the source of truth for what we're building. Updates to this doc are how decisions get made — don't re-litigate elsewhere.

---

## 1. Goal

Ship a real, deployable application that:

1. **Doesn't feel like a mock** — fast, native-feeling, no `?v=phase1` cache-busting, no Babel-in-browser slow first load.
2. **Captures profiles** — anonymous-first save flow, then progressive auth (Google / Apple / magic link), with proper EU minor consent.
3. **Protects the data IP** — career→program→faculty mapping + scoring weights stay server-side. Public surface only sees what's safe to share.
4. **Is built on the right foundation for Phase 3** — B2B partner ranking, parent companion view, paid report engine all plug in without rewrites.

### Success metrics for "Phase 2 done"

- Closed-circle testers from Phase 1 migrate to the new app without losing saved data.
- New users can complete: quiz → IPIP-NEO-60 → save 3 careers → create profile → confirm email (parent-confirmed if minor).
- Paid intent capture continues with `paid_report_19eur` flag pointing at the new backend (not Formspree).
- Privacy policy + DPIA + consent banner are in place. Romanian DP authority (ANSPDCP) notification status confirmed (notify if required).
- Lighthouse scores ≥ 90 on Performance, Accessibility, Best Practices, SEO.

### Out of scope for Phase 2

- Paid report engine (manual fulfillment continues — Phase 3).
- Parent companion full UX (just the consent flow — full parent surface is Phase 3).
- B2B partner ranking (Phase 3).
- "Drumul tău" milestone module (Phase 3).
- i18n (RO only at launch — Moldova adds in Phase 2.5 if signal warrants).

---

## 2. Stack — locked-in choices

Updated 2026-04-29 after revisiting in light of (a) i18n-from-day-one requirement and (b) viral share-card SEO need. Switched frontend from Vite → Next.js for SSR + native i18n routing.

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **Next.js 15 (App Router) + React 19 + TypeScript** | RSC-friendly for SEO + share-card unfurls; first-class i18n via `next-intl` with `app/[locale]/...` routing; same dev DX as Vite once you're in it |
| i18n library | **next-intl** | De-facto standard for Next App Router. Type-safe message keys, ICU plural/gender handling (matters for Romanian grammar), per-locale routing |
| State (client) | **Zustand** with `persist` middleware | Minimal, persists to localStorage out-of-box, no Redux ceremony |
| State (server) | **Server Components** + Supabase server client | Less to manage; data fetching co-located with the rendering |
| Styling | **CSS Modules** + existing design tokens from `cesafiu_prototype_v1/project/styles.css` | Don't introduce Tailwind/CSS-in-JS just to migrate; the neobrutalist design system is small (~10KB) and bespoke |
| Forms | **React Hook Form + Zod** | Type-safe validation, plays nice with auth + parent-consent flows |
| Backend | **Supabase (EU region — Frankfurt)** | Postgres + Auth + RLS + Edge Functions in one product; free tier covers 50k MAU; EU region = GDPR posture |
| Server-side compute | **Next.js Server Actions + Route Handlers (Edge runtime)** for most server logic; Supabase Edge Functions only for webhooks/cron | Fewer hops, simpler deployment. Reserved Supabase Edge Functions for things that must run outside Next context (e.g., Stripe webhooks later) |
| Hosting (frontend) | **Vercel (Frankfurt region)** | Hobby tier free, edge CDN, EU region for data residency, automatic PR previews |
| Email (transactional) | **Resend** | EU-friendly (Frankfurt), much better deliverability than Supabase's built-in SMTP, low cost, react-email templates |
| Domain | **cesafiu.ro** *(verify status — Adi to confirm)* | Owned, primary brand. `encourage.ro` is dropped. |
| Analytics | **Umami (existing Railway instance)** + **Vercel Web Analytics** for Core Web Vitals | Already running; just point new events at it. Move recorder OFF for under-16 users (see §6). |
| Error tracking | **Sentry (free tier)** | Frontend + server side; needed before any growth push |

### Alternative stacks considered (and why not)

- **Vite + React + TypeScript** — my original pick. Lighter bundle, faster dev loop. Lost to Next.js because share-card unfurls need server-side rendering, and `next-intl` is materially nicer than the Vite + i18next combo for App Router-style routing.
- **Remix** — similar mental model to Next via loaders/actions. Smaller community, less ecosystem (i18n libraries less mature). Tied with Next on technical merits; Next wins on momentum.
- **SvelteKit** — smaller bundles, simpler reactivity. Loses on ecosystem maturity for our specific needs (auth helpers for Supabase, i18n libraries, hire-ability).
- **Astro + interactive islands** — best for content-heavy. We're app-heavy. Wrong shape.
- **Solid.js / Solid Start** — fast, but ecosystem too young for Apple Sign-In + Supabase + i18n combo.
- **Cloudflare Pages + Workers + D1** — entirely Cloudflare. Cheap, fast, EU-friendly. Loses on managed auth (would have to build) and D1 being SQLite (limited Postgres features we'd want for `jsonb` translation fields). Stick with Supabase.
- **Firebase** — Google ecosystem, good auth, but EU data residency is murky vs. Supabase EU region's clear posture.
- **Convex** — type-safe, dev-friendly. Loses on EU data residency clarity and ecosystem maturity.

### What we are deliberately *not* using

- **Tailwind** — would force a re-do of the design system. CSS Modules + existing tokens preserve the neobrutalist look.
- **Redux / Redux Toolkit** — overkill for this app's state shape; Zustand covers it.
- **tRPC** — adds a layer; Supabase client + Server Actions cover the same ground with less ceremony.

## 2.1 i18n strategy — architected from day 1, RO-only at launch

Even though we ship Romanian only initially, the architecture supports adding locales as a configuration change, not a refactor.

### Routing

`app/[locale]/...` structure. Default locale is `ro`. URL examples:
- `/ro/quiz`, `/ro/career/asistent-medical`
- Future: `/hu/quiz`, `/en/quiz` (when launched)

`next-intl`'s middleware handles locale detection from URL + Accept-Language headers + persisted cookie. Default redirects from `/quiz` → `/ro/quiz`.

### UI strings

In `apps/web/messages/`:

```
messages/
  ro.json             # primary, fully translated
  hu.json             # placeholder, copies of ro.json — fill later
  en.json             # placeholder, copies of ro.json — fill later
```

Components consume via:

```tsx
import { useTranslations } from 'next-intl';
const t = useTranslations('quiz');
// <h1>{t('title')}</h1>
```

Discipline: **never hardcode user-facing strings in components**. Even at v1 RO-only, every visible string lives in `messages/ro.json`. This is the load-bearing constraint that lets us add HU later as a translation pass, not a code change.

### Database content (translatable fields)

Earlier (`docs/DATA-ARCHITECTURE.md`) we decided: per-record JSONB for v2 (RO + Moldova), separate tables for v3 (HU + EN at scale).

**Updated decision (2026-04-29):** since we want HU/EN-ready architecture from day 1, use JSONB everywhere from the start. Separate translation tables remain a future migration option only if record counts get into the hundreds of thousands (not in scope for years).

Schema convention for translatable text:

```sql
-- Instead of: name text not null
-- Use: name jsonb not null
-- Where the value is { "ro": "Asistent Medical Generalist", "hu": null, "en": null }
```

Helper SQL function for fallback chain:

```sql
create function tr(field jsonb, locale text) returns text as $$
  select coalesce(field->>locale, field->>'ro', field->>'en');
$$ language sql immutable;

-- Used: select tr(name, 'hu') from careers where id = '...';
```

App fetches with the locale parameter and `tr()` resolves. Missing translations transparently fall back to RO.

### Translation status tracking

Every translatable record has `translation_status jsonb` with shape:

```json
{ "ro": "complete", "en": "missing" }
```

Possible values per locale:
- `"complete"` — translated and reviewed (or original RO content)
- `"missing"` — null in the JSONB, fallback to RO via `tr()` helper
- `"llm-draft"` — auto-translated by LLM, not yet human-reviewed
- `"in-review"` — under human review
- `"complete"` — passes review

A small admin page (Phase 2.5) shows "X programs missing EN translation" so the gap is visible. Built into `scripts/check-data-freshness.js` as a second pass.

### LLM-automatic translation pipeline

**Decided 2026-04-29:** translations are auto-generated via LLM (Anthropic Claude), triggered manually by Adi when a new locale is being added. Not a continuous background job — explicit one-shot per locale.

**Trigger:**

```bash
pnpm translate --locale=en
# or per-domain:
pnpm translate --locale=en --scope=ui     # messages/*.json only
pnpm translate --locale=en --scope=db     # database content only
pnpm translate --locale=en --scope=db --table=careers
```

**Pipeline shape (`scripts/translate.ts`):**

1. **Discovery:** read records where `translation_status.<locale>` is `"missing"` (or null), plus UI message keys missing in `messages/<locale>.json`.
2. **Glossary load:** `scripts/translation-glossary.json` holds proper-noun preservation rules — terms that must NOT be translated:
   - `RIASEC`, `IPIP-NEO-60`, `Big Five`, `Holland Code`, `O*NET`
   - All proper nouns: institution names (`UMF Carol Davila`, `Politehnica București`), program names where they have an official Latin/RO name
   - Career IDs and other slugs (never translated)
3. **Style guide load:** `scripts/translation-style-en.md` (one per target locale) tells the LLM:
   - Target audience: 14-19yo Romanian teens, but reading in English
   - Tone: direct, slightly cheeky, never patronizing — same register as the existing RO copy ("Nu vorbi cu mama, vorbește cu tine.")
   - Length budget: ≤ source length × 1.25 (English is usually denser; we don't blow up the layout)
   - What to keep verbatim (per glossary)
4. **Batch call to Claude:** items chunked (e.g., 50 at a time) to stay under context limits and to allow partial recovery on failure.
5. **Write-back:** UPDATE the JSONB column setting `<locale>` value, set `translation_status.<locale> = "llm-draft"`. Same for `messages/<locale>.json`.
6. **Diff report:** outputs `scripts/translate-output/<locale>-<timestamp>.diff` showing every translation generated, sorted by item type. Adi reviews the diff before pushing.
7. **Promotion to "complete":** a separate command flips `llm-draft` → `complete` after human review (or sample-review if Adi accepts the LLM output as-is).

**Idempotency:** the script never overwrites `"complete"` translations. Only fills `"missing"` or re-translates `"llm-draft"` if explicitly told (`--force-redraft`).

**What is NOT auto-translated (human-only):**

- `docs/PRIVACY-POLICY.md` — legal text, mistranslation = legal exposure
- `docs/DPIA.md` — same
- Parent consent email body — sets the tone for the most important touch with parents
- Auth flow emails (magic link, password reset) — short, high-trust, do them by hand
- Terms of Service when we have one

These get a separate human-translated version per locale. The LLM pipeline skips them by file glob.

**Cost estimate:**

- Total RO content: ~40K words (UI messages + careers + programs + institutions notes + IPIP items)
- Claude Sonnet at translation-quality settings: ~$8-15 per full pass
- Run cost is negligible relative to the value of EN reach. Don't over-engineer.

**What lives in the repo for next session to pick up:**

- `scripts/translate.ts` — the runner
- `scripts/translation-glossary.json` — preserved terms
- `scripts/translation-style-<locale>.md` — per-locale style guide
- `scripts/prompts/translate-<scope>.md` — the actual prompt template

Build this in M7 (post-launch polish), not earlier — RO-only at v1, EN comes when Adi calls for it.

### What's NOT in scope at v1

- Right-to-left languages (Arabic, Hebrew). Add when needed.
- Number/date formatting per locale beyond what `next-intl` does out-of-box.
- Currency formatting (we only quote in EUR for now).
- Translated error messages from Supabase / Sentry — RO-only at v1.

---

## 3. Repo structure

Single repo. The current `cesafiu_prototype_v1/` directory stays as historical artifact; new work lives at root.

```
CeSaFiu/
├── README.md
├── ROADMAP.md                              # high-level roadmap (existing, keep updated)
├── docs/
│   ├── DATA-ARCHITECTURE.md                # entity model — read first
│   ├── PSYCHOMETRICS.md                    # legal/instrument position
│   ├── CONTRIBUTING-DATA.md                # how to add programs
│   ├── PHASE-2-PLAN.md                     # this doc
│   ├── PRIVACY-POLICY.md                   # canonical RO + EN privacy text
│   └── DPIA.md                             # data protection impact assessment
├── apps/
│   └── web/                                # Next.js 15 + TS app
│       ├── app/
│       │   ├── [locale]/                   # all user-facing routes nest under locale
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx                # home / welcome
│       │   │   ├── quiz/page.tsx
│       │   │   ├── personality/page.tsx
│       │   │   ├── ipip-neo/page.tsx
│       │   │   ├── vocational/page.tsx
│       │   │   ├── results/page.tsx
│       │   │   ├── results/[runId]/page.tsx        # share-card-friendly individual run
│       │   │   ├── career/[id]/page.tsx
│       │   │   ├── browse/page.tsx
│       │   │   ├── browse/uni/[id]/page.tsx
│       │   │   ├── profile/page.tsx
│       │   │   ├── parent-consent/page.tsx
│       │   │   ├── settings/page.tsx
│       │   │   └── share/[runId]/og.png/route.ts   # OpenGraph image generation
│       │   ├── api/
│       │   │   ├── score/route.ts          # POST quiz answers → matches (server)
│       │   │   ├── auth/                   # Supabase auth callback handlers
│       │   │   └── consent/route.ts        # parent consent token validation
│       │   └── globals.css
│       ├── components/                     # ported from cesafiu_prototype_v1/project/screens/
│       ├── lib/                            # matcher, scoring, supabase clients
│       │   ├── matcher.ts                  # ported from app.jsx computeMatches
│       │   ├── supabase/
│       │   │   ├── client.ts               # browser client
│       │   │   ├── server.ts               # server-component client
│       │   │   └── service.ts              # service-role client (server-only)
│       │   └── types.ts                    # shared types
│       ├── stores/                         # Zustand stores (anonymous saves, etc.)
│       ├── messages/
│       │   ├── ro.json                     # primary
│       │   ├── hu.json                     # placeholder (mirror of ro.json)
│       │   └── en.json                     # placeholder (mirror of ro.json)
│       ├── i18n.ts                         # next-intl config
│       ├── middleware.ts                   # next-intl locale routing + auth
│       ├── public/
│       └── package.json
├── supabase/
│   ├── migrations/                         # SQL migrations (versioned, in git)
│   ├── functions/                          # Edge Functions — only for webhooks/cron
│   │   ├── send-parent-consent-email/
│   │   └── _shared/
│   ├── seed/                               # SQL seed files (careers, programs, institutions)
│   │   ├── 01_careers.sql
│   │   ├── 02_institutions.sql
│   │   ├── 03_programs.sql
│   │   ├── 04_quiz_versions.sql
│   │   └── 05_personality_versions.sql
│   └── config.toml
├── scripts/
│   ├── check-data-freshness.js             # existing
│   ├── migrate-prototype-data.ts           # one-off: convert data.js → SQL seeds with jsonb names
│   └── translation-status.ts               # reports missing translations per locale
├── cesafiu_prototype_v1/                   # KEEP — historical, used by /phase1.html
└── phase1.html                             # KEEP during transition; redirect after cutover
```

Decision: monorepo with pnpm workspaces only if we add a second app (admin, etc.) later. For now, single `apps/web/` is fine. Future admin app would go to `apps/admin/`.

---

## 4. Data model — full schema

This is the canonical Postgres schema. Migrations live in `supabase/migrations/` versioned by timestamp.

**Key convention:** every user-facing text field is `jsonb` containing a per-locale map (`{ "ro": "...", "hu": null, "en": null }`). At v1 only `ro` is filled; HU/EN are added later as translation passes without schema changes. Use the `tr(field, locale)` helper to resolve.

### Core entities (read from the public site)

```sql
-- Helper: locale-aware text resolution with fallback to ro/en
create function tr(field jsonb, locale text default 'ro') returns text as $$
  select coalesce(field->>locale, field->>'ro', field->>'en');
$$ language sql immutable;

-- Slug-style IDs as primary keys (matches DATA-ARCHITECTURE.md)
create table careers (
  id              text primary key,
  name            jsonb not null,            -- { "ro": "...", "hu": null, "en": null }
  tagline         jsonb,                     -- translatable
  path_type       text not null,             -- enum-like, validated in API
  riasec          text[] not null default '{}',
  big5            text[] not null default '{}',
  traits          text[] not null default '{}',
  salary_text     jsonb,                     -- translatable (RO + UE comparison)
  demand          jsonb,                     -- translatable
  vibe            jsonb,                     -- translatable
  description     jsonb,                     -- translatable
  day_in_life     jsonb default '[]',        -- array of translatable strings: [{"ro":"...","hu":null}, ...]
  skills          jsonb default '[]',        -- same shape
  color           text,                      -- not translatable
  emoji           text,                      -- not translatable
  translation_status jsonb default '{"ro":"complete"}',
  last_reviewed   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table institutions (
  id              text primary key,
  name            jsonb not null,            -- translatable
  city            text,                      -- city names are proper nouns; not translated
  cities          text[] default '{}',
  tier            text,
  kind            text,
  url             text,
  tags            text[] default '{}',
  notes           jsonb,                     -- translatable
  translation_status jsonb default '{"ro":"complete"}',
  last_reviewed   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table programs (
  id              text primary key,
  name            jsonb not null,            -- translatable
  name_official   jsonb,                     -- translatable, often verbatim from institution
  university_id   text not null references institutions(id),
  path_type       text not null,
  duration        jsonb,                     -- translatable ("3 ani", "3 years")
  duration_years  numeric,
  language        text[] default '{ro}',     -- which languages the program is taught in (RO/EN/HU/etc.)
  url             text,
  riasec          text[] default '{}',
  tags            text[] default '{}',
  notes           jsonb,                     -- translatable
  admission       jsonb,                     -- { exam: {ro,hu,en}, deadline, lastYearMin, ... }
  tuition         jsonb,                     -- { state, statePaid, private }
  translation_status jsonb default '{"ro":"complete"}',
  last_reviewed   date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table program_career (
  program_id      text not null references programs(id),
  career_id       text not null references careers(id),
  primary key (program_id, career_id)
);

create index idx_programs_university on programs(university_id);
create index idx_programs_path_type on programs(path_type);
create index idx_program_career_career on program_career(career_id);

-- For querying by translated name (e.g., career name search):
create index idx_careers_name_ro on careers using gin ((name->>'ro') gin_trgm_ops);
```

**Read pattern from app:**

```sql
-- Career detail with locale fallback chain
select id, tr(name, 'ro') as name, tr(tagline, 'ro') as tagline, ...
from careers where id = $1;
```

**Convenience view** for the most common case (current locale):

```sql
create view careers_localized_ro as
  select id, tr(name, 'ro') as name, tr(tagline, 'ro') as tagline,
         tr(description, 'ro') as description, path_type, riasec, ...
  from careers;
```

Generate one view per supported locale at launch. Add `careers_localized_hu` etc. when adding locales.

### Quiz / scoring (versioned)

```sql
create table quiz_versions (
  id              serial primary key,       -- v1, v2, ...
  name            text not null,            -- 'A: scenarii reale', 'B: triplu-lens', etc.
  questions       jsonb not null,           -- full snapshot of the quiz content at this version
  scoring_config  jsonb not null,           -- weights, thresholds, MMR lambda
  released_at     timestamptz not null default now(),
  retired_at      timestamptz                -- null = current
);

create table quiz_runs (
  id                bigserial primary key,
  user_id           uuid references auth.users(id) on delete cascade,
  anonymous_id      text,                   -- localStorage UUID before auth
  quiz_version_id   int not null references quiz_versions(id),
  scoring_version   text not null,          -- 'cosine-mmr-v1' etc.
  answers           jsonb not null,
  scores            jsonb not null,         -- the full computeMatches output
  created_at        timestamptz not null default now()
);

-- Same for ipip-neo-60 and vocational
create table personality_runs (
  id                bigserial primary key,
  user_id           uuid references auth.users(id) on delete cascade,
  anonymous_id      text,
  test_type         text not null,          -- 'personality-15' | 'ipip-neo-60'
  test_version      text not null,
  responses         jsonb not null,
  scores            jsonb not null,         -- { O, C, E, A, N }
  created_at        timestamptz not null default now()
);

create table vocational_runs (
  id                bigserial primary key,
  user_id           uuid references auth.users(id) on delete cascade,
  anonymous_id      text,
  test_version      text not null,
  picks             jsonb not null,
  scores            jsonb not null,         -- top RIASEC + raw scores
  created_at        timestamptz not null default now()
);
```

### User state (RLS-protected)

```sql
-- Auth.users is provided by Supabase Auth — we extend with profile state
create table profiles (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  display_name      text,
  age_band          text not null,          -- '14-15' | '16-17' | '18+' | 'adult'
  consent_status    text not null default 'self',  -- 'self' | 'pending_parent' | 'parent_confirmed' | 'revoked'
  parent_email_hash text,                   -- hashed for retrieval, never stored cleartext
  parent_email_enc  text,                   -- encrypted for sending consent emails (use Vault)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- RLS: a profile row is only readable/writable by its owner.
alter table profiles enable row level security;
create policy profiles_self_read on profiles for select using (auth.uid() = user_id);
create policy profiles_self_write on profiles for update using (auth.uid() = user_id);

create table saved_careers (
  user_id           uuid not null references auth.users(id) on delete cascade,
  career_id         text not null references careers(id),
  source_run_id     bigint references quiz_runs(id),
  created_at        timestamptz not null default now(),
  primary key (user_id, career_id)
);

create table saved_programs (
  user_id           uuid not null references auth.users(id) on delete cascade,
  program_id        text not null references programs(id),
  career_id         text references careers(id),
  created_at        timestamptz not null default now(),
  primary key (user_id, program_id)
);

alter table saved_careers enable row level security;
alter table saved_programs enable row level security;
create policy saved_careers_self on saved_careers for all using (auth.uid() = user_id);
create policy saved_programs_self on saved_programs for all using (auth.uid() = user_id);
```

### Parent consent (audited)

```sql
create table parent_consent_tokens (
  token             text primary key,        -- random 256-bit, URL-safe
  child_user_id     uuid not null references auth.users(id) on delete cascade,
  parent_email_hash text not null,
  expires_at        timestamptz not null,
  used_at           timestamptz,
  created_at        timestamptz not null default now()
);

create table consent_records (
  id                bigserial primary key,
  user_id           uuid references auth.users(id) on delete set null,  -- nullable + set null on erasure: row survives as pseudonymous evidence
  event             text not null,           -- 'self_consent' | 'parent_consent_requested' | 'parent_confirmed' | 'parent_revoked' | 'erasure_requested' | 'erasure_completed'
  metadata          jsonb,
  ip_address_hash   text,                    -- hashed for audit, never cleartext
  user_agent_hash   text,
  created_at        timestamptz not null default now()
);

-- Retention policy on consent_records (enforced via scheduled cleanup, not FK):
--   * On user account deletion: user_id is nulled (FK = on delete set null), row survives.
--   * Pseudonymised rows are hard-deleted after 3 years from created_at (Romanian civil
--     limitation period, Law 287/2009 Art. 2517 — pending lawyer confirmation in M0).
--   * Cleanup runs as a Supabase scheduled Edge Function nightly.
```

### Paid intent (migrated from Formspree)

```sql
create table paid_intents (
  id                bigserial primary key,
  user_id           uuid references auth.users(id) on delete set null,
  anonymous_id      text,
  email             text not null,
  context           text not null,           -- 'quick-quiz' | 'personality-test' | 'vocational-test' | 'ipip-neo-60'
  summary           text,
  surface           text,
  agreed_to_terms   boolean not null default false,
  created_at        timestamptz not null default now()
);
```

### Migrations strategy

Use Supabase CLI's migration system. Every change is a versioned SQL file. No manual edits to live DB.

Seed data in `supabase/seed/` — committed to git, applied via `supabase db reset` in dev. For prod, seeds are loaded once at first deploy and never auto-rerun.

---

## 5. Privacy & legal scaffolding — DO THIS FIRST

Before any user-facing feature with personal data is built, these have to exist. Treat as M0.

### 5.1 Privacy Policy (`docs/PRIVACY-POLICY.md`)

Short, plain-RO, child-friendly. Sections:
- Ce date colectăm și de ce
- Cum stocăm datele (Supabase EU, criptat)
- Cu cine partajăm (nimeni — niciun share către terți pentru marketing)
- Drepturile tale: acces, rectificare, ștergere, portabilitate, opoziție, retragere consimțământ
- Pentru minori sub 16 ani: rolul părintelui
- Contact pentru DPO + ANSPDCP
- Data ultimei actualizări

Mirror the same content in EN for international visitors.

### 5.2 Data Protection Impact Assessment (`docs/DPIA.md`)

Mandatory under GDPR Art. 35 because we process minor data systematically. Sections:
- Data flows (what's collected, where stored, who accesses)
- Necessity & proportionality
- Risks identified (re-identification of teens, parent-bypass, profile drift)
- Mitigations (RLS, hashing, retention policies, opt-outs)
- Sign-off (Adi, with note "to be reviewed by RO privacy lawyer before public launch")

### 5.3 ANSPDCP notification check

Romanian Data Protection Authority. Determine if our processing requires:
- Notification of processing (Art. 22 of RO Law 190/2018) — likely no for online services with proper privacy notice
- Appointment of a DPO — required if processing minors at scale, ambiguous threshold for our size

**Action:** consult an RO privacy lawyer in M0. Don't ship without this clarity.

### 5.4 Consent banner

Required before any non-essential analytics fires. Use a minimal banner with three buttons:
- Acceptă tot (analytics + replay)
- Doar esențial (no analytics)
- Personalizează (granular toggles)

Persist in localStorage. Re-prompt yearly. **Replay is OFF by default** — only enabled if user accepts and is 16+.

### 5.5 Right-to-erasure & data subject access (Art. 15, 17)

- Settings → Account → Șterge contul: hard-deletes `profiles`, `saved_*`, `quiz_runs`/`personality_runs`/`vocational_runs`, and unused parent-consent tokens associated with that `user_id`. `consent_records` and `paid_intents` are pseudonymised (`user_id` nulled) according to the retention rules in §4. Confirms via email.
- Settings → Account → Descarcă datele mele: returns a JSON blob with all the user's records.

Both must be implemented as Edge Functions, not just SQL — needs to actually run end-to-end before launch.

### 5.6 Session replay gating

Add a flag to the Umami recorder load: only enable when `consent.categories.replay === true`, the server-derived replay permission is true, and `ageBand !== '14-15'`. The current 15% sample at moderate masking is too permissive for minors.

---

## 6. Auth + parent consent flow

### Anonymous-first

User lands → can take any test, browse careers, save up to 3 careers locally (Zustand persisted to localStorage). No account required for discovery.

### Scoring vs. save — server boundaries (architectural decision, 2026-04-30)

The natural tension between (a) "anonymous/local-first for minors" and (b) "server-side scoring for IP protection" is resolved by splitting the two server operations:

1. **`score-quiz` Edge Function** — *compute-only, no writes.* Takes answers in, returns scores out. No row written to `quiz_runs`/`personality_runs`/`vocational_runs`. No `anonymous_id` persisted server-side. Stateless.
2. **`save-quiz-run` Edge Function** — *the gated write.* Inserts a row into the appropriate `*_runs` table with `user_id` populated. Refuses to run unless ALL of the following hold:
   - User is authenticated (valid Supabase session).
   - `profiles.age_band` is `'16-17'` or `'18+'` or `'adult'`, **OR** `profiles.consent_status` is `'parent_confirmed'`.
   - Browser-side persistence (Zustand) signals the user explicitly opted to "Salvează rezultatul" or syncs from localStorage at auth.

Consequences:

- **Anonymous users** (no account): see scores via `score-quiz`, persistence is localStorage only. Server has no record of their test runs. The `anonymous_id` column in the schema is reserved for future use but **not populated in v2** — drop or comment out at migration time, re-introduce only if Phase 3 needs cross-device anonymous resume.
- **Under-16 users in pending_parent state**: behave like anonymous on the test surface — `score-quiz` runs, `save-quiz-run` refuses. Once parent confirms, retroactive sync of localStorage runs is allowed (and explicit — UI prompt, not silent).
- **Authenticated 16+ / parent_confirmed**: full save path.
- **Saved careers / programs** continue to sync at auth, separate from test runs (those are user-controlled selections, not psychometric output, and their privacy posture is the same as any other user choice).

Why this matters for the privacy/DPIA story: under this split, the server **never** holds a pseudonymous quiz_run row that later "becomes" identified — the row only exists once consent and age band qualify. There is no orphaned-anonymous-data backlog to defend.

[TODO: confirm with lawyer in M0 consult that this split is sufficient to honour the "no cloud sync until parent_confirmed" promise; flag any further restriction if counsel disagrees.]

### Account creation triggers

Account creation prompts appear ONLY at:
1. After 3rd save (or "Salvează în vibe-uri" — explicit save action)
2. On 2nd visit (returning anonymous user with localStorage state)
3. On `paid_intent_clicked` event
4. Never as a hard gate on quiz / browse

### Auth providers

Supabase Auth with three providers:
- **Google OAuth** — primary, fastest
- **Apple OAuth** — required for iOS WebView users; handle private-email-relay correctly
- **Email magic link** — fallback, no Facebook (per ROADMAP)

After auth, sync localStorage state to `saved_careers` + `saved_programs` if not already present.

### Age gate

Immediately after first auth, present age question:
- "Câți ani ai?" → 14-15 / 16-17 / 18+ / "sunt părinte"

Persist as `age_band` on `profiles`.

### Under-16 flow

If `age_band === '14-15'`:
1. Set `consent_status = 'pending_parent'`
2. Ask for parent email: "Pentru continuare, avem nevoie de acordul unui părinte sau tutore."
3. Generate `parent_consent_tokens` row (256-bit random, 30-day expiry)
4. Send parent email via Resend with link to `/parent-consent?token=...`
5. Allow user to use the app in *limited mode* until confirmed:
   - ✓ take tests
   - ✓ browse
   - ✓ save locally
   - ✗ paid intent submission
   - ✗ profile sync to cloud (stays in localStorage)
   - ✗ parent companion features

Parent clicks link → lands on `/parent-consent` page → reads what data is collected, why → clicks "Confirm consent" → `parent-consent` Edge Function:
1. Validates token (not used, not expired)
2. Updates child's `consent_status = 'parent_confirmed'`
3. Inserts `consent_records` row with `event = 'parent_confirmed'`
4. Marks token as `used_at = now()`
5. Sends confirmation email to both parent and child

If parent revokes later: `consent_status = 'revoked'` → app blocks sensitive features and prompts re-consent.

### Magic link UX

Magic link emails should:
- Use Resend templates (RO + EN)
- Subject: "Confirmă autentificarea Ce Să Fiu?"
- Body: short, no marketing
- Link expires in 1 hour
- Single use
- Fallback for PWA / iOS Safari quirks (sometimes magic links open in wrong browser context)

---

## 7. Migration from prototype

What carries forward, what gets discarded.

### KEEP (port to new stack)

- All of `data.js` content → SQL seed files in `supabase/seed/`. The migration script (`scripts/migrate-prototype-data.ts`) wraps every translatable text field into `{"ro": "<value>", "hu": null, "en": null}` JSONB so the DB is i18n-ready from day one.
- `IPIP-NEO-60` items → seeded into `quiz_versions` table for the personality test (items also wrapped in JSONB for future translation).
- The matcher (`computeMatches` in `app.jsx`) → port to TypeScript in `apps/web/lib/matcher.ts`. Same algorithm, type-safe. Add unit tests against the 6 simulated archetypes from the existing node smoke-test (BUILDER/HELPER/ARTIST/FOUNDER/RESEARCHER/GENERALIST).
- Visual design system from `cesafiu_prototype_v1/project/styles.css` → port to CSS Modules in `apps/web/app/globals.css` + per-component `.module.css`. Don't redesign.
- Umami event names from `paid-hook-card.jsx` etc. → keep so analytics history is continuous.
- Formspree waitlist (`myklbprg`) → export the data, import into `paid_intents` as the seed cohort.
- All visible UI strings → extracted to `messages/ro.json` during port. This is non-negotiable — components must NOT hardcode strings.

### DISCARD

- React-UMD + Babel-standalone setup. Replaced by Next.js 15 (App Router) build.
- Tweaks panel (`tweaks-panel.jsx`). Was for design exploration; not needed in product.
- "PREVIEW PHASE 1" banner. Gone.
- iOS frame (`ios-frame.jsx`). Just be a normal mobile-first webapp — the frame was a Figma-style decoration.
- `phase1.html` at the repo root. After cutover, redirects to the new app's domain.
- `cesafiu_prototype_v1/project/CeSaFiu Prototype (standalone).html` (1.5MB stale snapshot). Delete from repo.

### Cutover plan

Phase 2 deploys to staging at, say, `dev.cesafiu.ro`. Closed-circle testers get invited there for testing. Once stable, the production domain `cesafiu.ro` switches to Phase 2 app. `phase1.html` redirects (or stays archived for a month then is removed).

Localstorage from Phase 1 (`cesafiu_results` etc.) is read by the new app on first visit and migrated to the new shape. Don't break existing testers' state.

---

## 8. Milestones — week-by-week

Honest scope: **8-10 weeks at solo full-time pace**, longer at evenings/weekends. Don't compress.

### M0 — Privacy & legal scaffolding (week 1)

- [ ] Privacy policy drafted in RO + EN (`docs/PRIVACY-POLICY.md`)
- [ ] DPIA template completed (`docs/DPIA.md`)
- [ ] RO privacy lawyer consult booked + initial review
- [ ] ANSPDCP notification status confirmed
- [ ] Consent banner component spec'd

**Definition of done:** legal review confirms we can collect data with parent consent flow. Without this, M1 is blocked.

### M1 — Stack foundation (week 2)

- [ ] Supabase project created, EU/Frankfurt region
- [ ] Vercel project + custom domain (cesafiu.ro DNS) + Frankfurt region selected
- [ ] Next.js 15 + TypeScript + App Router scaffolded under `apps/web/`
- [ ] `next-intl` configured: middleware, `[locale]` routing, default `ro`, `messages/ro.json` populated with the keys we know we need
- [ ] CSS Modules pipeline (port the existing tokens, no Tailwind)
- [ ] Supabase server + browser client helpers (`lib/supabase/`)
- [ ] Sentry integrated (frontend + server) with **default scrubbing from day 1**: `beforeSend` hook strips emails, auth/parent_consent tokens, test answers, and any field prefixed `parent_*`. `user_id` is omitted from breadcrumbs for sessions where age_band is unknown or `'14-15'`; only attached for confirmed `'16-17'` / `'18+'` / `'adult'`. Verified by unit test that simulates an under-16 error and asserts no PII reaches the SDK envelope.
- [ ] CI: PR previews, type check, lint, basic tests
- [ ] Resend account + first transactional email test (RO template)
- [ ] Translation discipline check: lint rule that fails on hardcoded user-facing strings

### M2 — Anonymous core flows (weeks 3-4)

- [ ] Port `welcome` screen
- [ ] Port `quiz` screen (1 quiz variant, the one Phase 1 testing surfaces as winner)
- [ ] Port `personality.jsx` → both 15-item and IPIP-NEO-60 variants
- [ ] Port `vocational.jsx`
- [ ] Port `results.jsx` with the cosine matcher (in TS)
- [ ] Port `deep-results.jsx`
- [ ] Port `career.jsx` detail screen
- [ ] Port `browse.jsx`
- [ ] Port `paid-hook-card.jsx`
- [ ] All disclaimers present (per `PSYCHOMETRICS.md`)
- [ ] localStorage persistence via Zustand `persist` middleware
- [ ] All Umami events firing with same names as Phase 1

**Definition of done:** anonymous user can complete the full discovery flow, save 3 careers locally, refresh and see saved state preserved.

### M3 — Sensitive data IP gate (week 5)

- [ ] Move `programs[]`, scoring weights, full faculty mappings to Supabase tables
- [ ] Public reads via Supabase client (RLS allows anon read on `careers`, `institutions`, `programs` minus weight columns)
- [ ] `score-quiz` Edge Function: takes answers, returns matches. **Compute-only — no DB writes.** Algorithm runs server-side; weights stay server-side. (See §6 "Scoring vs. save".)
- [ ] `save-quiz-run` Edge Function: separate gated write path. Refuses unless authenticated AND (age_band ≥ 16 OR consent_status = parent_confirmed). Same gate for `save-personality-run` and `save-vocational-run`.
- [ ] Public `data.js`-equivalent in the frontend stays only for *display* fields (career names, taglines) for SEO + initial paint
- [ ] Smoke test: viewing source HTML of public site doesn't leak the scoring weights or full mappings
- [ ] Smoke test: anonymous user takes quiz → DB has zero new `quiz_runs` rows; localStorage holds the result.

### M4 — Auth + sync (weeks 5-6)

- [ ] Supabase Auth wired (Google + Apple + magic link)
- [ ] Auth callback handlers
- [ ] Apple Sign-In private email handling tested
- [ ] Magic link email template (Resend, RO + EN)
- [ ] Profile creation on first auth
- [ ] localStorage → Supabase sync on auth event
- [ ] Settings page MVP (account info, sign out, delete account, download my data)

### M5 — Age gate + parent consent (week 7)

- [ ] Age question post-auth
- [ ] Under-16 limited-mode toggle (blocks paid intent + cloud sync)
- [ ] Parent email collection UI
- [ ] `parent-consent` Edge Function (token gen + validation)
- [ ] Parent consent email template (RO, addressed to parent — different register than teen-facing copy)
- [ ] `/parent-consent?token=...` landing page
- [ ] Confirmation emails (parent + child)
- [ ] Revocation flow (parent can revoke; consent_status flips)
- [ ] `consent_records` audit log writes for every state change

**Definition of done:** test the full parent flow with two real email addresses. Token generation, email delivery (Resend), confirmation page, audit log entries — all working end-to-end.

### M6 — Profile MVP + viral share (week 8)

- [ ] Profile page: saved careers, saved programs, "why this matched me" (from quiz_runs.scores + careers.riasec joins)
- [ ] Adjacent careers section (2 per saved)
- [ ] Next-steps for each saved career (3 actions, generated from career data)
- [ ] OG image generation per result (use `@vercel/og`)
- [ ] Share-card preview screen
- [ ] "Share pe Instagram Story" deep-link button
- [ ] K-factor instrumentation (UTM-tagged share links → Umami)

### M7 — Soft launch (weeks 9-10)

- [ ] Lighthouse audit ≥ 90 across all four metrics
- [ ] Accessibility audit (axe-core CI integration, manual screen-reader test)
- [ ] DPIA reviewed by lawyer, signed off
- [ ] Closed-circle testers from Phase 1 invited to dev.cesafiu.ro
- [ ] Bug bash week
- [ ] Production cutover: cesafiu.ro switches to new app
- [ ] phase1.html redirect set up
- [ ] Announce to closed-beta list (Formspree export)

---

## 9. Definition of "Phase 2 done"

All boxes ticked:

- [ ] cesafiu.ro serves the new Next.js / React / TS app (per §2 stack lock-in)
- [ ] phase1.html redirects to / (or is gone)
- [ ] User can: anonymous quiz → save → create profile → confirm parent consent (if minor) → save more → return next visit and see state
- [ ] All sensitive data + scoring is server-side; public source doesn't leak
- [ ] Privacy policy + DPIA + consent banner live; lawyer-reviewed
- [ ] Right-to-erasure + data export tested end-to-end
- [ ] Closed-beta cohort migrated without losing saves
- [ ] Lighthouse ≥ 90 / 90 / 90 / 90
- [ ] Sentry catches at least one real production error and Adi gets paged
- [ ] Phase 1's Umami events still fire and the Variant A/B/C funnel data is continuous

---

## 10. Risks & dependencies

### Risks (likelihood × impact)

| Risk | L | I | Mitigation |
|---|---|---|---|
| RO privacy lawyer says ANSPDCP notification IS required and adds 4-6 weeks | M | H | Book consult in week 1, before any code |
| Apple Sign-In private-email-relay breaks parent consent flow (relay can change) | M | M | Test with real Apple ID early; have manual override path |
| Supabase EU region cold-start latency on Edge Functions for matcher | M | L | Benchmark in M3; if bad, move just the matcher to a Cloudflare Worker |
| Closed-beta migration loses saves | L | H | Keep Phase 1 localStorage format readable; write explicit migration code in M4 |
| Romanian-vs-Moldovan language drift surfaces in IPIP translation | L | L | Already flagged as Phase 1.5 leftover; defer to post-M7 |
| TestCentral / Cognitrom files a complaint over "Big Five" labeling | L | M | Disclaimers shipped; if escalates, switch to "5-factor profile" framing |
| Next.js + Vercel + Supabase combo hits an edge bug | L | M | All three are proven stacks; Sentry catches issues |
| Adi spreads thin (booking platform / accounting app continue eating time) | M | H | Adi explicitly chooses CeSaFiu primary for Phase 2; adjust other commitments |

### External dependencies

- Domain `cesafiu.ro` registered and DNS controllable — **Adi to confirm**
- Supabase EU region account + billing for paid tier when needed
- Vercel account
- Apple Developer Program ($99/yr) for Sign in with Apple
- Resend account
- Sentry account
- Romanian privacy lawyer (1-2 consults, ~€500-1,500)
- Optional: a Romanian psycholinguist for IPIP-NEO-60 translation polish before paid launch

---

## 11. Decisions still open

These need calls *before or during* M0:

1. **Domain.** `cesafiu.ro` confirmed registered? If not, register now.
2. **DPO.** Adi as DPO for now, or appoint external? Likely OK as Adi for Phase 2; revisit at scale.
3. **Email-from address.** `noreply@cesafiu.ro` for transactional, `salut@cesafiu.ro` for replies?
4. **Apple Developer Program.** Sign in with Apple requires it (~$99/yr). Budget OK?
5. **Supabase free tier vs. paid.** Free covers 50k MAU, but paid ($25/mo) unlocks higher Edge Function quotas and longer log retention. Start free, upgrade when 10k MAU.
6. **Variant A/B/C resolution.** Phase 1 closed-circle should pick the winner before M2 (only port one quiz variant, not all three). What does Variant B's data look like at end of preview?
7. **Privacy lawyer.** Recommend: book a 1-hour consult in week 1 to review the DPIA draft, ANSPDCP threshold, parent-consent legal text. Romanian lawyer with EU privacy specialization.
8. **Branding final.** "Ce Să Fiu?" stays as the name — confirm. Logo/typography: keep current direction or commission?
9. **Stack: Next.js 15 + Supabase + next-intl.** Reviewed in §2 alongside Vite/Remix/SvelteKit/Astro/Solid/Cloudflare/Firebase/Convex alternatives. Locked-in unless Adi prefers a specific alternative — say if so before M1.

### Decided 2026-04-29

- **Locale priority: EN as the second locale.** HU placeholder dropped from v1 architecture; only `messages/ro.json` (full) and `messages/en.json` (placeholder/null) exist at launch. HU added later if Sapientia/Mureș export market materializes.
- **Translation pipeline: LLM-automatic, manually triggered by Adi when ready to add EN.** Pipeline spec in §2.1 — `pnpm translate --locale=en` runs Claude over RO content, writes back as `"llm-draft"`, Adi reviews diff, promotes to `"complete"`. Glossary preserves terms (RIASEC, IPIP-NEO-60, institution names). Legal docs (privacy, DPIA, parent emails) are NOT auto-translated — human-only.

---

## 12. How to start the next session

Hand the next Claude session this doc + the existing `docs/DATA-ARCHITECTURE.md`, `docs/PSYCHOMETRICS.md`, and the prototype repo. Ask it to:

1. Confirm the open decisions in §11.
2. Start M0 — draft `docs/PRIVACY-POLICY.md` and `docs/DPIA.md` based on the schema above.
3. Set up the Supabase project + Vercel project (this requires Adi's hands for OAuth provider keys, billing, etc. — agent can guide but can't execute alone).
4. Once M0 is done, scaffold `apps/web/` and start M1.

The plan is sized for *deliberate execution*, not heroics. If anything in this doc looks wrong on closer reading, fix it in this doc first — don't fork the strategy in code.

---

*This doc is the contract. Update it on every load-bearing decision. Archive obsolete sections rather than deleting.*
