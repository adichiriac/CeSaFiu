'use client';

import BottomNav from '@/components/bottom-nav';
import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {buildMatchRequest, readStoredResults, useQuizStore} from '@/stores/quiz-store';
import {useAuthGate} from '@/components/auth/auth-provider';
import ReferralStatsCard from '@/components/referrals/referral-stats-card';
import type {PathEntry} from '@/lib/careers/types';
import type {Career, CareerMatch, MatchResult, UserProfile} from '@/lib/matcher';

type ProfileTFunc = ReturnType<typeof useTranslations<'profil'>>;

type ProfileClientProps = {
  careers: Career[];
  locale: string;
  paths: (PathEntry & {emoji?: string; color?: string; tagline?: string; duration?: string; cost?: string})[];
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

export default function ProfileClient({careers, locale, paths}: ProfileClientProps) {
  const t = useTranslations('profil');
  const {profile, savedPath} = useAuthGate();
  const {savedCareerIds} = useQuizStore();
  const [status, setStatus] = useState<'loading' | 'empty' | 'ready' | 'error'>('loading');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [completedTests, setCompletedTests] = useState(0);

  useEffect(() => {
    const stored = readStoredResults();
    const hasAny = Object.values(stored).some(Boolean);
    setCompletedTests(Object.values(stored).filter(Boolean).length);

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
  const topMatch = topMatches[0];
  const big5 = userProfile?.big5;
  const needsParentConsent = profile?.consent_status === 'pending_parent';
  const savedPathName = savedPath?.path_name ?? savedPath?.path_id;
  const savedPathDetails = savedPath ? paths.find((path) => path.id === savedPath.path_id) : null;
  const isFresh = !hasProfile && saved.length === 0 && !savedPath;

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
          <p>{topMatch ? t('phaseLeadMatch', {career: topMatch.career.name, score: topMatch.score}) : t('phaseLeadEmpty')}</p>
        </div>

        <section className="profileIdentityCard">
          <div className="profileAvatar" aria-hidden="true">{t('avatarLetter')}</div>
          <div className="profileIdentityCopy">
            <h2>{t('identityTitle')}</h2>
            <p>{savedPathName ? t('identityWithPath', {path: savedPathName}) : t('identityLead')}</p>
          </div>
          <div className="profileIdentityStats">
            <div><span>{t('testsDone')}</span><strong>{t('testsProgress', {count: completedTests, total: 5})}</strong></div>
            <div><span>{t('saved')}</span><strong>{saved.length + (savedPath ? 1 : 0)}</strong></div>
            <div><span>{t('matches')}</span><strong>{topMatches.length}</strong></div>
            <div><span>{t('pathStat')}</span><strong>{savedPath ? '✓' : '—'}</strong></div>
          </div>
        </section>

        {status === 'loading' ? (
          <section className="profileFluidCard">
            <p className="profileEyebrow">{t('loading')}</p>
            <h2>{t('loadingTitle')}</h2>
          </section>
        ) : null}

        {status === 'error' ? (
          <section className="profileFluidCard">
            <p className="profileEyebrow">{t('error')}</p>
            <h2>{t('emptyTitle')}</h2>
            <p>{t('emptyBody')}</p>
          </section>
        ) : null}

        {isFresh && status !== 'loading' && status !== 'error' ? (
          <section className="profileSection">
            <div className="profileSectionHeader">
              <h2>{t('startTitle')}</h2>
            </div>
            <div className="profileStartGrid">
              <Link className="profileStartCard isYellow" href={`/${locale}/test/scenarii`}>
                <span>✦</span>
                <strong>{t('startScenarios')}</strong>
                <small>{t('startScenariosMeta')}</small>
              </Link>
              <Link className="profileStartCard" href={`/${locale}/browse`}>
                <span>⌕</span>
                <strong>{t('startExplore')}</strong>
                <small>{t('startExploreMeta')}</small>
              </Link>
              {needsParentConsent ? (
                <button className="profileStartCard isGreen" disabled type="button">
                  <span>◆</span>
                  <strong>{t('parentPending')}</strong>
                  <small>{t('parentPendingMeta')}</small>
                </button>
              ) : (
                <Link className="profileStartCard isGreen" href={`/${locale}/test/ipip-neo-60`}>
                  <span>◆</span>
                  <strong>{t('startProfilComplet')}</strong>
                  <small>{t('startProfilCompletMeta')}</small>
                </Link>
              )}
            </div>
          </section>
        ) : null}

        {topMatch ? (
          <section className="profileSection">
            <div className="profileSectionHeader">
              <h2>{t('topCareerTitle')}</h2>
              <Link href={`/${locale}/browse`}>{t('exploreAll')}</Link>
            </div>
            <Link className="profileTopCareerCard" href={`/${locale}/cariera/${topMatch.career.id}`}>
              <span
                className="profileTopCareerIcon"
                style={{
                  background: CAREER_COLORS[topMatch.career.color] ?? 'var(--purple)',
                  color: topMatch.career.color === 'purple' ? '#fff' : '#000',
                }}
              >
                {topMatch.career.emoji}
              </span>
              <span className="profileTopCareerCopy">
                <mark>{t('suggestedBadge', {score: topMatch.score})}</mark>
                <strong>{topMatch.career.name}</strong>
                <small>{topMatch.career.tagline}</small>
              </span>
              <i aria-hidden="true">→</i>
            </Link>
            <div className="profileSignalRow">
              {topRiasec.map(([code], index) => (
                <span className={index === 0 ? 'isPrimary' : ''} key={code}>
                  {code} · {RIASEC_NAMES[code] ?? code}
                </span>
              ))}
            </div>
            {big5 && Object.keys(big5).length > 0 ? (
              <div className="profileCompactBig5">
                {['O', 'C', 'E', 'A', 'N']
                  .filter((key) => typeof big5[key] === 'number')
                  .map((key) => `${key} ${big5[key]}%`)
                  .join(' · ')}
              </div>
            ) : null}
          </section>
        ) : null}

        {(savedPathName || topPath) ? (
          <section className="profileSection">
            <div className="profileSectionHeader">
              <h2>{t('yourPathTitle')}</h2>
              <Link href={`/${locale}/browse`}>{savedPathName ? t('savedPathChange') : t('choosePath')}</Link>
            </div>
            <Link
              className="profileChosenPathCard"
              href={`/${locale}/browse`}
              style={{
                background: savedPathDetails?.color === 'green' ? 'var(--green)' : savedPathDetails?.color === 'purple' ? 'var(--purple)' : 'var(--yellow)',
                color: savedPathDetails?.color === 'purple' ? '#fff' : '#000',
              }}
            >
              <span>{savedPathDetails?.emoji ?? '↗'}</span>
              <span>
                <strong>{savedPathName ?? (topPath ? (PATH_NAMES[topPath[0]] ?? topPath[0]) : '')}</strong>
                <small>{savedPathDetails?.tagline ?? t('pathSuggestionLead')}</small>
                {savedPathDetails?.duration || savedPathDetails?.cost ? (
                  <em>{[savedPathDetails.duration, savedPathDetails.cost].filter(Boolean).join(' · ')}</em>
                ) : null}
              </span>
            </Link>
          </section>
        ) : null}

        <section className="profileSection">
          <div className="profileSectionHeader">
            <h2>{t('savedAlternativesTitle', {count: saved.length})}</h2>
            <Link href={`/${locale}/browse`}>{t('addMore')}</Link>
          </div>

          {saved.length === 0 ? (
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

        <section className="profileSection">
          <div className="profileSectionHeader">
            <h2>{t('testsBarTitle', {count: completedTests})}</h2>
          </div>
          <div className="profileTestsRail">
            {[
              {key: 'scenarii', label: t('testScenarios'), href: `/${locale}/test/scenarii`, done: completedTests > 0, icon: '✦'},
              {key: 'personalitate', label: t('testPersonality'), href: `/${locale}/test/personalitate`, done: Boolean(userProfile?.big5), icon: '◆'},
              {key: 'vocational', label: t('testVocational'), href: `/${locale}/test/vocational`, done: Boolean(userProfile?.riasec), icon: '◉'},
              {key: 'ipip', label: t('testComplete'), href: `/${locale}/test/ipip-neo-60`, done: false, icon: '✓'},
            ].map((test) => (
              <Link className={test.done ? 'profileTestPill isDone' : 'profileTestPill'} href={test.href} key={test.key}>
                <span>{test.icon}</span>
                <strong>{test.label}</strong>
                <small>{test.done ? t('testDone') : t('testTodo')}</small>
              </Link>
            ))}
          </div>
        </section>

        {(topMatch || saved.length > 0 || savedPathName) ? (
          <ParentShareCard
            careerName={topMatch?.career.name ?? saved[0]?.name ?? t('profileGenericShareCareer')}
            locale={locale}
            savedCount={saved.length}
            t={t}
          />
        ) : null}

        <ReferralStatsCard />

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

function ParentShareCard({
  careerName,
  locale,
  savedCount,
  t,
}: {
  careerName: string;
  locale: string;
  savedCount: number;
  t: ProfileTFunc;
}) {
  function shareProfile() {
    const url = `${window.location.origin}/${locale}/profil`;
    const text = t('parentShareText', {career: careerName, count: savedCount, url});

    if (navigator.share) {
      void navigator.share({text, url}).catch(() => undefined);
      return;
    }

    void navigator.clipboard?.writeText(text);
  }

  return (
    <section className="profileSection">
      <div className="profileParentShareCard">
        <div className="profileParentShareBadge">{t('parentShareBadge')}</div>
        <h2>{t('parentShareTitle')}</h2>
        <p>{t('parentShareLead', {career: careerName, count: savedCount})}</p>
        <button className="profileActionButton isDark" onClick={shareProfile} type="button">
          {t('parentShareCTA')}
        </button>
      </div>
    </section>
  );
}
