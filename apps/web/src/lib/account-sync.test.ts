import {describe, expect, it} from 'vitest';
import {canClearLocalAccountData, canPersistAccountData} from './account-sync';

describe('account sync safety', () => {
  it('does not persist before age or parental consent is resolved', () => {
    expect(canPersistAccountData({age_band: 'unknown', consent_status: 'self'})).toBe(false);
    expect(canPersistAccountData({age_band: '13-15', consent_status: 'pending_parent'})).toBe(false);
    expect(canPersistAccountData({age_band: '16-17', consent_status: 'revoked'})).toBe(false);
  });

  it('allows persistence for eligible profiles', () => {
    expect(canPersistAccountData({age_band: '16-17', consent_status: 'self'})).toBe(true);
    expect(canPersistAccountData({age_band: '13-15', consent_status: 'parent_confirmed'})).toBe(true);
  });

  it('clears local data only after the remote sync was confirmed', () => {
    const profile = {age_band: '18+' as const, consent_status: 'self' as const};
    expect(canClearLocalAccountData(profile, false)).toBe(false);
    expect(canClearLocalAccountData(profile, true)).toBe(true);
  });
});
