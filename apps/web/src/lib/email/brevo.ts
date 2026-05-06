/**
 * Brevo (ex-Sendinblue) transactional email client.
 *
 * Uses the REST API directly (POST /v3/smtp/email) instead of the SDK to avoid
 * a dependency. Never throws — always returns a Result-style object so callers
 * can branch on `ok` and decide whether to roll back side-effects.
 *
 * Env required:
 *   BREVO_API_KEY        — server-only, from Brevo → SMTP & API → API Keys
 *   EMAIL_FROM_ADDRESS   — verified sender, e.g. noreply@cesafiu.ro
 *   EMAIL_FROM_NAME      — optional, defaults to "Ce Să Fiu?"
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export type EmailRecipient = {email: string; name?: string};

export type SendEmailParams = {
  to: EmailRecipient | EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: EmailRecipient;
  tags?: string[];
};

export type SendEmailResult =
  | {ok: true; messageId: string}
  | {ok: false; status: number; error: string};

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  const fromName = process.env.EMAIL_FROM_NAME ?? 'Ce Să Fiu?';

  if (!apiKey || !fromAddress) {
    return {ok: false, status: 0, error: 'email_not_configured'};
  }

  const to = Array.isArray(params.to) ? params.to : [params.to];

  const payload: Record<string, unknown> = {
    sender: {name: fromName, email: fromAddress},
    to,
    subject: params.subject,
    htmlContent: params.htmlContent
  };
  if (params.textContent) payload.textContent = params.textContent;
  if (params.replyTo) payload.replyTo = params.replyTo;
  if (params.tags?.length) payload.tags = params.tags;

  let response: Response;
  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'unknown';
    return {ok: false, status: 0, error: `network_error: ${message}`};
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {ok: false, status: response.status, error: text || `http_${response.status}`};
  }

  const data = (await response.json().catch(() => ({}))) as {messageId?: string};
  return {ok: true, messageId: data.messageId ?? 'unknown'};
}

/**
 * Returns true if Brevo env is configured. Useful for skipping in dev/test
 * without throwing — caller can branch and use a console fallback.
 */
export function isEmailConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM_ADDRESS);
}
