import {consentStatusForAgeBand, type AgeBand} from '@/lib/consent';
import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';

type RequestBody = {
  ageBand?: AgeBand;
};

const AGE_BANDS: AgeBand[] = ['10-12', '13-15', '16-17', '18+', 'parent'];

function isAgeBand(value: unknown): value is AgeBand {
  return typeof value === 'string' && AGE_BANDS.includes(value as AgeBand);
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({error: 'not_configured'}, {status: 500});
  }

  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return NextResponse.json({error: 'missing_session'}, {status: 401});
  }

  const {data: userData, error: userError} = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    return NextResponse.json({error: 'invalid_session'}, {status: 401});
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({error: 'invalid_request'}, {status: 400});
  }

  if (!isAgeBand(body.ageBand)) {
    return NextResponse.json({error: 'invalid_age_band'}, {status: 400});
  }

  const {data: existingProfile, error: existingError} = await supabase
    .from('profiles')
    .select('user_id, display_name, age_band, consent_status, parent_email_hash')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (existingError) {
    console.error('age-band: profile_read_failed', {userId: userData.user.id, error: existingError.message});
    return NextResponse.json({error: 'profile_read_failed'}, {status: 500});
  }

  if (
    existingProfile?.consent_status === 'pending_parent' ||
    existingProfile?.consent_status === 'parent_confirmed'
  ) {
    return NextResponse.json({error: 'locked_consent_state'}, {status: 409});
  }

  const nextProfile = {
    user_id: userData.user.id,
    display_name: userData.user.user_metadata?.name ?? existingProfile?.display_name ?? null,
    age_band: body.ageBand,
    consent_status: consentStatusForAgeBand(body.ageBand)
  };

  const {data: profile, error: profileError} = await supabase
    .from('profiles')
    .upsert(nextProfile, {onConflict: 'user_id'})
    .select('user_id, display_name, age_band, consent_status, parent_email_hash')
    .single();

  if (profileError) {
    console.error('age-band: profile_update_failed', {userId: userData.user.id, error: profileError.message});
    return NextResponse.json({error: 'profile_update_failed'}, {status: 500});
  }

  return NextResponse.json({profile});
}
