'use client';

import BottomNav from '@/components/bottom-nav';
import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import {buildMatchRequest, readStoredResults, useQuizStore} from '@/stores/quiz-store';
import {useAuthGate} from '@/components/auth/auth-provider';
import ReferralStatsCard from '@/components/referrals/referral-stats-card';
import type {Institution, PathEntry} from '@/lib/careers/types';
import type {Career, CareerMatch, MatchResult, UserProfile} from '@/lib/matcher';

type ProfileTFunc = ReturnType<typeof useTranslations<'profil'>>;

type ProfileClientProps = {
  careers: Career[];
  institutions: Institution[];
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
const BIG5_KEYS = ['O', 'C', 'E', 'A', 'N'] as const;
const SAVED_UNI_KEY = 'cesafiu:saved-universities';

function browseHref(locale: string, section: 'careers' | 'paths' | 'unis') {
  return `/${locale}/browse?section=${section}`;
}

function readSavedUniIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_UNI_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function topEntries(tally: Record<string, number> | undefined, limit: number) {
  return Object.entries(tally ?? {})
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export default function ProfileClient({careers, institutions, locale, paths}: ProfileClientProps) {
  const t = useTranslations('profil');
  const {profile, savedPath} = useAuthGate();
  const {savedCareerIds} = useQuizStore();
  const [status, setStatus] = useState<'loading' | 'empty' | 'ready' | 'error'>('loading');
  const [result, setResult] = useState<MatchResult | null>(null);
  const [completedTests, setCompletedTests] = useState(0);
  const [savedUniIds, setSavedUniIds] = useState<string[]>([]);
  const [constructsOpen, setConstructsOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredResults();
    const hasAny = Object.values(stored).some(Boolean);
    setCompletedTests(Object.values(stored).filter(Boolean).length);
    setSavedUniIds(readSavedUniIds());

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
  const savedUniversities = useMemo(
    () => institutions.filter((institution) => savedUniIds.includes(institution.id)),
    [institutions, savedUniIds],
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
  const isFresh = !hasProfile && saved.length === 0 && savedUniversities.length === 0 && !savedPath;
  const savedTotal = saved.length + savedUniversities.length + (savedPath ? 1 : 0);

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
            <a href="#profile-tests"><span>{t('testsDone')}</span><strong>{t('testsProgress', {count: completedTests, total: 5})}</strong></a>
            <a href="#profile-saved-careers"><span>{t('saved')}</span><strong>{savedTotal}</strong></a>
            <a href="#profile-top-career"><span>{t('matches')}</span><strong>{topMatches.length}</strong></a>
            <a href="#profile-path"><span>{t('pathStat')}</span><strong>{savedPath ? '✓' : '—'}</strong></a>
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
              <Link className="profileStartCard" href={browseHref(locale, 'careers')}>
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
          <section className="profileSection" id="profile-top-career">
            <div className="profileSectionHeader">
              <h2>{t('topCareerTitle')}</h2>
              <Link href={browseHref(locale, 'careers')}>{t('exploreAll')}</Link>
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
            <div className="profileConstructsLine">
              {big5 && Object.keys(big5).length > 0 ? (
                <div className="profileCompactBig5">
                  {BIG5_KEYS
                    .filter((key) => typeof big5[key] === 'number')
                    .map((key) => `${key} ${big5[key]}%`)
                    .join(' · ')}
                </div>
              ) : (
                <div className="profileCompactBig5 isMuted">{t('oceanMissingLine')}</div>
              )}
              <button className="profileConstructsHelp" onClick={() => setConstructsOpen(true)} type="button">
                {t('constructsHelpButton')}
              </button>
            </div>
          </section>
        ) : null}

        <section className="profileSection" id="profile-saved-unis">
          <div className="profileSectionHeader profileUniversitiesHeader">
            <h2 className="profileUniversitiesTitle">
              <span>{t('savedUniversitiesHeading')}</span>
              <strong>{t('savedUniversitiesCount', {count: savedUniversities.length})}</strong>
            </h2>
            <Link className="profileHeaderNoWrap" href={browseHref(locale, 'unis')}>{t('addUniversity')}</Link>
          </div>

          {savedUniversities.length === 0 ? (
            <Link className="profileEmptyCard profileUniEmptyCard" href={browseHref(locale, 'unis')}>
              <div aria-hidden="true">⌕</div>
              <h3>{t('savedUniversitiesEmptyTitle')}</h3>
              <p>{t('savedUniversitiesEmptyBody')}</p>
            </Link>
          ) : (
            <div className="profileSavedList">
              {savedUniversities.map((uni) => (
                <Link className="profileSavedUniCard" href={browseHref(locale, 'unis')} key={uni.id}>
                  <span className="profileUniTier">{uni.tier.toUpperCase()}</span>
                  <span>
                    <strong>{uni.name}</strong>
                    <small>{uni.city} · {uni.kind}</small>
                  </span>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </div>
          )}
        </section>

        {(savedPathName || topPath) ? (
          <section className="profileSection" id="profile-path">
            <div className="profileSectionHeader">
              <h2>{t('yourPathTitle')}</h2>
              <Link href={browseHref(locale, 'paths')}>{savedPathName ? t('savedPathChange') : t('choosePath')}</Link>
            </div>
            <Link
              className="profileChosenPathCard"
              href={browseHref(locale, 'paths')}
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

        <section className="profileSection" id="profile-saved-careers">
          <div className="profileSectionHeader">
            <h2>{t('savedAlternativesTitle', {count: saved.length})}</h2>
            <Link href={browseHref(locale, 'careers')}>{t('addMore')}</Link>
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

        <section className="profileSection" id="profile-tests">
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

        {constructsOpen ? <ConstructsHelpDialog big5={big5} onClose={() => setConstructsOpen(false)} t={t} /> : null}
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

function ConstructsHelpDialog({big5, onClose, t}: {big5?: Record<string, number>; onClose: () => void; t: ProfileTFunc}) {
  const rows = [
    {title: t('constructsRiasecTitle'), body: t('constructsRiasecBody')},
    {title: t('constructsBigFiveTitle'), body: t('constructsBigFiveBody')},
    {title: t('constructsMatchTitle'), body: t('constructsMatchBody')},
  ];
  const oceanRows = [
    {key: 'O', title: t('oceanO'), left: t('oceanOLeft'), right: t('oceanORight'), value: big5?.O},
    {key: 'C', title: t('oceanC'), left: t('oceanCLeft'), right: t('oceanCRight'), value: big5?.C},
    {key: 'E', title: t('oceanE'), left: t('oceanELeft'), right: t('oceanERight'), value: big5?.E},
    {key: 'A', title: t('oceanA'), left: t('oceanALeft'), right: t('oceanARight'), value: big5?.A},
    {key: 'N', title: t('oceanN'), left: t('oceanNLeft'), right: t('oceanNRight'), value: big5?.N},
  ].filter((row): row is {key: string; title: string; left: string; right: string; value: number} => typeof row.value === 'number');

  return (
    <div className="profileDialogBackdrop" role="presentation">
      <section aria-modal="true" className="profileDialog" role="dialog">
        <button aria-label={t('constructsClose')} className="profileDialogClose" onClick={onClose} type="button">
          ×
        </button>
        <p className="profileEyebrow">{t('constructsEyebrow')}</p>
        <h2>{t('constructsTitle')}</h2>
        {oceanRows.length > 0 ? (
          <div className="profileOceanChart">
            <h3>{t('oceanChartTitle')}</h3>
            {oceanRows.map((row) => {
              const value = Math.max(0, Math.min(100, Math.round(row.value)));
              return (
                <div className="profileOceanRow" key={row.key}>
                  <strong>{row.title}</strong>
                  <div className="profileOceanScale">
                    <span>{row.left}</span>
                    <div className="profileOceanTrack" aria-label={t('oceanValueLabel', {trait: row.title, value})}>
                      <i style={{left: `${value}%`}}>{t('oceanValue', {value})}</i>
                    </div>
                    <span>{row.right}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="profileOceanMissing">
            <strong>{t('oceanMissingTitle')}</strong>
            <p>{t('oceanMissingBody')}</p>
          </div>
        )}
        <div className="profileConstructRows">
          {rows.map((row) => (
            <div className="profileConstructRow" key={row.title}>
              <strong>{row.title}</strong>
              <p>{row.body}</p>
            </div>
          ))}
        </div>
        <button className="profileActionButton isYellow" onClick={onClose} type="button">
          {t('constructsClose')}
        </button>
      </section>
    </div>
  );
}
