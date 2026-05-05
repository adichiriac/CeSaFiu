import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {getOrCreateReferralCode, getReferralStats, getUserFromBearerToken} from '@/lib/referrals/server';
import {NextResponse} from 'next/server';

type ProfileRow = {
  age_band: string;
  consent_status: string;
};

export async function GET(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({error: 'not_configured'}, {status: 500});
  }

  const user = await getUserFromBearerToken(supabase, request);
  if (!user) {
    return NextResponse.json({error: 'missing_session'}, {status: 401});
  }

  const {data: profile, error: profileError} = await supabase
    .from('profiles')
    .select('age_band, consent_status')
    .eq('user_id', user.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    console.error('referrals/me: profile_read_failed', {userId: user.id, error: profileError.message});
    return NextResponse.json({error: 'profile_read_failed'}, {status: 500});
  }

  if (!profile || profile.age_band === 'unknown') {
    return NextResponse.json({blocked: true, reason: 'age_required'});
  }

  if (!['self', 'parent_confirmed'].includes(profile.consent_status)) {
    return NextResponse.json({blocked: true, reason: 'parent_consent_required'});
  }

  try {
    const code = await getOrCreateReferralCode(supabase, user);
    const stats = await getReferralStats(supabase, code);
    return NextResponse.json({blocked: false, stats});
  } catch (error) {
    console.error('referrals/me: failed', {userId: user.id, error});
    return NextResponse.json({error: 'referral_stats_failed'}, {status: 500});
  }
}
