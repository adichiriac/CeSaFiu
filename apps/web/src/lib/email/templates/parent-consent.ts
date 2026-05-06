/**
 * Parent-consent confirmation email — sent when a child under 16 enters a
 * parent/guardian email on Ce Să Fiu?. The parent clicks the CTA to flip the
 * child's profile from `pending_parent` to `parent_confirmed`.
 *
 * Visual system mirrors `apps/web/src/app/globals.css` and the Supabase Auth
 * templates in `docs/email-templates/`. HTML is table-based and uses inline
 * styles only so it survives Outlook + Gmail rendering.
 */

export type ParentConsentEmailParams = {
  /** Full URL the parent clicks to confirm. Should be absolute. */
  confirmUrl: string;
  /** ISO-8601 expiry. We render a humanized "expiră în X zile" line. */
  expiresAtISO: string;
  /** Optional locale switch. Only `ro` is supported today. */
  locale?: 'ro';
};

export type ParentConsentEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function daysFromNow(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function buildParentConsentEmail(
  params: ParentConsentEmailParams
): ParentConsentEmailContent {
  const {confirmUrl, expiresAtISO} = params;
  const days = daysFromNow(expiresAtISO);
  const subject = 'Acord pentru contul copilului tău — Ce Să Fiu?';

  const text = [
    'Ce Să Fiu? — Orientare școlară pentru elevii din România',
    '',
    'Bună ziua,',
    '',
    'Copilul tău a creat un cont pe cesafiu.ro și a vrut să acceseze',
    'Profilul Complet — un set de teste validate științific despre',
    'personalitate și interese, gândit ca să-l ajute să-și aleagă mai bine',
    'liceul, facultatea sau cariera.',
    '',
    'Pentru că are sub 16 ani, avem nevoie de acordul unui părinte sau',
    'tutore. Confirmă apăsând linkul de mai jos:',
    '',
    confirmUrl,
    '',
    `Linkul este valabil ${days} zile.`,
    '',
    'Ce primește copilul după acord:',
    '  • IPIP-NEO-60 (Big Five complet)',
    '  • Vocațional Complet (interese aprofundate)',
    '  • Raport PDF descărcabil',
    '  • Salvare permanentă a rezultatelor în cont',
    '',
    'Dacă nu cunoști acest copil sau nu ai cerut acest email, ignoră-l —',
    'fără confirmare nu se întâmplă nimic.',
    '',
    'Politica de confidențialitate: https://cesafiu.ro/ro/confidentialitate',
    '',
    'cesafiu.ro · Acest email a fost trimis automat — nu răspunde.'
  ].join('\n');

  const html = `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Acord părinte — Ce Să Fiu?</title>
</head>
<body style="margin:0; padding:0; background:#fef9f1; font-family:'Be Vietnam Pro', Inter, Helvetica, Arial, sans-serif; color:#1d1c17;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Copilul tău a cerut acces la Profilul Complet pe Ce Să Fiu?. Confirmă acordul tău.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef9f1;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff; border:3px solid #000; box-shadow:6px 6px 0 #000;">

          <!-- Header bar -->
          <tr>
            <td style="background:#1d1c17; padding:18px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width:44px; height:44px; background:#1d1c17; border:2px solid #ffe170; text-align:center; vertical-align:middle; font-family:'Arial Black', Impact, sans-serif; font-size:30px; font-weight:900; color:#ffe170; line-height:44px;">?</td>
                        <td style="padding-left:14px; font-family:'Arial Black', Impact, sans-serif; font-size:22px; font-weight:900; color:#ffffff; letter-spacing:-0.5px;">CeSăFiu</td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle; font-size:11px; font-weight:700; letter-spacing:2px; color:#ffe170; text-transform:uppercase;">Orientare · România</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Purple accent banner -->
          <tr>
            <td style="background:#6b38d4; border-bottom:3px solid #000; padding:14px 32px; text-align:center; font-family:'Arial Black', Impact, sans-serif; font-size:13px; font-weight:900; letter-spacing:2px; text-transform:uppercase; color:#ffe170;">
              ✦ ACORD PĂRINTE / TUTORE ✦
            </td>
          </tr>

          <tr>
            <td style="padding:32px 32px 0;">
              <p style="margin:0; color:#6b38d4; font-size:12px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase;">CERERE DE CONFIRMARE</p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 0;">
              <h1 style="margin:0; font-family:'Arial Black', Impact, sans-serif; font-size:38px; line-height:1; font-weight:900; text-transform:uppercase; color:#1d1c17;">
                Confirmă că<br>ești de acord
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 32px 0;">
              <p style="margin:0; font-size:16px; line-height:1.55; color:#494454;">
                Copilul tău a creat un cont pe <strong style="color:#1d1c17;">Ce Să Fiu?</strong> — platforma de orientare școlară pentru elevii din România — și a vrut să acceseze <strong style="color:#1d1c17;">Profilul Complet</strong>: un set de teste validate științific despre personalitate și interese, gândit să-l ajute să-și aleagă mai bine liceul, facultatea sau cariera.
              </p>
              <p style="margin:14px 0 0; font-size:16px; line-height:1.55; color:#494454;">
                Pentru că are sub 16 ani, avem nevoie de acordul tău. Apasă butonul de mai jos ca să confirmi.
              </p>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#ffe170; border:3px solid #000; box-shadow:4px 4px 0 #000;">
                    <a href="${confirmUrl}" target="_blank" style="display:block; padding:16px 32px; font-family:'Arial Black', Impact, sans-serif; font-size:16px; font-weight:900; color:#1d1c17; text-decoration:none; text-transform:uppercase; letter-spacing:1px;">
                      Dau acordul →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry + fallback URL -->
          <tr>
            <td style="padding:20px 32px 0;">
              <p style="margin:0; font-size:13px; line-height:1.5; color:#494454; text-align:center;">
                Linkul expiră în <strong style="color:#1d1c17;">${days} zile</strong>.
              </p>
              <p style="margin:14px 0 0; font-size:13px; line-height:1.5; color:#494454;">
                Dacă butonul nu funcționează, copiază adresa de mai jos în browser:
              </p>
              <p style="margin:8px 0 0; font-size:12px; line-height:1.4; word-break:break-all;">
                <a href="${confirmUrl}" target="_blank" style="color:#6b38d4; text-decoration:underline;">${confirmUrl}</a>
              </p>
            </td>
          </tr>

          <!-- What does the child get? -->
          <tr>
            <td style="padding:24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef9f1; border:2px solid #000;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 10px; font-family:'Arial Black', Impact, sans-serif; font-size:11px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; color:#6b38d4;">CE PRIMEȘTE COPILUL DUPĂ ACORD</p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding:4px 0; font-size:14px; line-height:1.5; color:#1d1c17;"><strong>★</strong> &nbsp;IPIP-NEO-60 (Big Five complet)</td></tr>
                      <tr><td style="padding:4px 0; font-size:14px; line-height:1.5; color:#1d1c17;"><strong>★</strong> &nbsp;Vocațional Complet (interese aprofundate)</td></tr>
                      <tr><td style="padding:4px 0; font-size:14px; line-height:1.5; color:#1d1c17;"><strong>★</strong> &nbsp;Raport PDF descărcabil</td></tr>
                      <tr><td style="padding:4px 0; font-size:14px; line-height:1.5; color:#1d1c17;"><strong>★</strong> &nbsp;Salvare permanentă a rezultatelor în cont</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Security / privacy note -->
          <tr>
            <td style="padding:18px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#b8e7ff; border:2px solid #000;">
                <tr>
                  <td style="padding:14px 16px; font-size:13px; line-height:1.5; color:#1d1c17;">
                    <strong>Nu cunoști acest copil sau nu ai cerut acest email?</strong> Ignoră-l. Fără confirmare nu se întâmplă nimic, iar adresa ta nu este stocată în clar — păstrăm doar un cod criptat ca să prevenim duplicate.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Privacy link -->
          <tr>
            <td style="padding:16px 32px 32px; text-align:center;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#494454;">
                Detalii despre prelucrarea datelor:
                <a href="https://cesafiu.ro/ro/confidentialitate" style="color:#6b38d4; text-decoration:underline; font-weight:700;">Politica de confidențialitate</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fef9f1; border-top:2px solid #1d1c17; padding:20px 32px;">
              <p style="margin:0; font-size:11px; line-height:1.5; color:#494454; text-align:center;">
                Ce Să Fiu? · Platformă de orientare școlară pentru elevii din România<br>
                <a href="https://cesafiu.ro" style="color:#6b38d4; text-decoration:none; font-weight:700;">cesafiu.ro</a> · Acest email a fost trimis automat — nu răspunde.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return {subject, html, text};
}
