# Consent banner + cookie spec — Ce Să Fiu?

*Version: v0.1-draft (2026-04-29). Spec author: Adi. Implements §5.4 + §5.6 of [`PHASE-2-PLAN.md`](PHASE-2-PLAN.md). Implementation lands in **M1**; this doc lands in M0 to clarify the contract.*

*Companion: [`PRIVACY-POLICY.md`](PRIVACY-POLICY.md) §9 (cookies), [`DPIA.md`](DPIA.md) R8 (replay-gating risk).*

---

## 1. Goals and non-goals

**Goals**
- Lawful baseline for analytics + replay under GDPR Art. 6 + ePrivacy Art. 5(3) (= Romanian Law 506/2004).
- Hard-gate session replay so no minor under 16 is ever recorded — defense in depth, not just UI.
- Minimal friction for the 16+ user who taps "Accept all" once and is done.
- Granular control for the user who wants it ("Personalizează" → toggle each category).
- Persistence + re-prompt yearly (or on substantive policy change).
- Trivial to operate from code: a single `useConsent()` hook that gates third-party scripts and event firings.

**Non-goals**
- Not a "cookie wall" — essential functionality must work even if consent is denied.
- Not a TCF (Transparency & Consent Framework) integration — we don't run programmatic ads.
- Not a tracking-pixel manager — Umami is self-hosted and cookieless; we use it precisely to reduce the consent surface.

---

## 2. State machine

Consent is a single record persisted in **localStorage** (key: `cesafiu_consent_v1`) with the following shape:

```ts
type ConsentState = {
  version: 1;                           // bumped on substantive change → forces re-prompt
  timestamp: string;                    // ISO 8601 of the decision
  decision: 'accept_all' | 'essential_only' | 'custom' | 'unset';
  categories: {
    essential: true;                    // always true; not a togglable category
    analytics: boolean;                 // Umami events + Vercel Web Vitals
    replay: boolean;                    // session replay (always false if age_band === '14-15')
  };
  // Where applicable, the age band at decision time — locks replay even if user later changes age_band
  ageBandAtDecision: '14-15' | '16-17' | '18+' | 'parent' | 'unknown';
};
```

The banner is rendered when:

- `cesafiu_consent_v1` is missing, OR
- `cesafiu_consent_v1.version` is older than the current version, OR
- `cesafiu_consent_v1.timestamp` is older than 365 days, OR
- The user is post-auth and `profiles.age_band` was just set to `'14-15'` and previous decision had `replay = true` (downgrade path — we silently flip replay off and re-show the banner with an explanatory line).

`useConsent()` hook returns the live state and exposes `setConsent()` for the banner.

### State transitions

```
unset --[Acceptă tot]------> accept_all       (analytics: on, replay: on*)
unset --[Doar esențial]----> essential_only   (analytics: off, replay: off)
unset --[Personalizează]---> custom           (per-category toggles)

* replay: on becomes replay: off if age_band === '14-15' — see §4.
```

Closing the banner without a click is **not** consent. The banner is modal-blocking on first session (per ePrivacy guidance: pre-ticked or implicit consent ≠ valid consent). Modal-blocking applies only on the consent surface, not on essential functionality routes (test screens, browse, results — these render with `analytics: false` until a decision is made).

---

## 3. Categories

| Category | What it gates | Default | Consent legal basis |
|---|---|---|---|
| `essential` | Auth session, locale cookie, consent record itself, CSRF | Always on | Art. 5(3) ePrivacy "strictly necessary" |
| `analytics` | Umami custom events, Vercel Web Vitals | Off | Art. 6(1)(a) GDPR (consent) — see note below |
| `replay` | Session replay scripts (rrweb / Umami v3 recorder, whichever ships) | Off; locked off for `14-15` | Art. 6(1)(a) GDPR (consent) + Art. 5(3) ePrivacy |

**Note on analytics legal basis (decided 2026-04-30):** analytics and replay are processed under **consent (Art. 6(1)(a))** — opt-in from this banner. The privacy policy aligns to the same posture. Sentry remains on **legitimate interest (Art. 6(1)(f))** with a documented balancing test in [`DPIA.md`](DPIA.md) §3.2 — Sentry events are scrubbed of email/tokens/answers/parent fields, and `user_id` is attached only for confirmed 16+ / parent_confirmed users.

---

## 4. Replay-gating — defense in depth

Session replay must NOT run for any user with `age_band === '14-15'`. The banner enforces this client-side, but we add two more layers — **all three derived from server-owned state, not client-provided headers** — to prevent the bug class where a single broken condition exposes minors:

1. **UI layer:** when the banner is rendered for a known `14-15` user, the "Înregistrare sesiune" toggle is disabled and shown as off, with copy: "Această opțiune este indisponibilă pentru utilizatorii sub 16 ani."
2. **App layer:** the `<ReplayLoader />` component reads `useConsent()` AND `useProfile().ageBand`. It refuses to load the recorder script if either condition fails.
3. **Server-issued replay capability token (cryptographic gate).** When `setConsent()` POSTs to `/api/consent/log` with `replay = true`, the server checks the user's `age_band` (read from `profiles` for authenticated users; rejected outright for unknown-age sessions and for `'14-15'`). If allowed, the server returns a short-lived signed JWT (`replay-cap.<sig>`) with claims:
   ```json
   {
     "sub": "<session_id>",
     "scope": "replay",
     "exp": <now + 12h>,
     "iat": <now>
   }
   ```
   Signed with a server-only secret rotated per release. The recorder script attaches this JWT on every event; the Umami proxy validates the signature, expiry, and scope **before** writing to storage. **No JWT = drop the event.** No shared client-side flag, no header the client controls.

   Re-issuance happens automatically every 12h via `/api/consent/refresh-replay-cap`, which re-checks the live age_band before reissuing — so an age_band downgrade (16-17 → 14-15) invalidates the capability within 12h at most, even if the client misbehaves. For most cases, immediate revocation: the refresh endpoint returns 403 and the recorder unloads itself.

Telemetry: every dropped event (invalid signature, expired token, scope mismatch) increments a `replay_drops` counter that Sentry alerts on if it exceeds zero in a 24h window — a non-zero count means layer 1+2 leaked through, which is a bug and a regulatory risk.

**[TODO: ship `/api/consent/log` + `/api/consent/refresh-replay-cap` + the Umami proxy validator together in M5. Until those are deployed, the recorder script must not load at all (loaded behind a feature flag default-off until M5 ships).]**

---

## 5. UI

### 5.1 Layout

- Bottom-anchored banner (mobile-first), 100% width on `<768px`, max-width 720px on desktop.
- Three buttons: `Acceptă tot` (primary), `Doar esențial` (secondary), `Personalizează` (link-styled).
- "Personalizează" expands an inline panel with per-category toggles. Toggles for unavailable categories (e.g. replay for `14-15`) are visually disabled with explanatory text.
- Reading-level copy: short, plain, no legalese. Long form lives in the privacy policy (linked).

### 5.2 Romanian copy (canonical)

```
Header: Despre date și cookies

Body: Folosim date strict tehnice ca să-ți păstrăm sesiunea de cont,
limba aleasă și răspunsurile la teste pe acest dispozitiv.
Pentru îmbunătățirea platformei putem colecta și statistici de
utilizare — doar dacă ești de acord.

Buttons:
  [Acceptă tot] — primary
  [Doar esențial] — secondary
  [Personalizează] — link

Personalize panel:
  [✓] Esențial · obligatoriu
       Sesiune, limbă, salvare locală — fără ele platforma nu funcționează.
  [ ] Statistici de utilizare
       Umami self-hosted (UE), fără cookies de tracking. Ne ajută
       să vedem ce e util.
  [ ] Înregistrarea sesiunii
       Pentru a depista probleme de UX. Indisponibilă pentru utilizatorii sub 16 ani.

Footer: Detalii complete în [Politica de confidențialitate]. Te poți
răzgândi oricând în Setări → Cookies.

Disabled-replay note (when age_band === '14-15'):
  Această opțiune este indisponibilă pentru utilizatorii sub 16 ani —
  pentru protecția datelor tale.
```

### 5.3 English copy

```
Header: About data and cookies

Body: We use strictly technical data to keep your account session,
your chosen language, and your test answers on this device. To
improve the platform we may also collect usage statistics — only
if you agree.

Buttons:
  [Accept all] — primary
  [Essentials only] — secondary
  [Customise] — link

Customise panel:
  [✓] Essential · required
       Session, locale, local saves — without these the platform
       does not work.
  [ ] Usage statistics
       Self-hosted Umami (EU), no tracking cookies. Helps us see
       what is useful.
  [ ] Session replay
       To find UX issues. Unavailable for users under 16.

Footer: Full details in the [Privacy Policy]. You can change your
mind anytime in Settings → Cookies.

Disabled-replay note (when age_band === '14-15'):
  This option is unavailable for users under 16 — to protect
  your data.
```

---

## 6. Settings → Cookies surface

A non-modal version of the same panel lives at `/[locale]/settings/cookies`. Users reach it via:
- Footer link "Cookies" on every page.
- Settings → Cookies in the authenticated app shell.
- The "schimbă oricând" link in the banner footer.

This surface always shows the current state and lets the user re-decide. Changing the decision here is logged into `consent_records` (event = `'consent_updated'`) for audit.

---

## 7. Re-prompt triggers

Re-prompt the banner (slide it back in) when:

1. **Yearly:** `timestamp` older than 365 days. Soft re-prompt — current decision pre-selected; user confirms or changes.
2. **Version bump:** `version` < current. Used when we add a new processor or a new category. Hard re-prompt — decision returned to `unset` until user acts.
3. **Age-band change in either direction.** Any time `profiles.age_band` is written to a value different from `consent.ageBandAtDecision`, the previous decision is invalidated and the banner re-shown.
   - Going *into* `'14-15'` (corrected birth year, shared device, account hand-off) — replay is silently flipped off and the banner re-shows with the note: "Am ajustat preferințele tale — sesiunea nu se mai înregistrează."
   - Going *out of* `'14-15'` (user turned 16, age-band updated) — replay is *not* automatically enabled; banner re-shows so the user makes an informed choice for the new band.
   - The check runs in `middleware.ts` after auth and on every `age_band` write, not only on first-time band selection. This closes the shared-device case where decision was taken under one age band and the device is now used by someone in a stricter band.
4. **Substantive policy change:** §11 of the privacy policy. Coupled with version bump.

Bump procedure:
```ts
// CONSENT_VERSION constant in lib/consent.ts
export const CONSENT_VERSION = 1;  // ← bump on substantive change
```

A bump should be accompanied by a privacy-policy diff committed in the same PR.

---

## 8. Implementation pointers

### 8.1 Files

- `apps/web/lib/consent.ts` — `useConsent()` hook + `setConsent()` writer + `CONSENT_VERSION`.
- `apps/web/components/ConsentBanner/` — banner component + customise panel.
- `apps/web/components/ReplayLoader/` — gated loader for the replay script.
- `apps/web/app/[locale]/settings/cookies/page.tsx` — non-modal Settings surface.
- `apps/web/middleware.ts` — already handles locale; no consent logic here (purely client).

### 8.2 Hook contract

```ts
// usage:
const { consent, setConsent, openCustomise } = useConsent();
if (consent.categories.analytics) {
  umami.track('quiz_complete', { variant: 'A' });
}
```

`setConsent({ decision, categories })` writes to localStorage AND posts to `/api/consent/log` (server-side, so the consent decision is also persisted in `consent_records` for the user_id once they have a profile — anonymous decisions stay client-only until auth).

### 8.3 Server-side enforcement helper

```ts
// lib/replay-allowed.ts — UI-only helper, NOT the security gate.
// The actual security gate is the server-issued JWT validated by the
// Umami proxy (see §4 layer 3). This helper just decides whether the
// toggle UI shows on/off and whether the recorder script attempts to load.
export function replayAllowed(
  profile: Profile | null,
  consent: ConsentState,
): boolean {
  if (profile === null) {
    if (consent.ageBandAtDecision === '14-15') return false;
    if (consent.ageBandAtDecision === 'unknown') return false;
    return consent.categories.replay === true;
  }
  if (profile.age_band === '14-15') return false;
  if (consent.ageBandAtDecision === '14-15') return false;
  // Decision must have been made at the same band as current — protects
  // against a 14-15 user inheriting a permissive decision from a 16+ device.
  if (consent.ageBandAtDecision !== profile.age_band) return false;
  return consent.categories.replay === true;
}
```

Layered enforcement: this client helper is **necessary but not sufficient**. The server-issued replay capability JWT (§4 layer 3) is the actual control — even if a client returns `replayAllowed = true` incorrectly, the recorder cannot post events without a valid JWT, and the JWT is only ever issued for `age_band ∈ {16-17, 18+, adult}` server-side. Unit-tested with the §4 invariants — including the shared-device case where decision was taken under a 16+ band and the device is now used in a 14-15 band.

### 8.4 Test coverage required for M1 sign-off

- Banner renders on first visit (RO + EN locales).
- Acceptă tot → state set, analytics fires, replay loads (when 16+).
- Doar esențial → state set, analytics does not fire, replay does not load.
- Custom → toggles correctly persisted.
- 14-15 user → replay never loads, even with explicit toggle attempt.
- Year-old timestamp → re-prompt fires.
- Version bump → re-prompt fires; previous categories not pre-applied.

---

## 9. Open questions for the lawyer

(These are also tracked in [`docs/LEGAL-CONSULT-AGENDA.md`](LEGAL-CONSULT-AGENDA.md).)

1. Is the parent-bypass risk through age-gate sufficient grounds for ANSPDCP to require stronger age verification?
2. Does Romanian Law 506/2004 (ePrivacy implementation) require a specific banner pattern beyond what GDPR demands? (Some EU states have stricter national rules.)
3. Is the chosen 3-year retention for `consent_records` (with pseudonymisation on user erasure) acceptable as evidence-of-consent, or do you want a different window?

---

*v0.1-draft — 2026-04-29. Spec is implementation-ready pending answers to §9. Update on every consent-policy change.*
