'use client';

import BottomNav from '@/components/bottom-nav';
import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {buildMatchRequest, readStoredResults, useQuizStore} from '@/stores/quiz-store';
import {useAuthGate} from '@/components/auth/auth-provider';
import ReferralStatsCard from '@/components/referrals/referral-stats-card';
import type {Career, CareerMatch, MatchResult, UserProfile} from '@/lib/matcher';

type ProfileClientProps = {
  careers: Career[];
  locale: string;
};

const RIASEC_NAMES: Record<string, string> = {
  R: 'Realist',
  I: 'Investigativ',
  A: 'Artistic',
  S: 'Social',
  E: 'Intreprinzator',
  C: 'Conventional',
};

const PATH_NAMES: Record<string, string> = {
  facultate: 'Facultate',
  autodidact: 'Autodidact',
  antreprenor: 'Antreprenor',
  profesional: 'Profesional',
  creator: 'Creator',
  freelance: 'Freelance',
  mixt: 'Mixt',
};

const CAREER_COLORS: Record<string, string> = {
  purple: 'var(--purple)',
  yellow: 'var(--yellow)',
  green: 'var(--green)',
};

function topEntries(tally: Record<string, number> | undefined, limit: number) {
  return Object.entries(tally ?? {})
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export default function ProfileClient({careers, locale}: ProfileClientProps) {
  const t = useTranslations('profil');
  const {profile, savedPath} = useAuthGate();
  const {savedCareerIds} = useQuizStore();
  const [status, setStatus] = useState<'loading' | 'empty' | 'ready' | 'error'>('loading');
  const [result, setResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    const stored = readStoredResults();
    const hasAny = Object.values(stored).some(Boolean);

    if (!hasAny) {
      setStatus('empty');
      return;
    }

    fetch('/api/match', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(buildMatchRequest(stored)),
    })
      .then((r) => r.json())
      .then((data: {matches: CareerMatch[]; confidence: number; sources: string[]; userProfile: UserProfile}) => {
        const matches = Object.assign(data.matches ?? [], {
          confidence: data.confidence,
          sources: data.sources,
          userProfile: data.userProfile,
        }) as unknown as MatchResult;
        setResult(matches);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  const saved = useMemo(
    () => careers.filter((career) => savedCareerIds.includes(career.id)),
    [careers, savedCareerIds],
  );
  const hasProfile = Boolean(status === 'ready' && result?.userProfile);
  const userProfile = result?.userProfile;
  const topRiasec = topEntries(userProfile?.riasec, 3);
  const topPath = topEntries(userProfile?.paths, 1)[0];
  const topMatches = hasProfile && result ? result.slice(0, 3) : [];
  const big5 = userProfile?.big5;
  const sources = result?.sources ?? [];
  const needsParentConsent = profile?.consent_status === 'pending_parent';
  const savedPathName = savedPath?.path_name ?? savedPath?.path_id;

  return (
    <main className="profilePage">
      <section className="profileCanvas">
        <header className="profileHeader">
          <Link className="miniBrand" href={`/${locale}`}>
            <span>{t('brandCe')}</span>
            <strong>{t('brandRest')}</strong>
          </Link>
          <Link className="profileHeaderAction" href={`/${locale}/test/scenarii`}>
            {t('retakeShort')}
          </Link>
        </header>

        <div className="profileIntro">
          <h1>{t('title')}</h1>
          <p>{hasProfile ? t('leadReady') : t('leadEmpty')}</p>
        </div>

        <section className="profileHeroCard">
          {status === 'loading' && (
            <>
              <p className="profileEyebrow">{t('loading')}</p>
              <h2>{t('loadingTitle')}</h2>
            </>
          )}

          {status === 'error' && (
            <>
              <p className="profileEyebrow">{t('error')}</p>
              <h2>{t('emptyTitle')}</h2>
              <p>{t('emptyBody')}</p>
            </>
          )}

          {!hasProfile && status !== 'loading' && status !== 'error' && (
            <>
              <p className="profileEyebrow">{t('formingEyebrow')}</p>
              <h2>{t('formingTitle')}</h2>
              <p>{t('formingBody')}</p>
              <div className="profileHeroActions">
                <Link className="profileActionButton isYellow" href={`/${locale}/test/scenarii`}>
                  {t('startScenarios')}
                </Link>
                {needsParentConsent ? (
                  <button className="profileActionButton isDark" disabled type="button">
                    {t('parentPending')}
                  </button>
                ) : (
                  <Link className="profileActionButton isDark" href={`/${locale}/test/ipip-neo-60`}>
                    {t('startProfilComplet')}
                  </Link>
                )}
              </div>
            </>
          )}

          {hasProfile && (
            <>
              <p className="profileEyebrow">{t('profileEyebrow')}</p>
              <div className="profileTagCloud">
                {topRiasec.map(([code], index) => (
                  <span className={index === 0 ? 'isPrimary' : ''} key={code}>
                    {code} · {RIASEC_NAMES[code] ?? code}
                  </span>
                ))}
              </div>

              {savedPathName ? (
                <p className="profilePathLine">
                  {t('savedPathPrefix')} <mark>{savedPathName}</mark>
                </p>
              ) : topPath && (
                <p className="profilePathLine">
                  {t('pathPrefix')} <mark>{PATH_NAMES[topPath[0]] ?? topPath[0]}</mark>
                </p>
              )}

              {big5 && Object.keys(big5).length > 0 && (
                <div className="profileBig5Line">
                  {['O', 'C', 'E', 'A', 'N']
                    .filter((key) => typeof big5[key] === 'number')
                    .map((key) => `${key} ${big5[key]}%`)
                    .join(' · ')}
                </div>
              )}

              <div className="profileStatGrid">
                <div>
                  <span>{t('testsDone')}</span>
                  <strong>{sources.length}</strong>
                </div>
                <div>
                  <span>{t('saved')}</span>
                  <strong>{saved.length + (savedPath ? 1 : 0)}</strong>
                </div>
                <div>
                  <span>{t('matches')}</span>
                  <strong>{topMatches.length}</strong>
                </div>
              </div>
            </>
          )}
        </section>

        {topMatches.length > 0 && (
          <section className="profileSection">
            <div className="profileSectionHeader">
              <h2>{t('forYouTitle')}</h2>
              <Link href={`/${locale}/browse`}>{t('exploreAll')}</Link>
            </div>
            <div className="profileMatchRail">
              {topMatches.map((match, index) => (
                <Link
                  className={index === 0 ? 'profileMatchCard isPrimary' : 'profileMatchCard'}
                  href={`/${locale}/cariera/${match.career.id}`}
                  key={match.career.id}
                >
                  <div className="profileMatchTop">
                    <span
                      className="profileCareerEmoji"
                      style={{
                        background: CAREER_COLORS[match.career.color] ?? 'var(--purple)',
                        color: match.career.color === 'purple' ? '#fff' : '#000',
                      }}
                    >
                      {match.career.emoji}
                    </span>
                    <strong>{match.score}%</strong>
                  </div>
                  <h3>{match.career.name}</h3>
                  <p>{match.career.tagline}</p>
                  <span className="profileCardCTA">{t('seeMore')}</span>
                </Link>
              ))}
              <Link className="profileMatchCard profileExploreCard" href={`/${locale}/browse`}>
                <div className="profilePlus">+</div>
                <h3>{t('exploreCardTitle')}</h3>
                <p>{t('exploreCardBody')}</p>
                <span className="profileCardCTA">{t('explore')}</span>
              </Link>
            </div>
          </section>
        )}

        <ReferralStatsCard />

        <section className="profileSection">
          <div className="profileSectionHeader">
            <h2>{t('savedTitle')}</h2>
          </div>

          {savedPathName && (
            <div className="profileSavedPathCard">
              <span aria-hidden="true">★</span>
              <span>
                <strong>{t('savedPathTitle')}: {savedPathName}</strong>
                <small>{t('savedPathBody')}</small>
              </span>
              <Link href={`/${locale}/browse`}>{t('savedPathChange')}</Link>
            </div>
          )}

          {saved.length === 0 && !savedPath ? (
            <div className="profileEmptyCard">
              <div aria-hidden="true">✦</div>
              <h3>{t('savedEmptyTitle')}</h3>
              <p>{t('savedEmptyBody')}</p>
              <Link className="profileActionButton isYellow" href={`/${locale}/test/scenarii`}>
                {t('retake')}
              </Link>
            </div>
          ) : (
            <div className="profileSavedList">
              {saved.map((career, index) => (
                <Link
                  className={index === 0 ? 'profileSavedCard isPrimary' : 'profileSavedCard'}
                  href={`/${locale}/cariera/${career.id}`}
                  key={career.id}
                >
                  <span
                    className="profileCareerEmoji"
                    style={{
                      background: CAREER_COLORS[career.color] ?? 'var(--purple)',
                      color: career.color === 'purple' ? '#fff' : '#000',
                    }}
                  >
                    {career.emoji}
                  </span>
                  <span>
                    <strong>{career.name}</strong>
                    <small>{career.tagline}</small>
                  </span>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="profileRetakeBlock">
          <Link className="profileActionButton isYellow" href={`/${locale}/test/scenarii`}>
            {t('retake')}
          </Link>
        </div>
      </section>

      <BottomNav active="saved" locale={locale} />
    </main>
  );
}
