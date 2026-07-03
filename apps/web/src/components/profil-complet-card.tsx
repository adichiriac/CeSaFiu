'use client';

/**
 * Profil Complet — compact row (P5 landing spec).
 *
 * Demoted from a hero-sized bundle card to a single compact row:
 * title + "120 itemi · gratuit în pilot" + borderless time badge + chevron.
 * Consent gating is unchanged: pending_parent users see a disabled row with
 * the "needs parent consent" badge — visible offer, no dead-end nav.
 *
 * Used on the landing page below the test cards. The /rezultate page
 * has its own equivalent bundle hook (results-client.tsx), and /profil has
 * a button-style equivalent inline.
 */

import Link from 'next/link';
import {useTranslations} from 'next-intl';
import {useAuthGate} from '@/components/auth/auth-provider';
import TimeBadge from '@/components/time-badge';

type ProfilCompletCardProps = {
  locale: string;
};

export default function ProfilCompletCard({locale}: ProfilCompletCardProps) {
  const t = useTranslations('home.profilCompletCard');
  const {profile} = useAuthGate();
  const blocked = profile?.consent_status === 'pending_parent';

  const label = t('label');
  const sub = t('sub');
  const minutes = t('minutes');
  const blockedAction = t('blockedAction');
  const footer = t('footer');
  const href = t('href');

  if (blocked) {
    return (
      <section className="homeBundleRow homeBundleRow--blocked" aria-labelledby="profil-complet-title">
        <span className="homeBundleCopy">
          <strong className="homeBundleLabel" id="profil-complet-title">
            {label}
          </strong>
          <span className="homeBundleSub">{sub}</span>
        </span>
        <span className="homeBundleRight">
          <span className="homeBundleBlockedBadge">{blockedAction}</span>
        </span>
        <p className="homeBundleFooter">{footer}</p>
      </section>
    );
  }

  return (
    <Link className="homeBundleRow" href={`/${locale}${href}`} aria-labelledby="profil-complet-title">
      <span className="homeBundleCopy">
        <strong className="homeBundleLabel" id="profil-complet-title">
          {label}
        </strong>
        <span className="homeBundleSub">{sub}</span>
      </span>
      <span className="homeBundleRight">
        <TimeBadge minutes={minutes} />
        <span className="homeBundleChevron" aria-hidden="true">
          ›
        </span>
      </span>
    </Link>
  );
}
