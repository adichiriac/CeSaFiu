import type {SupabaseClient, User} from '@supabase/supabase-js';
import {randomBytes} from 'node:crypto';
import {hmacIdentifier} from '../consent';
import type {ReferralEventType, ReferralStats} from './constants';

type ReferralEventInput = {
  referralCode: string;
  eventType: ReferralEventType;
  visitorId?: string;
  referredUserId?: string;
  source?: string;
  landingPath?: string;
};

export function normalizeReferralCode(value: unknown) {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32)
    : '';
}

export function normalizeReferralSource(value: unknown) {
  return typeof value === 'string'
    ? value.trim().toLowerCase().replace(/[^a-z0-9_ -]/g, '').slice(0, 64)
    : null;
}

export function normalizeLandingPath(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) {
    return null;
  }

  return trimmed.slice(0, 300);
}

export async function getUserFromBearerToken(supabase: SupabaseClient, request: Request) {
  const authHeader = request.headers.get('authorization');
  const accessToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return null;
  }

  const {data, error} = await supabase.auth.getUser(accessToken);
  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getOrCreateReferralCode(supabase: SupabaseClient, user: User) {
  const {data: existing, error: existingError} = await supabase
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle<{code: string}>();

  if (existingError) {
    throw existingError;
  }

  if (existing?.code) {
    return existing.code;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomBytes(4).toString('hex');
    const {data, error} = await supabase
      .from('referral_codes')
      .insert({
        user_id: user.id,
        code,
        display_name: user.user_metadata?.name ?? null
      })
      .select('code')
      .single<{code: string}>();

    if (!error && data?.code) {
      return data.code;
    }

    if (error?.code !== '23505') {
      throw error;
    }
  }

  throw new Error('referral_code_generation_failed');
}

export async function getReferralStats(supabase: SupabaseClient, code: string): Promise<ReferralStats> {
  const [clicks, onboarded, testCompleted] = await Promise.all([
    countReferralEvents(supabase, code, 'click'),
    countReferralEvents(supabase, code, 'onboarded'),
    countReferralEvents(supabase, code, 'test_completed')
  ]);

  return {
    code,
    clicks,
    onboarded,
    testCompleted
  };
}

async function countReferralEvents(supabase: SupabaseClient, code: string, eventType: ReferralEventType) {
  const {count, error} = await supabase
    .from('referral_events')
    .select('id', {count: 'exact', head: true})
    .eq('referral_code', code)
    .eq('event_type', eventType)
    .gt('expires_at', new Date().toISOString());

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function recordReferralEvent(
  supabase: SupabaseClient,
  pepper: string,
  input: ReferralEventInput
) {
  const referralCode = normalizeReferralCode(input.referralCode);
  if (!referralCode) {
    return {recorded: false, reason: 'invalid_referral_code' as const};
  }

  const {data: referral, error: referralError} = await supabase
    .from('referral_codes')
    .select('user_id, code')
    .eq('code', referralCode)
    .maybeSingle<{user_id: string; code: string}>();

  if (referralError) {
    throw referralError;
  }

  if (!referral) {
    return {recorded: false, reason: 'unknown_referral_code' as const};
  }

  if (input.referredUserId && referral.user_id === input.referredUserId) {
    return {recorded: false, reason: 'self_referral' as const};
  }

  const anonymousVisitorHash = input.visitorId ? hmacIdentifier(input.visitorId, pepper) : null;
  if (!input.referredUserId && !anonymousVisitorHash) {
    return {recorded: false, reason: 'missing_visitor' as const};
  }

  const {error} = await supabase.from('referral_events').insert({
    referral_code: referralCode,
    referred_user_id: input.referredUserId ?? null,
    event_type: input.eventType,
    source: normalizeReferralSource(input.source),
    landing_path: normalizeLandingPath(input.landingPath),
    anonymous_visitor_hash: anonymousVisitorHash
  });

  if (error?.code === '23505') {
    return {recorded: false, reason: 'duplicate' as const};
  }

  if (error) {
    throw error;
  }

  return {recorded: true, reason: 'ok' as const};
}
