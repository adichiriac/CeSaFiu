export const REFERRAL_PARAM = 'ref';
export const REFERRAL_STORAGE_KEY = 'cesafiu:referral:first-touch';
export const REFERRAL_VISITOR_KEY = 'cesafiu:referral:visitor-id';
export const REFERRAL_ONBOARDED_KEY_PREFIX = 'cesafiu:referral:onboarded:';
export const REFERRAL_TEST_COMPLETED_KEY_PREFIX = 'cesafiu:referral:test-completed:';
export const REFERRAL_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type ReferralEventType = 'click' | 'onboarded' | 'test_completed';

export type StoredReferral = {
  code: string;
  source: string;
  landingPath: string;
  capturedAt: number;
  expiresAt: number;
};

export type ReferralStats = {
  code: string;
  clicks: number;
  onboarded: number;
  testCompleted: number;
};
