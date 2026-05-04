import {hmacIdentifier, hmacSecret, isUnder16AgeBand, type AgeBand} from '@/lib/consent';
import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {randomBytes} from 'node:crypto';
import {NextResponse} from 'next/server';

type RequestBody = {
  parentEmail?: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getRequestIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ??
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdminClient();
  const pepper = process.env.CONSENT_HASH_PEPPER;
  if (!supabase || !pepper) {
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

  const parentEmail = body.parentEmail?.trim().toLowerCase() ?? '';
  if (!isEmail(parentEmail)) {
    return NextResponse.json({error: 'invalid_parent_email'}, {status: 400});
  }

  const {data: existingProfile, error: existingError} = await supabase
    .from('profiles')
    .select('user_id, age_band, consent_status, parent_email_hash')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (existingError) {
    console.error('parent-request: profile_read_failed', {userId: userData.user.id, error: existingError.message});
    return NextResponse.json({error: 'profile_read_failed'}, {status: 500});
  }

  if (
    !existingProfile ||
    !isUnder16AgeBand(existingProfile.age_band as AgeBand) ||
    existingProfile.consent_status !== 'pending_parent'
  ) {
    return NextResponse.json({error: 'invalid_state'}, {status: 400});
  }

  const ipAddressHash = hmacIdentifier(getRequestIp(request), pepper);
  const userAgentHash = hmacIdentifier(request.headers.get('user-agent') ?? 'unknown', pepper);
  const rateLimitWindow = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const [{count: userRequestCount}, {count: ipRequestCount}] = await Promise.all([
    supabase
      .from('consent_records')
      .select('id', {count: 'exact', head: true})
      .eq('user_id', userData.user.id)
      .eq('event', 'parent_consent_requested')
      .gte('created_at', rateLimitWindow),
    supabase
      .from('consent_records')
      .select('id', {count: 'exact', head: true})
      .eq('ip_address_hash', ipAddressHash)
      .eq('event', 'parent_consent_requested')
      .gte('created_at', rateLimitWindow)
  ]);

  if ((userRequestCount ?? 0) >= 3 || (ipRequestCount ?? 0) >= 10) {
    return NextResponse.json({error: 'rate_limited'}, {status: 429});
  }

  const parentEmailHash = hmacIdentifier(parentEmail, pepper);
  const consentToken = randomBytes(32).toString('base64url');
  const consentTokenHash = hmacSecret(consentToken, pepper);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const {data: profile, error: profileError} = await supabase
    .from('profiles')
    .update({
      parent_email_hash: parentEmailHash
    })
    .eq('user_id', userData.user.id)
    .select('user_id, display_name, age_band, consent_status, parent_email_hash')
    .single();

  if (profileError) {
    console.error('parent-request: profile_update_failed', {userId: userData.user.id, error: profileError.message});
    return NextResponse.json({error: 'profile_update_failed'}, {status: 500});
  }

  const {error: tokenError} = await supabase.from('parent_consent_tokens').insert({
    token: consentTokenHash,
    child_user_id: userData.user.id,
    parent_email_hash: parentEmailHash,
    expires_at: expiresAt
  });

  if (tokenError) {
    console.error('parent-request: consent_request_failed', {userId: userData.user.id, error: tokenError.message});
    return NextResponse.json({error: 'consent_request_failed'}, {status: 500});
  }

  const {error: recordError} = await supabase.from('consent_records').insert({
    user_id: userData.user.id,
    event: 'parent_consent_requested',
    metadata: {
      delivery: 'pending_email_backend',
      has_parent_email: true
    },
    ip_address_hash: ipAddressHash,
    user_agent_hash: userAgentHash
  });

  if (recordError) {
    console.error('parent-request: consent_record_failed', {userId: userData.user.id, error: recordError.message});
    return NextResponse.json({error: 'consent_record_failed'}, {status: 500});
  }

  return NextResponse.json({profile});
}
