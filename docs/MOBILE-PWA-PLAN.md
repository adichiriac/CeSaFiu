# Mobile strategy — PWA first, native gated by data

*Created 2026-07-04. Status: Stage 1 implemented; push deferred behind P4 (ROADMAP §P6). Decision owner: Adi.*

## The decision

A native app was considered (2026-07-04) and **deferred behind data**. Reasoning: the growth engine is link-based (share cards, `/r/[code]` referrals, one tap to value) — an app store install wall cuts that funnel hard at a 14-18 audience; the product is episodic (test → explore → return at deadlines), and episodic products retain fine on web + notifications. What natives genuinely add — reliable push, better gestures, store presence for school distribution — is either achievable in a PWA or not yet needed.

**Staged path with explicit gates:**

| Stage | What | Cost | Gate to next stage |
|---|---|---|---|
| 1. PWA (this plan) | installable, offline shell, install/update UX | 2-4 sessions | — ship it |
| 2. Capacitor wrapper | same Next app in a store shell | 2-4 weeks + 99$/an Apple | install rate ≥ ~5% of MAU **or** school-pilot partners asking for "the app" |
| 3. Expo/React Native | true native rebuild | months, parallel codebase | proven retention + funding; freezes roadmap otherwise |

Sticky comes from utility (P4 deadline layer), not from being in a store. The PWA's job is to (a) deliver the app *feel* cheaply and (b) produce the install-rate metric that decides Stage 2.

## Already in place (audit 2026-07-04)

- `apps/web/public/site.webmanifest` — name, `display: standalone`, `start_url: /ro`, 192/512 icons + **maskable** icon. Linked from locale layout.
- `apple-touch-icon.png` present.
- Stage 1 shipped: service worker/offline fallback, install/update UX, corrected theme colors/start URL/id, and standalone session analytics. Remaining gap: push notifications, intentionally deferred behind P4 deadline data + privacy/consent work.

## Workstream 1 — installability polish (½ session)

- Fix `theme_color` (light `#fef9f1`; add dark `#161318` via Next `viewport.themeColor`).
- iOS meta: `apple-mobile-web-app-capable`, status-bar style, verify apple-touch-icon renders on the paper background (add padding if the sticker logo gets cropped).
- `start_url: /ro?source=pwa` — so installs are visible in Umami without extra code.
- Add `id` field to manifest (stable identity across origin changes).

## Workstream 2 — service worker + offline shell (1 session)

- Use **Serwist** (maintained Workbox successor with a Next.js adapter) rather than hand-rolling. Manual registration (`register: false`) is required so update activation stays behind user consent.
- Cache strategy: precache generated app assets + localized offline pages; runtime cache-first for build/static assets and fonts; stale-while-revalidate for images; network-first for pages/RSC/static data. **Never cache** `/api/*`, auth routes, referral routes, `/quiz`, Supabase calls, Umami/Sentry endpoints, POST requests, or generic cross-origin traffic.
- Offline behavior: quiz/test pages work once loaded and drafts/results persist in localStorage; browse/profile/results pages render if they are in the runtime page cache. Matching recompute still needs `/api/match`, so the last successful results view should be cached or the UI should fall back to the localized offline page when no cached response exists.
- Update flow: `skipWaiting` on user consent — a small "Versiune nouă — reîncarcă" toast, not a silent swap (avoids mid-test surprises).

## Workstream 3 — install UX (1 session)

- **Not on home** (one-path principle, same rule as the values test).
- Android/Chrome: capture `beforeinstallprompt`, show a themed nudge at the two natural moments: after a completed test result is saved, and on Profil (near the completeness card): „Pune CeSaFiu pe ecran — rezultatele tale, la un tap." Never more than once per N days (localStorage cooldown).
- iOS (no install API): same moments, show a small "Share → Adaugă pe ecranul principal" hint with the two-icon visual. Detect already-installed via `display-mode: standalone` and never nag installed users.
- Umami events: `pwa_prompt_shown`, `pwa_prompt_accepted`, `pwa_installed` (best-effort Chromium `appinstalled` event), plus a standalone session event — this is the Stage-2 gate metric. iOS installs are inferred from standalone sessions, not direct install events.

## Workstream 4 — web push for deadlines (1-2 sessions, ships WITH or AFTER P4)

Push only makes sense once the deadline layer (P4) has something to say. Build order: this workstream lands last, timed with P4's first data.

- Standard Web Push (VAPID) — works on Android Chrome/Firefox; on iOS ≥16.4 **only from the installed PWA** (one more reason the install nudge matters).
- `push_subscriptions` table in Supabase (RLS: own rows only), subscribe UI on Profil + at the P4 "Verifică admiterea" step. Push is only for authenticated users with `consent_status in ('self', 'parent_confirmed')`; opt-in is framed around a concrete deadline: „Te anunțăm cu 7 zile înainte de termenul de la <program>." Never a generic "activează notificările".
- Sending: a scheduled job (Railway cron / Supabase edge function) that reads P4's calendar data. **Policy hard line (existing principle): deadline notifications only, no engagement pings.** Document the exact allowed types in the code.
- GDPR: subscription = consent record for that notification type; unsubscribe in one tap from Profil; add/update the privacy policy before shipping push.

## Explicitly out of scope (Stage 1)

- App store presence, Capacitor shell, native APIs (camera, biometrics) — Stage 2+.
- Background sync of saved items (localStorage → account flow already covers the gap well enough).
- Offline matching recompute — matching stays online; cached pages/results render offline when available.

## Success metrics (review ~6-8 weeks after ship)

- Install/standalone rate: standalone sessions / active users, with `pwa_installed` as a Chromium-only supporting signal (Stage-2 gate: ≥ ~5% sustained, threshold to be sanity-checked against school-pilot signal).
- Notification opt-in rate at the deadline touchpoint.
- Return rate of standalone sessions vs. browser sessions (the actual "stickiness" claim, measured).

## Risks

- **Service worker + Next.js App Router caching interplay** — the classic footgun (stale HTML after deploys). Mitigation: Serwist defaults + network-first for documents + the update toast. Test on Railway preview before prod.
- **iOS PWA quirks:** no `beforeinstallprompt`, storage can be evicted after long disuse (localStorage results — the account-save flow is the real fix, already exists), push only when installed. Acceptable; document in code comments.
- **Two sources of "app-like" truth:** if Stage 2 happens, the Capacitor shell must reuse this exact web app — no forked UI. The gate table above is the contract.
