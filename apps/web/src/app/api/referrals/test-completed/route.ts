import {getUserFromBearerToken, recordReferralEvent} from '@/lib/referrals/server';
import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';

type RequestBody = {
  referralCode?: string;
  source?: string;
  landingPath?: string;
  visitorId?: string;
};

type ProfileRow = {
  age_band: string;
  consent_status: string;
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

  const user = await getUserFromBearerToken(supabase, request);
  const referredUserId = user ? await getAttributableUserId(supabase, user.id) : undefined;

  try {
    const result = await recordReferralEvent(supabase, pepper, {
      referralCode: body.referralCode ?? '',
      eventType: 'test_completed',
      visitorId: body.visitorId,
      referredUserId,
      source: body.source,
      landingPath: body.landingPath
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('referrals/test-completed: failed', {error});
    return NextResponse.json({error: 'referral_event_failed'}, {status: 500});
  }
}

async function getAttributableUserId(supabase: NonNullable<ReturnType<typeof getSupabaseAdminClient>>, userId: string) {
  const {data: profile} = await supabase
    .from('profiles')
    .select('age_band, consent_status')
    .eq('user_id', userId)
    .maybeSingle<ProfileRow>();

  if (!profile || profile.age_band === 'unknown' || !['self', 'parent_confirmed'].includes(profile.consent_status)) {
    return undefined;
  }

  return userId;
}
