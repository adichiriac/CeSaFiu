/**
 * Short personalized referral redirect.
 *
 * `cesafiu.ro/r/CODE` → `cesafiu.ro/<default-locale>/?ref=CODE&utm_*`
 *
 * The card's footer URL renders as `cesafiu.ro/r/CODE` so it stays short and
 * scannable on Instagram Stories / WhatsApp screenshots. The existing
 * `<ReferralTracker>` captures the `?ref=` query on the landing page and
 * writes the first-touch entry to localStorage exactly like the existing
 * Phase A flow does for full-length share URLs.
 *
 * See docs/VIRAL-PHASE-D-PLAN.md §5 D1.1.
 */

import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {defaultLocale} from '@/i18n/config';
import {publicOriginFromRequest} from '@/lib/server/request-origin';

const CODE_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

export async function GET(request: NextRequest, context: {params: Promise<{code: string}>}) {
  const {code} = await context.params;

  // Defence in depth: bad codes redirect to the home page with no ref attached.
  // The Supabase referral_events table enforces the real validity check; this
  // is just to keep junk URLs from spamming the funnel.
  const safeCode = CODE_PATTERN.test(code) ? code : null;

  // Build the target against the *public* origin, not request.url, otherwise
  // Railway's internal http://localhost:8080 leaks into the Location header.
  const target = new URL(`/${defaultLocale}/`, publicOriginFromRequest(request));
  if (safeCode) {
    target.searchParams.set('ref', safeCode);
    target.searchParams.set('utm_source', 'share');
    target.searchParams.set('utm_medium', 'card');
    target.searchParams.set('utm_campaign', 'student_share');
  }

  return NextResponse.redirect(target, {status: 302});
}
