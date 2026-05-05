'use client';

import Link from 'next/link';
import {useTranslations} from 'next-intl';

type BottomNavSection = 'tests' | 'explore' | 'results' | 'saved';

type BottomNavProps = {
  active: BottomNavSection;
  locale: string;
};

export default function BottomNav({active, locale}: BottomNavProps) {
  const t = useTranslations('browse');

  return (
    <nav className="browseBottomNav" aria-label={t('primaryNav')}>
      <Link
        aria-current={active === 'tests' ? 'page' : undefined}
        className={active === 'tests' ? 'browseBottomItem isActive' : 'browseBottomItem'}
        href={`/${locale}`}
      >
        <span className="browseBottomIcon" aria-hidden="true">
          <svg className="browseBottomSvg" viewBox="0 0 24 24" focusable="false">
            <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9-.8-.8-2.1-.8-2.9-.1Z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-4A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22 22 0 0 1-4 2Z" />
            <path d="M9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0" />
            <path d="M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5" />
          </svg>
        </span>
        <span>{t('navTests')}</span>
      </Link>
      <Link
        aria-current={active === 'explore' ? 'page' : undefined}
        className={active === 'explore' ? 'browseBottomItem isActive' : 'browseBottomItem'}
        href={`/${locale}/browse`}
      >
        <span className="browseBottomIcon">⌕</span>
        <span>{t('navExplore')}</span>
      </Link>
      <Link
        aria-current={active === 'results' ? 'page' : undefined}
        className={active === 'results' ? 'browseBottomItem isActive' : 'browseBottomItem'}
        href={`/${locale}/rezultate`}
      >
        <span className="browseBottomIcon">★</span>
        <span>{t('navResults')}</span>
      </Link>
      <Link
        aria-current={active === 'saved' ? 'page' : undefined}
        className={active === 'saved' ? 'browseBottomItem isActive' : 'browseBottomItem'}
        href={`/${locale}/profil`}
      >
        <span className="browseBottomIcon">♥</span>
        <span>{t('navSaved')}</span>
      </Link>
    </nav>
  );
}
