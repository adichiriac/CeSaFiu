'use client';

import {
  REFERRAL_ONBOARDED_KEY_PREFIX,
  REFERRAL_PARAM,
  REFERRAL_STORAGE_KEY,
  REFERRAL_TEST_COMPLETED_KEY_PREFIX,
  REFERRAL_TTL_MS,
  REFERRAL_VISITOR_KEY,
  type ReferralEventType,
  type StoredReferral
} from './constants';

function safeLocalStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getOrCreateReferralVisitorId() {
  const storage = safeLocalStorage();
  if (!storage) {
    return null;
  }

  const existing = storage.getItem(REFERRAL_VISITOR_KEY);
  if (existing) {
    return existing;
  }

  const next = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  storage.setItem(REFERRAL_VISITOR_KEY, next);
  return next;
}

export function getStoredReferral() {
  const storage = safeLocalStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(REFERRAL_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredReferral;
    if (!parsed.code || parsed.expiresAt <= Date.now()) {
      storage.removeItem(REFERRAL_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(REFERRAL_STORAGE_KEY);
    return null;
  }
}

export async function captureInboundReferral(searchParams: URLSearchParams, landingPath: string) {
  const code = searchParams.get(REFERRAL_PARAM)?.trim();
  if (!code || getStoredReferral()) {
    return;
  }

  const storage = safeLocalStorage();
  const visitorId = getOrCreateReferralVisitorId();
  if (!storage || !visitorId) {
    return;
  }

  const source = searchParams.get('utm_source')?.trim().slice(0, 64) || 'direct';
  const capturedAt = Date.now();
  const referral: StoredReferral = {
    code,
    source,
    landingPath,
    capturedAt,
    expiresAt: capturedAt + REFERRAL_TTL_MS
  };

  storage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(referral));
  await postReferralEvent('click', referral, visitorId);
}

export async function recordReferralOnboarded(accessToken?: string) {
  const referral = getStoredReferral();
  const visitorId = getOrCreateReferralVisitorId();
  const storage = safeLocalStorage();
  if (!referral || !visitorId || !storage) {
    return;
  }

  const key = `${REFERRAL_ONBOARDED_KEY_PREFIX}${referral.code}`;
  if (storage.getItem(key)) {
    return;
  }

  const recorded = await postReferralEvent('onboarded', referral, visitorId, accessToken);
  if (recorded) {
    storage.setItem(key, new Date().toISOString());
  }
}

export async function recordReferralTestCompleted(testSlug: string, accessToken?: string) {
  const referral = getStoredReferral();
  const visitorId = getOrCreateReferralVisitorId();
  const storage = safeLocalStorage();
  if (!referral || !visitorId || !storage) {
    return;
  }

  const key = `${REFERRAL_TEST_COMPLETED_KEY_PREFIX}${referral.code}`;
  if (storage.getItem(key)) {
    return;
  }

  const recorded = await postReferralEvent('test_completed', referral, visitorId, accessToken, {testSlug});
  if (recorded) {
    storage.setItem(key, new Date().toISOString());
  }
}

async function postReferralEvent(
  eventType: ReferralEventType,
  referral: StoredReferral,
  visitorId: string,
  accessToken?: string,
  metadata?: Record<string, unknown>
) {
  const endpoint = eventType === 'test_completed' ? 'test-completed' : eventType;
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(`/api/referrals/${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        referralCode: referral.code,
        source: referral.source,
        landingPath: referral.landingPath,
        visitorId,
        metadata
      })
    });
    return response.ok;
  } catch {
    // Referral telemetry should never block the quiz flow.
    return false;
  }
}
