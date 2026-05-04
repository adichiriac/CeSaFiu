'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';
import {buildMatchRequest, readStoredResults, useQuizStore} from '@/stores/quiz-store';
import type {CareerMatch, MatchResult, NextTestSuggestion, UserProfile} from '@/lib/matcher';

type ResultsClientProps = {
  locale: string;
};

const RIASEC_PLAIN: Record<string, {verb: string; tag: string; desc: string}> = {
  R: {verb: 'Faci',       tag: 'Mâini active',      desc: 'Construiești, repari, sport, lucruri tangibile.'},
  I: {verb: 'Înțelegi',   tag: 'Curios + analitic',  desc: 'Întrebi „de ce", citești mult, cauți tipare.'},
  A: {verb: 'Creezi',     tag: 'Vizual + estetic',   desc: 'Desen, scriere, video, design — îți semnezi munca.'},
  S: {verb: 'Asculți',    tag: 'Cu oameni',          desc: 'Empatie naturală, predare, ajutor direct.'},
  E: {verb: 'Conduci',    tag: 'Influencer + lider', desc: 'Convingi, organizezi, decizi sub presiune.'},
  C: {verb: 'Pui ordine', tag: 'Sistematic',         desc: 'Reguli clare, deadlines, predictibilitate.'},
};

const BIG5_PLAIN: Record<string, {tag: string; hi: string; lo: string}> = {
  O: {tag: 'Curiozitate',      hi: 'Te atrag idei noi, abstracte',         lo: 'Preferi rutine cunoscute'},
  C: {tag: 'Disciplină',       hi: 'Termini ce începi, planifici',          lo: 'Te miști spontan, alergic la rigid'},
  E: {tag: 'Energie socială',  hi: 'Te alimentează grupurile',             lo: 'Te încarci în liniște, solo'},
  A: {tag: 'Empatie',          hi: 'Cooperezi natural, eviți conflicte',   lo: 'Direct, competitiv, fără filtru'},
  N: {tag: 'Sensibilitate',    hi: 'Simți tot, mai intens',                lo: 'Calm sub stres, stabil emoțional'},
};

const SOURCE_LABELS: Record<string, string> = {
  quick:            'Scenarii reale',
  vocational:       'Vocațional scurt',
  'vocational-deep': 'Vocațional validat (O*NET)',
  'personality-15': 'Personalitate scurt',
  'ipip-neo-60':    'Big Five validat (IPIP-NEO-60)',
};

const NEXT_TEST_HREFS: Record<string, string> = {
  vocational: '/test/vocational',
  'vocational-deep': '/test/vocational-deep',
  'ipip-neo': '/test/ipip-neo-60',
  personality: '/test/personalitate',
  quick: '/test/scenarii',
};

const CAREER_COLORS: Record<string, string> = {
  purple: 'var(--purple)',
  yellow: 'var(--yellow)',
  green: 'var(--green)',
};

function topRiasecCodes(riasec: Record<string, number>): string[] {
  return Object.entries(riasec ?? {})
    .filter(([k]) => k in RIASEC_PLAIN)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, v]) => v > 0)
    .map(([k]) => k);
}

export default function ResultsClient({locale}: ResultsClientProps) {
  const t = useTranslations('rezultate');
  const {isSaved, toggleSave} = useQuizStore();
  const [status, setStatus] = useState<'loading' | 'no-data' | 'ready' | 'error'>('loading');
  const [result, setResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    const stored = readStoredResults();
    const hasAny = Object.values(stored).some(Boolean);

    if (!hasAny) {
      setStatus('no-data');
      return;
    }

    const body = buildMatchRequest(stored);

    fetch('/api/match', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((data: {matches: CareerMatch[]; confidence: number; sources: string[]; userProfile: UserProfile; nextTest: NextTestSuggestion | null}) => {
        const matches = Object.assign(data.matches ?? [], {
          confidence: data.confidence,
          sources: data.sources,
          userProfile: data.userProfile,
          nextTest: data.nextTest,
        }) as unknown as MatchResult;
        setResult(matches);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  if (status === 'loading') {
    return (
      <main className="questionnairePage">
        <section className="questionnairePanel" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{textAlign: 'center'}}>
            <div className="testEyebrow" style={{marginBottom: 16}}>{t('loading')}</div>
            <div className="h-sm">{t('loadingDesc')}</div>
          </div>
        </section>
      </main>
    );
  }

  if (status === 'no-data') {
    return (
      <main className="questionnairePage">
        <section className="questionnairePanel">
          <header className="questionnaireHeader">
            <Link className="miniBrand" href={`/${locale}`}>
              <span>{t('brandCe')}</span>
              <strong>{t('brandRest')}</strong>
            </Link>
          </header>
          <p className="testEyebrow">{t('noDataEyebrow')}</p>
          <h1>{t('noDataHeading')}</h1>
          <p style={{color: 'var(--ink-soft)', marginBottom: 24}}>
            {t('noDataLead')}
          </p>
          <Link className="button buttonPrimary" href={`/${locale}/test/scenarii`}>
            {t('noDataCTA')}
          </Link>
        </section>
      </main>
    );
  }

  if (status === 'error' || !result) {
    return (
      <main className="questionnairePage">
        <section className="questionnairePanel">
          <p className="testEyebrow">{t('errorEyebrow')}</p>
          <h1>{t('errorHeading')}</h1>
          <Link className="button buttonPrimary" href={`/${locale}`}>{t('errorBack')}</Link>
        </section>
      </main>
    );
  }

  const top = result[0];
  const others = result.slice(1, 4);
  const confidence = result.confidence ?? 0;
  const sources = result.sources ?? [];
  const userProfile = result.userProfile;
  const nextTest = result.nextTest;
  const confLabel = confidence < 0.30 ? 'Scăzută' : confidence < 0.60 ? 'Medie' : 'Solidă';
  const confColor = confidence < 0.30 ? 'var(--yellow)' : confidence < 0.60 ? 'var(--green)' : 'var(--purple)';
  const topCodes = topRiasecCodes(userProfile?.riasec ?? {});
  const completedTests = sources.length;

  if (!top) return null;

  const topColor = CAREER_COLORS[top.career.color] ?? 'var(--purple)';
  const isDarkHero = topColor === 'var(--purple)';
  const topTextColor = isDarkHero ? '#fff' : '#000';
  const whyText = top.why && typeof top.why === 'object' ? top.why.text : top.why;
  const sourcesText = sources.length
    ? sources.map((s) => SOURCE_LABELS[s] ?? s).join(' + ')
    : t('noData');

  const nextTestLabel: Record<string, string> = {
    vocational:       t('nextVocational'),
    'vocational-deep': t('nextVocDeep'),
    'ipip-neo':       t('nextIpip'),
    personality:      t('nextPersonality'),
  };

  return (
    <main className="resultPage">
      {/* ── Hero card ── */}
      <div className={isDarkHero ? 'resultHero isDarkHero' : 'resultHero'} style={{background: topColor, color: topTextColor}}>
        <div className="resultHeroNav">
          <span className="sticker stickerWhite">{t('vibeLabel')}</span>
          <Link href={`/${locale}/test/scenarii`} className="resultRetakeLink" style={{color: topTextColor}}>
            {t('retakeLabel')}
          </Link>
        </div>

        <div className="resultHeroMeta">{t('fitLabel')}</div>
        <h1 className="resultHeroTitle">
          {top.career.name.split(' ').map((w, i) => <span key={i}>{w}</span>)}
        </h1>
        <p className="resultHeroTagline">{`„${top.career.tagline}."`}</p>

        {whyText && (
          <div className="resultWhyText">{t('whyPrefix')}{whyText}</div>
        )}

        {/* Confidence strip */}
        <div className={isDarkHero ? 'resultConfidenceStrip isDarkHero' : 'resultConfidenceStrip'}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
            <span className="resultConfBadge" style={{background: confColor}}>
              {t('confPrefix')}{confLabel}
            </span>
            <span style={{opacity: 0.85, fontSize: 11}}>
              {t('basedOn', {sources: sourcesText})}
            </span>
          </div>
          {confidence < 0.60 && nextTest && (
            <p style={{marginTop: 6, opacity: 0.9, fontSize: 12}}>
              {t('moreTests')}{nextTest.reason}
            </p>
          )}
        </div>

        <div className="resultEmojiCircle" style={{color: topTextColor}}>
          {top.career.emoji}
        </div>

        <div className="resultMatchBadge">
          {t('matchBadge', {score: top.score})}
        </div>
      </div>

      {/* ── Meta strip ── */}
      <div className="resultMetaStrip">
        {[
          {label: t('metaSalariu'), value: top.career.salary.split('—')[1]?.trim() ?? top.career.salary},
          {label: t('metaCerere'), value: top.career.demand},
          {label: t('metaVibe'),   value: top.career.vibe},
        ].map((m, i) => (
          <div key={i} className="resultMetaCell" style={{background: i === 1 ? 'var(--paper-2)' : '#fff'}}>
            <div className="resultMetaLabel">{m.label}</div>
            <div className="resultMetaValue">{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="resultBody">
        <p className="resultDescription">{top.career.description}</p>

        <Link className="button buttonPrimary" href={`/${locale}/cariera/${top.career.id}`} style={{display: 'block', textAlign: 'center', marginTop: 24}}>
          {t('viewAllCTA')}
        </Link>

        {/* Profile summary */}
        <div className="resultProfileCard">
          <div className="resultProfileTitle">{t('profileTitle')}</div>
          <div className="resultProfileSub">{t('profileSub')}</div>

          {topCodes.length > 0 && (
            <div className="resultProfileSection">
              <div className="resultProfileSectionLabel">{t('styleLabel')}</div>
              <div className="resultProfileVerbs">
                {topCodes.map((c) => RIASEC_PLAIN[c].verb).join(' + ')}
                <span className="resultProfileTags"> · {topCodes.map((c) => RIASEC_PLAIN[c].tag).join(' / ')}</span>
              </div>
              <div className="resultProfileDesc">
                {topCodes.map((c, i) => (
                  <span key={c}>{i > 0 && ' '}<b>{RIASEC_PLAIN[c].verb}:</b> {RIASEC_PLAIN[c].desc}</span>
                ))}
              </div>
            </div>
          )}

          {userProfile?.paths && Object.keys(userProfile.paths).length > 0 && (
            <div className="resultProfileSection">
              <div className="resultProfileSectionLabel">{t('pathLabel')}</div>
              <div className="resultProfileVerbs">
                {Object.entries(userProfile.paths)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([k]) => ({'facultate': 'Facultate', 'autodidact': 'Autodidact', 'antreprenor': 'Antreprenor', 'profesional': 'Profesional', 'creator': 'Creator', 'freelance': 'Freelance', 'mixt': 'Mixt'}[k] ?? k))
                  .join(' / ')}
              </div>
            </div>
          )}

          {userProfile?.big5 && Object.keys(userProfile.big5).length > 0 && (
            <div className="resultProfileSection">
              <div className="resultProfileSectionLabel">{t('big5Label')}</div>
              {['O', 'C', 'E', 'A', 'N'].filter((k) => typeof userProfile.big5[k] === 'number').map((k) => {
                const pct = userProfile.big5[k];
                const isHigh = pct >= 60;
                const isLow = pct <= 40;
                const label = isHigh ? BIG5_PLAIN[k].hi : isLow ? BIG5_PLAIN[k].lo : 'echilibrat';
                return (
                  <div key={k} className="resultBig5Row">
                    <b>{BIG5_PLAIN[k].tag}:</b>
                    <span style={{color: 'var(--ink-soft)'}}> {label}</span>
                    <span className="resultBig5Pct">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Completeness bar */}
          <div className="resultCompletenessBar">
            <div className="resultCompletenessHeader">
              <span>{t('completedLabel')}</span>
              <span>{completedTests} {t('testsOf')}</span>
            </div>
            <div className="resultCompletenessDots">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`resultCompletenessDot ${i < completedTests ? 'filled' : ''}`} />
              ))}
            </div>
            <p className="resultCompletenessNote">
              {completedTests === 1 && t('completedNote1')}
              {completedTests === 2 && t('completedNote2')}
              {completedTests >= 3 && t('completedNote3')}
            </p>
          </div>
        </div>

        {/* Honesty nudge */}
        <div className="resultHonestyCard">
          <div className="resultHonestyTitle">{t('honestyTitle')}</div>
          {t.rich('honestyBody', {b: (chunks) => <b>{chunks}</b>})}
        </div>

        {/* Next test CTA */}
        {nextTest && nextTest.kind !== 'quick' && (
          <div className="resultNextTest">
            <div className="resultNextTestEyebrow">{t('nextEyebrow')}</div>
            <div className="resultNextTestTitle">
              {nextTestLabel[nextTest.kind] ?? nextTest.kind}
            </div>
            <p className="resultNextTestReason">{nextTest.reason}</p>
            <Link
              className="button buttonPrimary"
              href={`/${locale}${NEXT_TEST_HREFS[nextTest.kind] ?? '/test/scenarii'}`}
              style={{display: 'block', textAlign: 'center', background: 'var(--yellow)', color: '#000', borderColor: '#000'}}
            >
              {nextTestLabel[nextTest.kind] ?? nextTest.kind}
            </Link>
          </div>
        )}

        {/* Other matches */}
        <h2 className="resultOthersTitle">
          {t.rich('othersTitle', {mark: (chunks) => <mark>{chunks}</mark>})}
        </h2>
        <div className="resultOthersList">
          {others.map((m) => (
            <Link
              key={m.career.id}
              href={`/${locale}/cariera/${m.career.id}`}
              className="resultOtherCard"
            >
              <div
                className="resultOtherEmoji"
                style={{
                  background: CAREER_COLORS[m.career.color] ?? 'var(--purple)',
                  color: m.career.color === 'purple' ? '#fff' : '#000',
                }}
              >
                {m.career.emoji}
              </div>
              <div className="resultOtherInfo">
                <strong>{m.career.name}</strong>
                <span>{m.career.tagline}</span>
              </div>
              <div className="resultOtherScore">{m.score}%</div>
            </Link>
          ))}
        </div>

        {/* Save CTA */}
        <div className="resultSaveCard">
          <div className="resultSaveTitle">
            {isSaved(top.career.id) ? t('saveTitleDone') : t('saveTitle')}
          </div>
          <p className="resultSaveBody">
            {isSaved(top.career.id) ? t('saveBodyDone') : t('saveBody')}
          </p>
          <button
            className="button buttonPrimary"
            onClick={() => toggleSave(top.career.id)}
            style={{width: '100%', background: isSaved(top.career.id) ? 'var(--purple)' : '#000'}}
          >
            {isSaved(top.career.id) ? t('saveCTADone') : t('saveCTA')}
          </button>
        </div>

        {/* Paid hook */}
        <div className="paidHookCard">
          <div className="paidHookEyebrow">{t('paidEyebrow')}</div>
          <h3 className="paidHookTitle">{t('paidTitle')}</h3>
          <p className="paidHookBody">{t('paidBody')}</p>
          <div className="paidHookPrice">{t('paidPrice')}</div>
          <Link
            href={`/${locale}/test/ipip-neo-60`}
            className="button buttonPrimary"
            style={{display: 'block', textAlign: 'center', background: 'var(--purple)', borderColor: '#000'}}
          >
            {t('paidCTA')}
          </Link>
          <p className="paidHookDisclaimer">{t('paidDisclaimer')}</p>
        </div>

        {/* Browse CTA */}
        <div style={{textAlign: 'center', padding: '24px 0 8px'}}>
          <Link href={`/${locale}/browse`} className="button buttonSecondary">
            {t('browseCTA')}
          </Link>
        </div>
      </div>
    </main>
  );
}
