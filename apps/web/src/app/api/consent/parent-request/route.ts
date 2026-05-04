import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {createHash, randomBytes} from 'node:crypto';
import {NextResponse} from 'next/server';

type RequestBody = {
  parentEmail?: string;
};

function hashEmail(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

  const parentEmail = body.parentEmail?.trim().toLowerCase() ?? '';
  if (!isEmail(parentEmail)) {
    return NextResponse.json({error: 'invalid_parent_email'}, {status: 400});
  }

  const parentEmailHash = hashEmail(parentEmail);
  const consentToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const {data: profile, error: profileError} = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userData.user.id,
        display_name: userData.user.user_metadata?.name ?? null,
        age_band: '14-15',
        consent_status: 'pending_parent',
        parent_email_hash: parentEmailHash
      },
      {onConflict: 'user_id'}
    )
    .select('user_id, display_name, age_band, consent_status, parent_email_hash')
    .single();

  if (profileError) {
    return NextResponse.json({error: 'profile_update_failed'}, {status: 500});
  }

  const {error: tokenError} = await supabase.from('parent_consent_tokens').insert({
    token: consentToken,
    child_user_id: userData.user.id,
    parent_email_hash: parentEmailHash,
    expires_at: expiresAt
  });

  if (tokenError) {
    return NextResponse.json({error: 'consent_request_failed'}, {status: 500});
  }

  const {error: recordError} = await supabase.from('consent_records').insert({
    user_id: userData.user.id,
    event: 'parent_consent_requested',
    metadata: {
      delivery: 'pending_email_backend',
      has_parent_email: true
    }
  });

  if (recordError) {
    return NextResponse.json({error: 'consent_record_failed'}, {status: 500});
  }

  return NextResponse.json({profile});
}
