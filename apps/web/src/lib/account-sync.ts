import type {AgeBand, ConsentStatus} from '@/lib/consent';

type AccountProfile = {
  age_band: AgeBand;
  consent_status: ConsentStatus;
};

export function canPersistAccountData(profile: AccountProfile | null) {
  return Boolean(
    profile &&
      profile.age_band !== 'unknown' &&
      (profile.consent_status === 'self' || profile.consent_status === 'parent_confirmed')
  );
}

export function canClearLocalAccountData(profile: AccountProfile | null, syncConfirmed: boolean) {
  return canPersistAccountData(profile) && syncConfirmed;
}
