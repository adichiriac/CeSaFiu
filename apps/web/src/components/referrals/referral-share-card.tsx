'use client';

import {useAuthGate} from '@/components/auth/auth-provider';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import type {ReferralStats} from '@/lib/referrals/constants';
import {useTranslations} from 'next-intl';
import {useEffect, useMemo, useState} from 'react';

type ReferralShareCardProps = {
  archetype: string;
  locale: string;
};

type ReferralResponse = {
  blocked?: boolean;
  reason?: string;
  stats?: ReferralStats;
};

export default function ReferralShareCard({archetype, locale}: ReferralShareCardProps) {
  const t = useTranslations('referrals');
  const {user, profile, openAuthGate} = useAuthGate();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
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
      const token = await getAccessToken();
      if (!token) {
        return;
      }

      const response = await fetch('/api/referrals/me', {
        headers: {Authorization: `Bearer ${token}`}
      });
      const data = (await response.json()) as ReferralResponse;
      if (response.ok && !data.blocked && data.stats) {
        setStats(data.stats);
      }
    }

    void load();
  }, [canUseReferrals, user]);

  const shareUrl = useMemo(() => {
    if (!stats || typeof window === 'undefined') {
      return '';
    }

    return `${window.location.origin}/${locale}?ref=${stats.code}&utm_source=share&utm_campaign=student_share`;
  }, [locale, stats]);

  const shareText = stats ? t('shareText', {archetype, url: shareUrl}) : '';
  const whatsappUrl = stats ? `https://wa.me/?text=${encodeURIComponent(shareText)}` : '';

  async function copyLink() {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function nativeShare() {
    if (!shareUrl || typeof navigator === 'undefined' || !navigator.share) {
      await copyLink();
      return;
    }

    try {
      await navigator.share({
        title: t('nativeTitle'),
        text: shareText,
        url: shareUrl
      });
    } catch {
      // User cancelled native share.
    }
  }

  if (!user) {
    return (
      <section className="referralShareCard">
        <div className="referralCorner" aria-hidden="true">⌁</div>
        <h2>{t('title')}</h2>
        <p>{t('signedOutLead')}</p>
        <button className="referralWhatsApp" onClick={openAuthGate} type="button">
          {t('signInCTA')} <span>→</span>
        </button>
      </section>
    );
  }

  if (!canUseReferrals) {
    return (
      <section className="referralShareCard referralShareCard--blocked">
        <h2>{t('title')}</h2>
        <p>{t('blockedLead')}</p>
        <button className="referralWhatsApp" disabled type="button">
          {t('blockedCTA')}
        </button>
      </section>
    );
  }

  return (
    <section className="referralShareCard">
      <div className="referralCorner" aria-hidden="true">⌁</div>
      <h2>{t('title')}</h2>
      <p>{t('lead')}</p>
      <a className="referralWhatsApp" href={whatsappUrl} target="_blank" rel="noreferrer">
        {t('whatsappCTA')} <span>→</span>
      </a>
      <div className="referralSecondaryActions">
        <button type="button" onClick={copyLink}>{copied ? t('copiedCTA') : t('copyCTA')}</button>
        {typeof navigator !== 'undefined' && 'share' in navigator ? (
          <button type="button" onClick={nativeShare}>{t('nativeCTA')}</button>
        ) : null}
      </div>
      {stats ? (
        <p className="referralId">{t('referralId', {code: stats.code})}</p>
      ) : (
        <p className="referralId">{t('loading')}</p>
      )}
    </section>
  );
}

async function getAccessToken() {
  const supabase = getSupabaseBrowserClient();
  const {data} = supabase ? await supabase.auth.getSession() : {data: {session: null}};
  return data.session?.access_token;
}
