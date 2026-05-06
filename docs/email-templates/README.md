# Email templates — Ce Să Fiu?

Branded HTML templates for Supabase Auth emails, sent through Brevo SMTP.

## Visual system

Matches the `globals.css` design tokens:

- **Background:** `#fef9f1` (paper)
- **Ink:** `#1d1c17`
- **Primary CTA:** yellow `#ffe170` button, 3px black border, `4px 4px 0 #000` hard shadow
- **Eyebrow accent:** purple `#6b38d4`
- **Notice block:** soft blue `#b8e7ff`
- **Reauthentication code:** lime `#a9f900` (visually distinct from CTA buttons)
- **Header:** dark bar with yellow `?` mark + CeSăFiu wordmark + "ORIENTARE · ROMÂNIA" tagline

The `?` mark is rendered in HTML/CSS instead of an image so it survives image-blocking in Gmail/Outlook and doesn't need a hosted asset.

## Templates → Supabase mapping

In Supabase Dashboard → **Authentication → Email Templates**, paste each file into the matching template. Update the **Subject** field too — defaults are bland.

| Supabase template | File | Suggested subject |
|---|---|---|
| Confirm signup | `confirm-signup.html` | `Confirmă-ți contul Ce Să Fiu?` |
| Invite user | `invite-user.html` | `Ai fost invitat pe Ce Să Fiu?` |
| Magic Link | `magic-link.html` | `Linkul tău de autentificare — Ce Să Fiu?` |
| Change Email Address | `change-email.html` | `Confirmă noua adresă de email` |
| Reset Password | `reset-password.html` | `Resetează-ți parola Ce Să Fiu?` |
| Reauthentication | `reauthentication.html` | `Codul tău de verificare: {{ .Token }}` |

## Supabase template variables

All templates use Supabase's Go template syntax:

- `{{ .ConfirmationURL }}` — full action link (used in 5 of 6 templates)
- `{{ .Token }}` — 6-digit OTP (Reauthentication only)
- `{{ .Email }}` — recipient email (used in change-email)
- `{{ .SiteURL }}` — base URL from project settings

Don't add `{{ .Data.full_name }}` etc. unless you've confirmed those fields exist on your `auth.users` metadata — they'll render empty otherwise.

## Brevo SMTP — Supabase config

Project Settings → Auth → SMTP Settings:

```
Host:        smtp-relay.brevo.com
Port:        587
Username:    [from Brevo → SMTP & API → SMTP]
Password:    [SMTP key from Brevo]
Sender:      noreply@cesafiu.ro
Sender name: Ce Să Fiu?
```

Make sure the sending domain has **DKIM, SPF, and DMARC** verified in Brevo before going live. Without DKIM, Gmail will route to spam.

## Email-client compatibility notes

The templates use a defensive HTML email pattern:

- `<table>` layout (Outlook needs this — flexbox/grid don't render)
- Inline styles only (no `<style>` blocks except preheader hide)
- `box-shadow` for modern clients; thick black `border` is the fallback for Outlook (which ignores box-shadow)
- Web-safe font stack with `Arial Black` / `Impact` as the heavy display fallback (Be Vietnam Pro and Epilogue won't load in any email client)
- `mso-hide:all` preheader for Outlook
- Max width `600px`
- All buttons are `<a>` inside a styled `<td>` — clickable in Outlook unlike CSS-styled `<a>` alone

Test before going live in: Gmail (web + iOS), Outlook 2016+ (Windows), Apple Mail, and Yahoo. [Litmus](https://litmus.com) or [Email on Acid](https://emailonacid.com) have free trials if you want full client previews.

## i18n note

Supabase Auth Email Templates support **only one language at a time**. If you want per-locale emails (RO + EN + others), you'll need to use the **Send Email Hook** to route through your own edge function and pick the template based on `user.user_metadata.locale`. Until then, RO is the right default — the platform serves Romanian users.

## Customization checklist

Before going live, find-and-replace these throughout all 6 files if needed:

- `cesafiu.ro` — production domain
- `hello@cesafiu.ro` — support email (currently only in `reset-password.html`)
- Tagline `ORIENTARE · ROMÂNIA` — change if you want a different sub-line in the header

## Testing locally

You can preview each `.html` file in a browser to see roughly what users will get — but the **only reliable test** is sending a real email through Supabase to a Gmail and an Outlook inbox. Browser preview ≠ email-client preview.
