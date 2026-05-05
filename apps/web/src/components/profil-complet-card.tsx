'use client';

/**
 * Profil Complet bundle card.
 *
 * Renders the deep bundle (IPIP-NEO-60 + Vocațional Complet + PDF report)
 * with a consent-aware CTA. The bundle is free during the pilot and structured
 * so it can become a paid product later. For pending_parent users the CTA is
 * disabled with a "needs parent consent" badge — visible offer, no dead-end nav.
 *
 * Used on the landing page below the free-tests rail. The /rezultate page
 * has its own equivalent bundle hook (results-client.tsx), and /profil has
 * a button-style equivalent inline.
 *
 * See docs/PAID-BUNDLE-POSITIONING.md.
 */

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {useAuthGate} from '@/components/auth/auth-provider';

type ProfilCompletCardProps = {
  locale: string;
};

export default function ProfilCompletCard({locale}: ProfilCompletCardProps) {
  const t = useTranslations('home.profilCompletCard');
  const {profile} = useAuthGate();
  const blocked = profile?.consent_status === 'pending_parent';

  const eyebrow = t('eyebrow');
  const label = t('label');
  const sub = t('sub');
  const description = t('description');
  const action = t('action');
  const blockedAction = t('blockedAction');
  const footer = t('footer');
  const href = t('href');

  if (blocked) {
    return (
      <section
        className="prototypeBundleCard prototypeBundleCard--blocked"
        aria-labelledby="profil-complet-title"
      >
        <span className="prototypeBundleEyebrow">{eyebrow}</span>
        <strong className="prototypeBundleLabel" id="profil-complet-title">
          {label}
        </strong>
        <span className="prototypeBundleSub">{sub}</span>
        <p className="prototypeBundleDescription">{description}</p>
        <button
          className="prototypeBundleAction prototypeBundleAction--blocked"
          disabled
          type="button"
        >
          {blockedAction}
        </button>
        <p className="prototypeBundleFooter">{footer}</p>
      </section>
    );
  }

  return (
    <Link
      className="prototypeBundleCard"
      href={`/${locale}${href}`}
      aria-labelledby="profil-complet-title"
    >
      <span className="prototypeBundleEyebrow">{eyebrow}</span>
      <strong className="prototypeBundleLabel" id="profil-complet-title">
        {label}
      </strong>
      <span className="prototypeBundleSub">{sub}</span>
      <p className="prototypeBundleDescription">{description}</p>
      <span className="prototypeBundleAction">{action}</span>
    </Link>
  );
}
