# Auth and Minor Consent Flow

This documents the Supabase auth + parent-consent slice for CeSaFiu.

Scope in this version:

- `Salvează` is the first auth gate.
- Magic-link auth creates/loads the user session through a cookie-backed Supabase callback.
- The app asks for an age band after auth.
- Users aged `10-12` or `13-15` enter `pending_parent`.
- Age-band and consent-state writes are server-side only.
- Parent email is HMAC-hashed and a hashed consent request token is recorded.
- `saved_careers` inserts are consent-aware in RLS.
- **Profil Complet** (IPIP-NEO-60 + Vocațional Complet + PDF report) is free during the pilot, but structured as a future paid bundle. It is server-gated for `pending_parent` users at both the page level (`/test/[slug]` for any slug in `PAID_TEST_SLUGS`) and the API level (`/api/match` when the body carries any `PAID_MATCH_FIELDS`).
- See [PAID-BUNDLE-POSITIONING.md](./PAID-BUNDLE-POSITIONING.md) for the bundle product decision and copy.
- Parent emails are sent through **Brevo** (`apps/web/src/lib/email/brevo.ts`) using a branded RO template (`apps/web/src/lib/email/templates/parent-consent.ts`). On Brevo failure the token row is rolled back and an audit row with `event = 'parent_consent_email_failed'` is written so the user can retry cleanly within rate limits.
- Parent confirmation is handled by `GET /api/consent/parent-confirm?token=…`, which HMACs the supplied token, constant-time compares against the stored hash, gates the `used_at` update with a `WHERE used_at IS NULL` race guard, flips `consent_status` to `parent_confirmed`, audits with `event = 'parent_consent_confirmed'`, and `303`-redirects to `/[locale]/acord-parinte?status=…` so the token never lingers in browser history.

## Flowchart

```mermaid
flowchart TD
  A["User taps Salvează on results or career page"] --> B{"Supabase configured?"}
  B -- "No" --> C["Show auth configuration error"]
  B -- "Yes" --> D{"User has active session?"}

  D -- "No" --> E["Save career locally"]
  E --> F["Open magic-link modal"]
  F --> G["User enters email"]
  G --> H["Supabase sends magic link"]
  H --> I["/ro/auth/callback route exchanges code and sets cookies"]
  I --> J["Redirect back to original page or profile"]

  D -- "Yes" --> K["Load profile"]
  J --> K
  K --> L{"Age band known?"}

  L -- "No" --> M["Ask age band"]
  M --> N{"Age band"}
  N --> O["POST /api/consent/age-band"]
  O --> P["Server validates session and writes profile"]
  P -- "10-12 / 13-15" --> Q["consent_status = pending_parent"]
  P -- "16-17 / 18+ / parent" --> R["consent_status = self"]

  L -- "Yes" --> S{"Consent status"}
  R --> S
  Q --> T["Ask parent or guardian email"]
  S -- "pending_parent" --> T
  S -- "self / parent_confirmed" --> U["Sync local saved careers to Supabase"]

  T --> V["POST /api/consent/parent-request"]
  V --> W["Validate session with Supabase admin client"]
  W --> X["Require profile is under 16 and pending_parent"]
  X --> Y["Rate limit by user and HMAC IP hash"]
  Y --> Z["HMAC parent email and consent token"]
  Z --> AA["Update parent_email_hash only"]
  AA --> AB["Create parent_consent_tokens row"]
  AB --> AC["Create consent_records audit row with HMAC IP/UA"]
  AC --> AD["Show parent consent pending confirmation"]

  U --> AE["Insert/delete saved_careers under consent-aware RLS"]
  AE --> AF["Saved career appears in Vibe-uri"]

  AD --> AG["Tests continue locally"]
  AG --> AH["Profil Complet and remote save sync remain blocked until consent changes"]

  AI["Direct visit to /test/ipip-neo-60 or /test/vocational-deep"] --> AJ["Server reads Supabase cookie session"]
  AJ --> AK{"Profile pending_parent?"}
  AK -- "Yes" --> AL["Render consent-required page"]
  AK -- "No / anonymous" --> AM["Render questionnaire"]

  AN["POST /api/match with deep bundle scores (ipipNeo60Scores or vocationalDeepRaw)"] --> AO["Server reads cookie session"]
  AO --> AP{"Profile pending_parent?"}
  AP -- "Yes" --> AQ["403 parent_consent_required"]
  AP -- "No / anonymous" --> AR["Score and return matches"]
```

## Data Model

`profiles`

- One row per Supabase auth user.
- Stores `age_band`, `consent_status`, optional display name, and a hashed parent email for minor consent.
- Authenticated users can read only their own row.
- Client insert/update grants are revoked; profile consent fields are written through server API routes.

`saved_careers`

- Stores `(user_id, career_id)`.
- Protected by RLS so authenticated users can select and delete only their own saved careers.
- Inserts additionally require the user's profile to have `consent_status in ('self', 'parent_confirmed')`.
- Does not foreign-key `career_id` yet because careers are still file-backed in the app.

`parent_consent_tokens`

- Stores HMAC hashes of generated parent-consent tokens for future email confirmation.
- RLS is enabled with no browser policies; only server-side privileged access should use it.

`consent_records`

- Audit table for consent-related events.
- Current event: `parent_consent_requested`.
- Stores HMAC hashes of request IP and user agent for abuse investigation without retaining raw values.
- Authenticated users can only read their own consent records.

## Current Limitations

- Session replay masking still needs verification in a real Umami recording.
- The secret key must be configured only as an environment variable.
- `CONSENT_HASH_PEPPER` must be configured as a server-only environment variable.
- The secret key that was shared during implementation should be rotated before production.
- `BREVO_API_KEY`, `EMAIL_FROM_ADDRESS` and `EMAIL_FROM_NAME` must be configured server-only. Without them, `parent-request` returns `502 email_send_failed` and rolls back the token.
- Auth Email Templates (Confirm signup / Magic Link / Invite / Change Email / Reset / Reauthentication) are single-language in Supabase. RO templates live in `docs/email-templates/` and must be pasted into the Supabase dashboard. Multi-locale would require routing through the **Send Email Hook**.
