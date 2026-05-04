# Auth and Minor Consent Flow

This documents the first Supabase auth slice for CeSaFiu.

Scope in this version:

- `Salvează` is the first auth gate.
- Magic-link auth creates/loads the user session.
- The app asks for an age band after auth.
- Users aged `14-15` enter `pending_parent`.
- Parent email is hashed and a consent request token is recorded.
- Actual parent email delivery and confirmation are not wired yet.

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
  H --> I["/ro/auth/callback exchanges code for session"]
  I --> J["Redirect to profile"]

  D -- "Yes" --> K["Load or create profile"]
  J --> K
  K --> L{"Age band known?"}

  L -- "No" --> M["Ask age band"]
  M --> N{"Age band"}
  N -- "14-15" --> O["Set profile consent_status = pending_parent"]
  N -- "16-17 / 18+ / parent" --> P["Set profile consent_status = self"]

  L -- "Yes" --> Q{"Consent status"}
  P --> Q
  O --> R["Ask parent or guardian email"]
  Q -- "pending_parent" --> R
  Q -- "self / parent_confirmed" --> S["Sync local saved careers to Supabase"]

  R --> T["POST /api/consent/parent-request"]
  T --> U["Validate session with Supabase admin client"]
  U --> V["Hash parent email"]
  V --> W["Upsert profile as pending_parent"]
  W --> X["Create parent_consent_tokens row"]
  X --> Y["Create consent_records audit row"]
  Y --> Z["Show parent consent pending confirmation"]

  S --> AA["Insert/delete saved_careers under RLS"]
  AA --> AB["Saved career appears in Vibe-uri"]

  Z --> AC["Tests continue locally"]
  AC --> AD["Paid report and remote save sync remain blocked until consent changes"]
```

## Data Model

`profiles`

- One row per Supabase auth user.
- Stores `age_band`, `consent_status`, optional display name, and a hashed parent email for minor consent.
- Protected by RLS so authenticated users can select, insert, and update only their own row.

`saved_careers`

- Stores `(user_id, career_id)`.
- Protected by RLS so authenticated users can select, insert, and delete only their own saved careers.
- Does not foreign-key `career_id` yet because careers are still file-backed in the app.

`parent_consent_tokens`

- Stores generated parent-consent tokens for future email confirmation.
- RLS is enabled with no browser policies; only server-side privileged access should use it.

`consent_records`

- Audit table for consent-related events.
- Current event: `parent_consent_requested`.
- Authenticated users can only read their own consent records.

## Current Limitations

- Parent email delivery is not implemented yet.
- Parent confirmation route is not implemented yet.
- The secret key must be configured only as an environment variable.
- The secret key that was shared during implementation should be rotated before production.
