import {canConfirmToken, hmacSecret} from '@/lib/consent';
import {getSupabaseAdminClient} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';

/**
 * GET /api/consent/parent-confirm?token=<unhashed-token>
 *
 * The parent clicks this link from the consent email. We:
 *   1. Hash the supplied token with the same HMAC pepper used at request time.
 *   2. Look up the matching parent_consent_tokens row.
 *   3. Constant-time compare via canConfirmToken, check expiry + used_at.
 *   4. Flip the child's profile to `parent_confirmed`.
 *   5. Mark the token used and append an audit row.
 *   6. Redirect to /<locale>/acord-parinte?status=<state> so the token never
 *      appears in the parent's browser history beyond the initial click.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const locale = url.searchParams.get('locale') ?? 'ro';
  const appUrl = (process.env.APP_URL ?? url.origin).replace(/\/$/, '');

  type Status = 'confirmed' | 'expired' | 'invalid' | 'already_used' | 'error';
  const redirect = (status: Status) =>
    NextResponse.redirect(`${appUrl}/${locale}/acord-parinte?status=${status}`, {status: 303});

  if (!token) return redirect('invalid');

  const supabase = getSupabaseAdminClient();
  const pepper = process.env.CONSENT_HASH_PEPPER;
  if (!supabase || !pepper) {
    console.error('parent-confirm: not_configured');
    return redirect('error');
  }

  const tokenHash = hmacSecret(token, pepper);

  const {data: tokenRow, error: tokenLookupError} = await supabase
    .from('parent_consent_tokens')
    .select('token, child_user_id, parent_email_hash, expires_at, used_at')
    .eq('token', tokenHash)
    .maybeSingle();

  if (tokenLookupError) {
    console.error('parent-confirm: token_lookup_failed', {error: tokenLookupError.message});
    return redirect('error');
  }
  if (!tokenRow) return redirect('invalid');

  // Defense in depth: even though we looked up by hash, also constant-time
  // compare the stored hash against a fresh recomputation.
  if (!canConfirmToken(tokenRow.token, tokenHash)) {
    return redirect('invalid');
  }

  if (tokenRow.used_at) return redirect('already_used');
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) return redirect('expired');

  // Mark the token used FIRST, gated on used_at IS NULL, so concurrent clicks
  // don't double-confirm. If the conditional update affects 0 rows, somebody
  // else already won the race.
  const {data: usedRow, error: tokenUpdateError} = await supabase
    .from('parent_consent_tokens')
    .update({used_at: new Date().toISOString()})
    .eq('token', tokenHash)
    .is('used_at', null)
    .select('token')
    .maybeSingle();

  if (tokenUpdateError) {
    console.error('parent-confirm: token_update_failed', {error: tokenUpdateError.message});
    return redirect('error');
  }
  if (!usedRow) {
    // Another tab/click already used it.
    return redirect('already_used');
  }

  const {error: profileError} = await supabase
    .from('profiles')
    .update({consent_status: 'parent_confirmed'})
    .eq('user_id', tokenRow.child_user_id);

  if (profileError) {
    console.error('parent-confirm: profile_update_failed', {
      childUserId: tokenRow.child_user_id,
      error: profileError.message
    });
    // Don't roll back used_at — re-clicking the same link should still NOT
    // re-grant consent. The audit row below will note the failure.
    await supabase.from('consent_records').insert({
      user_id: tokenRow.child_user_id,
      event: 'parent_consent_confirm_failed',
      metadata: {reason: 'profile_update_failed'}
    });
    return redirect('error');
  }

  await supabase.from('consent_records').insert({
    user_id: tokenRow.child_user_id,
    event: 'parent_consent_confirmed',
    metadata: {
      parent_email_hash: tokenRow.parent_email_hash
    }
  });

  return redirect('confirmed');
}
