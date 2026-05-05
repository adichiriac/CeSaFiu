import {recordReferralEvent} from '@/lib/referrals/server';
import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';

type RequestBody = {
  referralCode?: string;
  source?: string;
  landingPath?: string;
  visitorId?: string;
};

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  const pepper = process.env.CONSENT_HASH_PEPPER;
  if (!supabase || !pepper) {
    return NextResponse.json({error: 'not_configured'}, {status: 500});
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({error: 'invalid_request'}, {status: 400});
  }

  try {
    const result = await recordReferralEvent(supabase, pepper, {
      referralCode: body.referralCode ?? '',
      eventType: 'click',
      visitorId: body.visitorId,
      source: body.source,
      landingPath: body.landingPath
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('referrals/click: failed', {error});
    return NextResponse.json({error: 'referral_event_failed'}, {status: 500});
  }
}
