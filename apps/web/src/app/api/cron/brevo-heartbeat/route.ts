/**
 * POST /api/cron/brevo-heartbeat
 *
 * Weekly status email to the admin, sent through the Brevo REST API.
 * Two jobs in one:
 *   1. Keeps BREVO_API_KEY in active use (Brevo can deactivate keys that sit
 *      unused; parent-consent emails alone are too rare to guarantee that).
 *   2. Gives Adi a tiny weekly pulse: new accounts, synced results, feedback.
 *
 * Called by .github/workflows/brevo-heartbeat.yml with
 *   Authorization: Bearer $CRON_SECRET
 *
 * Env:
 *   CRON_SECRET            — shared secret (Railway + GitHub Actions secret)
 *   HEARTBEAT_EMAIL_TO     — recipient (falls back to EMAIL_FROM_ADDRESS)
 *   BREVO_API_KEY, EMAIL_FROM_ADDRESS — see lib/email/brevo.ts
 */

import {isEmailConfigured, sendEmail} from '@/lib/email/brevo';
import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;

  const header = request.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Stats = {
  accountsTotal: number | null;
  accountsWeek: number | null;
  resultsWeek: number | null;
  feedbackWeek: number | null;
};

async function collectStats(): Promise<Stats> {
  const empty: Stats = {accountsTotal: null, accountsWeek: null, resultsWeek: null, feedbackWeek: null};
  const supabase = getSupabaseAdminClient();
  if (!supabase) return empty;

  const since = new Date(Date.now() - WEEK_MS).toISOString();
  const count = async (table: string, column?: string) => {
    let query = supabase.from(table).select('*', {count: 'exact', head: true});
    if (column) query = query.gte(column, since);
    const {count: value, error} = await query;
    return error ? null : value;
  };

  const [accountsTotal, accountsWeek, resultsWeek, feedbackWeek] = await Promise.all([
    count('profiles'),
    count('profiles', 'created_at'),
    count('test_results', 'updated_at'),
    count('feedback_submissions', 'created_at')
  ]);

  return {accountsTotal, accountsWeek, resultsWeek, feedbackWeek};
}

function fmt(value: number | null) {
  return value === null ? '—' : String(value);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({error: 'unauthorized'}, {status: 401});
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({error: 'email_not_configured'}, {status: 503});
  }

  const to = process.env.HEARTBEAT_EMAIL_TO ?? process.env.EMAIL_FROM_ADDRESS;
  if (!to) {
    return NextResponse.json({error: 'recipient_not_configured'}, {status: 503});
  }

  const stats = await collectStats();
  const date = new Date().toLocaleDateString('ro-RO', {timeZone: 'Europe/Bucharest'});
  const rows: [string, string][] = [
    ['Conturi noi (7 zile)', fmt(stats.accountsWeek)],
    ['Conturi total', fmt(stats.accountsTotal)],
    ['Rezultate sincronizate (7 zile)', fmt(stats.resultsWeek)],
    ['Feedback primit (7 zile)', fmt(stats.feedbackWeek)]
  ];

  const result = await sendEmail({
    to: {email: to},
    subject: `Ce Să Fiu? · puls săptămânal · ${date}`,
    htmlContent: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#15110d">
<p><strong>Ce Să Fiu? — puls săptămânal</strong> (${date})</p>
<table cellpadding="6" style="border-collapse:collapse">${rows
      .map(([label, value]) => `<tr><td style="border:1px solid #ddd">${label}</td><td style="border:1px solid #ddd"><strong>${value}</strong></td></tr>`)
      .join('')}</table>
<p style="color:#666;font-size:12px">Trimis automat de /api/cron/brevo-heartbeat — ține cheia Brevo API activă.</p>
</div>`,
    textContent: `Ce Să Fiu? — puls săptămânal (${date})\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}`,
    tags: ['heartbeat']
  });

  if (!result.ok) {
    console.error('brevo-heartbeat: send_failed', {status: result.status, error: result.error.slice(0, 300)});
    // 502 makes the GitHub Action fail → GitHub emails you that the key may be dead.
    return NextResponse.json({error: 'email_send_failed', status: result.status}, {status: 502});
  }

  return NextResponse.json({ok: true, messageId: result.messageId});
}
