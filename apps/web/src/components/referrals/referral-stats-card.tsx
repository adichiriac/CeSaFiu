'use client';

import {useAuthGate} from '@/components/auth/auth-provider';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import type {ReferralStats} from '@/lib/referrals/constants';
import {useTranslations} from 'next-intl';
import {useEffect, useState} from 'react';

type ReferralResponse = {
  blocked?: boolean;
  stats?: ReferralStats;
};

export default function ReferralStatsCard() {
  const t = useTranslations('referrals');
  const {user, profile, openAuthGate} = useAuthGate();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const canUseReferrals = Boolean(
    profile &&
      profile.age_band !== 'unknown' &&
      (profile.consent_status === 'self' || profile.consent_status === 'parent_confirmed')
  );

  useEffect(() => {
    if (!user || !canUseReferrals) {
      setStats(null);
      return;
    }

    async function load() {
      const supabase = getSupabaseBrowserClient();
      const {data} = supabase ? await supabase.auth.getSession() : {data: {session: null}};
      const token = data.session?.access_token;
      if (!token) {
        return;
      }

      const response = await fetch('/api/referrals/me', {
        headers: {Authorization: `Bearer ${token}`}
      });
      const body = (await response.json()) as ReferralResponse;
      if (response.ok && !body.blocked && body.stats) {
        setStats(body.stats);
      }
    }

    void load();
  }, [canUseReferrals, user]);

  if (!user) {
    return (
      <section className="profileSection">
        <div className="referralStatsCard">
          <h2>{t('profileTitle')}</h2>
          <p>{t('profileSignedOut')}</p>
          <button className="profileActionButton isYellow" onClick={openAuthGate} type="button">
            {t('signInCTA')}
          </button>
        </div>
      </section>
    );
  }

  if (!canUseReferrals) {
    return (
      <section className="profileSection">
        <div className="referralStatsCard">
          <h2>{t('profileTitle')}</h2>
          <p>{t('profileBlocked')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="profileSection">
      <div className="referralStatsCard">
        <div className="profileSectionHeader">
          <h2>{t('profileTitle')}</h2>
        </div>
        <div className="referralStatsGrid">
          <div>
            <span>{t('statsClicks')}</span>
            <strong>{stats?.clicks ?? '—'}</strong>
          </div>
          <div>
            <span>{t('statsOnboarded')}</span>
            <strong>{stats?.onboarded ?? '—'}</strong>
          </div>
          <div>
            <span>{t('statsCompleted')}</span>
            <strong>{stats?.testCompleted ?? '—'}</strong>
          </div>
        </div>
        <p className="referralId">
          {stats ? t('referralId', {code: stats.code}) : t('loading')}
        </p>
      </div>
    </section>
  );
}
