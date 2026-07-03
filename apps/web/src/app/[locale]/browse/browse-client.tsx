'use client';

import BottomNav from '@/components/bottom-nav';
import {useAuthGate} from '@/components/auth/auth-provider';
import ThemeToggle from '@/components/theme-toggle';
import Link from 'next/link';
import {useEffect, useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Career} from '@/lib/matcher';
import type {Institution, PathEntry, Program} from '@/lib/careers/types';
import {COLLECTION_IDS, inCollection, matchedInstitutions, type CollectionId} from '@/lib/careers/collections';
import {trackEvent} from '@/lib/analytics/umami';
import {useMatches} from '@/lib/results/use-matches';
import {CAREER_WORLDS} from '@/lib/results/career-worlds';
import {WORLD_IDS, WORLDS, type WorldId} from '@/lib/results/worlds';
import {useJourneyStore} from '@/stores/journey-store';
import {useQuizStore} from '@/stores/quiz-store';
import {useUniStore} from '@/stores/uni-store';

type BrowseClientProps = {
  careers: Career[];
  institutions: Institution[];
  paths: (PathEntry & {emoji?: string; color?: string; tagline?: string; duration?: string; cost?: string})[];
  programs: Program[];
  locale: string;
};

type Section = 'hub' | 'careers' | 'paths' | 'unis';
type PathFull = PathEntry & {emoji?: string; color?: string; tagline?: string; duration?: string; cost?: string; pros?: string[]; cons?: string[]; bestFor?: string[]; next?: string[]};

const CAREER_COLORS: Record<string, string> = {
  purple: 'var(--purple)',
  yellow: 'var(--yellow)',
  green: 'var(--green)',
};
const PATH_LABEL: Record<string, string> = {
  facultate: 'FAC', autodidact: 'AUTO', antreprenor: 'ENTRE',
  mixt: 'MIX', bootcamp: 'BOOT', profesional: 'PROF', creator: 'CREATOR', freelance: 'FREE',
};
const PATH_COLOR: Record<string, string> = {
  facultate: '#fff', autodidact: 'var(--green)', antreprenor: 'var(--purple)',
  mixt: 'var(--yellow)', bootcamp: 'var(--green)', profesional: 'var(--yellow)',
  creator: 'var(--green)', freelance: 'var(--yellow)',
};
const PATH_TEXT: Record<string, string> = {
  facultate: '#000', autodidact: '#000', antreprenor: '#fff',
  mixt: '#000', bootcamp: '#000', profesional: '#000', creator: '#000', freelance: '#000',
};

const UNI_TAGS = ['all', 'IT', 'medicină', 'business', 'artă', 'umaniste', 'inginerie', 'antreprenoriat', 'profesional', 'autodidact'];
const UNI_TIER_COLORS: Record<string, {background: string; color: string}> = {
  TOP: {background: 'var(--green)', color: 'var(--ink-on-bright)'},
  GOOD: {background: 'var(--yellow)', color: 'var(--ink-on-bright)'},
  BOOTCAMP: {background: 'var(--purple)', color: '#fff'},
  PROGRAM: {background: '#000', color: 'var(--green)'},
  TRADE: {background: 'var(--yellow)', color: 'var(--ink-on-bright)'},
  POST: {background: 'var(--surface)', color: 'var(--ink)'},
};
const CITY_PRIORITY = [
  'București',
  'Iași',
  'Cluj-Napoca',
  'Timișoara',
  'Brașov',
  'Craiova',
  'Constanța',
  'Sibiu',
  'Oradea',
  'Galați',
  'Suceava',
];

const PATH_COLORS: Record<string, string> = {
  purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)',
};

/** Matched collection shows at most this many careers (plan §1, design cap). */
const MATCHED_CAP = 12;

function parseSection(value: string | null): Section {
  if (value === 'universities') return 'unis'; // legacy deep links
  return value === 'careers' || value === 'paths' || value === 'unis' ? value : 'hub';
}

/**
 * Diacritics-insensitive search normalization: "ingrijitor" matches
 * "Îngrijitor", "balneo" matches "Balneofiziokinetoterapie".
 * NFD decomposition strips both comma-below (ș/ț) and cedilla (ş/ţ) variants.
 */
function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function uniLinkFor(uni: Institution) {
  if (uni.url) return {url: uni.url, isFallback: false};
  return {
    url: `https://www.google.com/search?q=${encodeURIComponent(`${uni.name} ${uni.city}`)}`,
    isFallback: true
  };
}

export default function BrowseClient({careers, institutions, paths, programs, locale}: BrowseClientProps) {
  const t = useTranslations('browse');
  const [section, setSection] = useState<Section>('hub');
  const [world, setWorld] = useState<'all' | WorldId>('all');
  const savedCareerIds = useQuizStore((s) => s.savedCareerIds);
  const {savedUniIds} = useUniStore();
  const {savedPath} = useAuthGate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // A ?world= deep link (result-page chips) lands on the careers section
    // with the world applied as a hidden, dismissible filter (plan §3).
    const w = params.get('world');
    if (w && (WORLD_IDS as string[]).includes(w)) {
      setWorld(w as WorldId);
      setSection('careers');
      return;
    }
    setSection(parseSection(params.get('section')));
  }, []);

  function selectSection(next: Section, source: 'hub' | 'back') {
    setSection(next);
    if (source === 'hub') trackEvent('browse_hub_card', {id: next});
    if (next !== 'careers') setWorld('all');
    if (typeof window !== 'undefined') {
      const url = next === 'hub' ? `/${locale}/browse` : `/${locale}/browse?section=${next}`;
      window.history.replaceState(null, '', url);
    }
  }

  function clearWorld() {
    setWorld('all');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/${locale}/browse?section=careers`);
    }
  }

  const sectionTitles: Record<Exclude<Section, 'hub'>, string> = {
    careers: t('hubCareersTitle'),
    paths: t('hubPathsTitle'),
    unis: t('hubUnisTitle'),
  };

  return (
    <main className="browsePage">
      <div className="browseHeader">
        <Link href={`/${locale}`} className="miniBrand">
          <span>{t('brandCe')}</span><strong>{t('brandRest')}</strong>
        </Link>
        <ThemeToggle />
      </div>

      {section === 'hub' ? (
        <>
          <div className="browseIntro">
            <h1 className="browseTitle">{t('hubTitle')}</h1>
            <p className="browseSub">{t('hubLead')}</p>
          </div>
          <BrowseHub
            counts={{unis: institutions.length, careers: careers.length, paths: paths.length}}
            saved={{unis: savedUniIds.length, careers: savedCareerIds.length, paths: savedPath ? 1 : 0}}
            onPick={(next) => selectSection(next, 'hub')}
            t={t}
          />
        </>
      ) : (
        <div className="browseSectionHeader">
          <button
            className="browseBackBtn"
            onClick={() => selectSection('hub', 'back')}
            type="button"
            aria-label={t('backToHub')}
          >
            ←
          </button>
          <h1 className="browseSectionTitle">{sectionTitles[section]}</h1>
        </div>
      )}

      {section === 'careers' && (
        <CareersBrowse
          careers={careers}
          locale={locale}
          savedCareerIds={savedCareerIds}
          world={world}
          onClearWorld={clearWorld}
          t={t}
        />
      )}
      {section === 'paths' && <PathsBrowse paths={paths} t={t} />}
      {section === 'unis' && <UnisBrowse careers={careers} institutions={institutions} programs={programs} t={t} />}

      <BottomNav active="explore" locale={locale} />
    </main>
  );
}

// ── Hub ────────────────────────────────────────────────────────────────────────

type TFunc = ReturnType<typeof useTranslations<'browse'>>;

function BrowseHub({
  counts,
  saved,
  onPick,
  t,
}: {
  counts: {unis: number; careers: number; paths: number};
  saved: {unis: number; careers: number; paths: number};
  onPick: (section: Exclude<Section, 'hub'>) => void;
  t: TFunc;
}) {
  const cards: Array<{
    id: Exclude<Section, 'hub'>;
    emoji: string;
    title: string;
    sub: string;
    saved: number;
    background: string;
    color: string;
  }> = [
    {
      id: 'unis',
      emoji: '⌂',
      title: t('hubUnisTitle'),
      sub: t('hubUnisSub', {count: counts.unis}),
      saved: saved.unis,
      background: 'var(--green)',
      color: 'var(--ink-on-bright)',
    },
    {
      id: 'careers',
      emoji: '★',
      title: t('hubCareersTitle'),
      sub: t('hubCareersSub', {count: counts.careers}),
      saved: saved.careers,
      background: 'var(--yellow)',
      color: 'var(--ink-on-bright)',
    },
    {
      id: 'paths',
      emoji: '⚑',
      title: t('hubPathsTitle'),
      sub: t('hubPathsSub', {count: counts.paths}),
      saved: saved.paths,
      background: 'var(--purple)',
      color: 'var(--on-accent)',
    },
  ];

  return (
    <div className="browseHubList">
      {cards.map((card) => (
        <button
          key={card.id}
          className="browseHubCard"
          style={{background: card.background, color: card.color}}
          onClick={() => onPick(card.id)}
          type="button"
        >
          <span className="browseHubEmoji" aria-hidden="true">{card.emoji}</span>
          <span className="browseHubBody">
            <span className="browseHubTitle">{card.title}</span>
            <span className="browseHubSub">{card.sub}</span>
            {card.saved > 0 && (
              <span className="browseHubSaved">{t('hubSavedBadge', {count: card.saved})}</span>
            )}
          </span>
          <span className="browseHubArrow" aria-hidden="true">→</span>
        </button>
      ))}
    </div>
  );
}

// ── Careers ────────────────────────────────────────────────────────────────────

function CareersBrowse({
  careers,
  locale,
  savedCareerIds,
  world,
  onClearWorld,
  t,
}: {
  careers: Career[];
  locale: string;
  savedCareerIds: string[];
  world: 'all' | WorldId;
  onClearWorld: () => void;
  t: TFunc;
}) {
  const [collection, setCollection] = useState<CollectionId>('all');
  const [search, setSearch] = useState('');
  const {status: matchStatus, result: matchResult} = useMatches();

  const matchScore = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const m of matchResult ?? []) {
      if (m.score > 0) scores[m.career.id] = m.score;
    }
    return scores;
  }, [matchResult]);

  const collectionLabels: Record<CollectionId, string> = {
    all: t('collAll'),
    matched: t('collMatched'),
    paid: t('collPaid'),
    demand: t('collDemand'),
    nodegree: t('collNoDegree'),
    creative: t('collCreative'),
    saved: t('collSaved'),
  };

  function selectCollection(next: CollectionId) {
    setCollection(next);
    trackEvent('browse_collection', {id: next});
  }

  const q = normalizeText(search.trim());
  let filtered = careers.filter((c) => {
    if (world !== 'all' && !(CAREER_WORLDS[c.id] ?? []).includes(world)) return false;
    if (!inCollection(c, collection, {matchScore: matchScore[c.id], isSaved: savedCareerIds.includes(c.id)})) return false;
    if (q && !normalizeText(`${c.name} ${c.tagline} ${c.description}`).includes(q)) return false;
    return true;
  });
  if (collection === 'matched') {
    filtered = filtered
      .slice()
      .sort((a, b) => (matchScore[b.id] ?? 0) - (matchScore[a.id] ?? 0))
      .slice(0, MATCHED_CAP);
  }

  const matchedEmpty = collection === 'matched' && (matchStatus === 'no-data' || matchStatus === 'error');
  const savedEmpty = collection === 'saved' && savedCareerIds.length === 0;

  return (
    <div className="browseSection">
      <div className="browseSearchWrap">
        <input
          className="browseSearch"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="browseSearchIcon">{`⌕`}</span>
      </div>

      {world !== 'all' && (
        <div className="browseWorldChipRow">
          <button className="browseWorldChip" onClick={onClearWorld} type="button" aria-label={t('worldFilterClear')}>
            {t('worldFilterChip', {name: `${WORLDS[world].glyph} ${locale === 'en' ? WORLDS[world].nameEn : WORLDS[world].nameRo}`})}
            <span aria-hidden="true"> ✕</span>
          </button>
        </div>
      )}

      <div className="browseFilterRow">
        {COLLECTION_IDS.map((id) => (
          <button
            key={id}
            className={collection === id ? 'browseFilterChip isSelected' : 'browseFilterChip'}
            aria-selected={collection === id}
            onClick={() => selectCollection(id)}
          >
            {collectionLabels[id]}
          </button>
        ))}
      </div>

      {matchedEmpty && (
        <div className="browseEmpty">
          <div className="h-sm">{t('emptyMatchedTitle')}</div>
          <div className="body-sm" style={{color: 'var(--ink-soft)', marginTop: 4}}>
            {t('emptyMatchedBody')}
          </div>
        </div>
      )}
      {savedEmpty && (
        <div className="browseEmpty">
          <div className="h-sm">{t('emptySavedTitle')}</div>
          <div className="body-sm" style={{color: 'var(--ink-soft)', marginTop: 4}}>
            {t('emptySavedBody')}
          </div>
        </div>
      )}
      {!matchedEmpty && !savedEmpty && filtered.length === 0 && (
        <div className="browseEmpty">
          <div className="h-sm">{t('emptyTitle')}</div>
          <div className="body-sm" style={{color: 'var(--ink-soft)', marginTop: 4}}>
            {t('emptyBody')}
          </div>
        </div>
      )}

      <div className="browseCareerList">
        {filtered.map((c) => (
          <Link key={c.id} href={`/${locale}/cariera/${c.id}`} className="browseCareerCard">
            <div
              className="browseCareerEmoji"
              style={{
                background: CAREER_COLORS[c.color] ?? 'var(--purple)',
                color: c.color === 'purple' ? '#fff' : '#000',
              }}
            >
              {c.emoji}
            </div>
            <div className="browseCareerInfo">
              <div className="browseCareerName">
                {c.name}
                {savedCareerIds.includes(c.id) ? <span aria-hidden="true"> ♥</span> : null}
              </div>
              <div className="browseCareerTagline">{c.tagline}</div>
              <div className="browseCareerTags">
                <span
                  className="browseTag"
                  style={{
                    background: PATH_COLOR[c.pathType] ?? '#fff',
                    color: PATH_TEXT[c.pathType] ?? '#000',
                  }}
                >
                  {PATH_LABEL[c.pathType] ?? c.pathType.toUpperCase()}
                </span>
                {(matchScore[c.id] ?? 0) > 0 && (
                  <span className="browseTagMatchScore">{matchScore[c.id]}%</span>
                )}
                <span className="browseTagSoft">{c.demand}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Paths ──────────────────────────────────────────────────────────────────────

function PathsBrowse({paths, t}: {paths: PathFull[]; t: TFunc}) {
  const [selected, setSelected] = useState<string | null>(null);
  const {savedPath, isPathSaved, savePath} = useAuthGate();

  async function handleSave(path: PathFull) {
    if (savedPath && savedPath.path_id !== path.id) {
      const currentName = savedPath.path_name ?? savedPath.path_id;
      const replace = window.confirm(t('pathReplaceConfirm', {current: currentName, next: path.name}));
      if (!replace) return;
    }

    await savePath({path_id: path.id, path_name: path.name});
  }

  return (
    <div className="browseSection">
      <div className="browsePathIntro">
        <div className="label-bold" style={{color: 'var(--purple)'}}>{t('pathsCount', {count: paths.length})}</div>
        <p>{t('pathsLead')}</p>
      </div>

      <div className="browsePathList">
        {paths.map((p, i) => {
          const bg = PATH_COLORS[p.color ?? 'yellow'] ?? 'var(--yellow)';
          const textC = p.color === 'purple' ? '#fff' : '#000';
          const isOpen = selected === p.id;
          const isSaved = isPathSaved(p.id);

          return (
            <div key={p.id} style={{transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)`}}>
              <article
                className="browsePathCard"
                style={{background: bg, color: textC}}
              >
                <button
                  className="browsePathMain"
                  onClick={() => setSelected(isOpen ? null : p.id)}
                  aria-expanded={isOpen}
                  type="button"
                >
                  <div className="browsePathCardContent">
                    <div className="browsePathEmoji">{p.emoji ?? `→`}</div>
                    <div className="browsePathMeta">
                      <div className="browsePathDuration">{p.duration} · {p.cost}</div>
                      <div className="browsePathName">{p.name}</div>
                    </div>
                  </div>
                </button>
                <button
                  className={isSaved ? 'browsePathSave isSaved' : 'browsePathSave'}
                  onClick={() => handleSave(p)}
                  type="button"
                  aria-label={isSaved ? t('pathSaved') : t('pathSave')}
                >
                  {isSaved ? `★` : `☆`}
                </button>
                {p.tagline && <div className="browsePathTagline">{`„${p.tagline}"`}</div>}
              </article>

              {isOpen && (
                <div className="browsePathExpanded">
                  <div className="browsePathFacts">
                    <div>
                      <span>{t('pathDuration')}</span>
                      <strong>{p.duration}</strong>
                    </div>
                    <div>
                      <span>{t('pathCost')}</span>
                      <strong>{p.cost}</strong>
                    </div>
                  </div>
                  {p.pros && p.pros.length > 0 && (
                    <div className="browsePathSection isPro">
                      <div className="browsePathSectionTitle">{t('pathPro')}</div>
                      {p.pros.map((pro) => <div key={pro} className="browsePathItem"><span>{`+`}</span>{pro}</div>)}
                    </div>
                  )}
                  {p.cons && p.cons.length > 0 && (
                    <div className="browsePathSection">
                      <div className="browsePathSectionTitle">{t('pathContra')}</div>
                      {p.cons.map((con) => <div key={con} className="browsePathItem"><span>{`−`}</span>{con}</div>)}
                    </div>
                  )}
                  {p.bestFor && p.bestFor.length > 0 && (
                    <div className="browsePathSection">
                      <div className="browsePathSectionTitle">{t('pathBestFor')}</div>
                      <div className="browsePathStickerRow">
                        {p.bestFor.map((bf, index) => (
                          <span key={bf} className={index % 2 ? 'isYellow' : ''}>{bf}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {p.next && p.next.length > 0 && (
                    <div className="browsePathSection">
                      <div className="browsePathSectionTitle">{t('pathNext')}</div>
                      {p.next.map((step, index) => (
                        <div key={step} className="browsePathStep">
                          <span>{index + 1}</span>
                          {step}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    className={isSaved ? 'browsePathChoose isSaved' : 'browsePathChoose'}
                    onClick={() => handleSave(p)}
                    type="button"
                  >
                    {isSaved ? t('pathSaved') : t('pathSave')}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Universities ───────────────────────────────────────────────────────────────

function UnisBrowse({
  careers,
  institutions,
  programs,
  t,
}: {
  careers: Career[];
  institutions: Institution[];
  programs: Program[];
  t: TFunc;
}) {
  const [city, setCity] = useState('all');
  const [tag, setTag] = useState('all');
  const [tab, setTab] = useState<'all' | 'matched' | 'saved'>('all');
  const [search, setSearch] = useState('');
  const [selectedUniId, setSelectedUniId] = useState<string | null>(null);
  const {savedUniIds, toggleUni} = useUniStore();
  const {status: matchStatus, result: matchResult} = useMatches();
  const markAdmissionViewed = useJourneyStore((s) => s.markAdmissionViewed);
  const careersById = useMemo(() => Object.fromEntries(careers.map((career) => [career.id, career])), [careers]);

  // ✨ Potrivite: institutions hosting programs linked to the top-3 match careers.
  const {uniIds: matchedUniIds, reason: matchReason} = useMemo(
    () => matchedInstitutions(matchResult, programs),
    [matchResult, programs],
  );

  function selectTab(next: 'all' | 'matched' | 'saved') {
    setTab(next);
    trackEvent('browse_uni_tab', {id: next});
  }

  // Journey signal: record which uni details were opened. "Verifică admiterea"
  // completes only when a VIEWED uni is also SAVED (intersection at derive time).
  useEffect(() => {
    if (selectedUniId) markAdmissionViewed(selectedUniId);
  }, [selectedUniId, markAdmissionViewed]);

  const cities = [
    'all',
    ...Array.from(new Set(institutions.map((u) => u.city).filter(Boolean))).sort((a, b) => {
      const ai = CITY_PRIORITY.indexOf(a);
      const bi = CITY_PRIORITY.indexOf(b);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
      }
      return a.localeCompare(b, 'ro');
    }),
  ].slice(0, 12);

  const programsByUni = useMemo(() => {
    const map: Record<string, Program[]> = {};
    for (const program of programs) {
      (map[program.universityId] ??= []).push(program);
    }
    return map;
  }, [programs]);

  // Search matches the institution itself OR any of its programs, so queries
  // like "balneo" or "ingrijitor" surface the unis that offer those programs.
  const q = normalizeText(search.trim());
  const filtered = institutions.flatMap((u) => {
    if (tab === 'saved' && !savedUniIds.includes(u.id)) return [];
    if (tab === 'matched' && !matchedUniIds.has(u.id)) return [];
    if (city !== 'all' && u.city !== city) return [];
    if (tag !== 'all' && !(u.tags ?? []).includes(tag)) return [];
    if (!q) return [{uni: u, matchedPrograms: [] as Program[]}];

    const matchedPrograms = (programsByUni[u.id] ?? []).filter((program) =>
      normalizeText(`${program.name} ${(program.tags ?? []).join(' ')}`).includes(q),
    );
    const uniMatches = normalizeText(`${u.name} ${u.city} ${(u.tags ?? []).join(' ')}`).includes(q);
    if (!uniMatches && matchedPrograms.length === 0) return [];
    return [{uni: u, matchedPrograms}];
  });

  const selectedUni = selectedUniId ? institutions.find((uni) => uni.id === selectedUniId) : null;

  if (selectedUni) {
    return (
      <UniDetail
        careersById={careersById}
        isSaved={savedUniIds.includes(selectedUni.id)}
        onBack={() => setSelectedUniId(null)}
        onSave={() => toggleUni(selectedUni.id)}
        programs={programs.filter((program) => program.universityId === selectedUni.id)}
        t={t}
        uni={selectedUni}
      />
    );
  }

  return (
    <div className="browseSection">
      <div className="browseSearchWrap">
        <input
          className="browseSearch"
          placeholder={t('searchPlaceholderUnis')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="browseSearchIcon">{`⌕`}</span>
      </div>

      <div className="browseUniTabs">
        {([
          {id: 'all', label: t('uniTabAll', {count: institutions.length})},
          {id: 'matched', label: t('uniTabMatched', {count: matchedUniIds.size})},
          {id: 'saved', label: t('uniTabSaved', {count: savedUniIds.length})},
        ] as const).map((tabItem) => (
          <button
            key={tabItem.id}
            className={tab === tabItem.id ? 'browseFilterChip isSelected' : 'browseFilterChip'}
            aria-selected={tab === tabItem.id}
            onClick={() => selectTab(tabItem.id)}
            type="button"
          >
            {tabItem.label}
          </button>
        ))}
      </div>

      <div className="browseFilterGroup">
        <div className="browseFilterLabel">{t('cityLabel')}</div>
        <div className="browseFilterScroller">
          {cities.map((c) => (
            <button
              key={c}
              className={city === c ? 'browseFilterChip isSelected' : 'browseFilterChip'}
              onClick={() => setCity(c)}
            >
              {c === 'all' ? t('cityAll') : c}
            </button>
          ))}
        </div>
      </div>

      <div className="browseFilterGroup">
        <div className="browseFilterLabel">{t('domainLabel')}</div>
        <div className="browseFilterScroller">
          {UNI_TAGS.map((tag_item) => (
            <button
              key={tag_item}
              className={tag === tag_item ? 'browseFilterChip isSelected' : 'browseFilterChip'}
              onClick={() => setTag(tag_item)}
            >
              {tag_item === 'all' ? t('domainAll') : tag_item}
            </button>
          ))}
        </div>
      </div>

      {tab === 'matched' && (matchedUniIds.size === 0 || matchStatus === 'no-data' || matchStatus === 'error') && (
        <div className="browseEmpty">
          <div className="h-sm">{t('emptyMatchedTitle')}</div>
          <div className="body-sm" style={{color: 'var(--ink-soft)', marginTop: 4}}>
            {t('emptyMatchedBody')}
          </div>
        </div>
      )}
      {tab === 'saved' && savedUniIds.length === 0 && (
        <div className="browseEmpty">
          <div className="h-sm">{t('emptySavedTitle')}</div>
          <div className="body-sm" style={{color: 'var(--ink-soft)', marginTop: 4}}>
            {t('emptySavedUniBody')}
          </div>
        </div>
      )}
      {tab === 'all' && filtered.length === 0 && (
        <div className="browseEmpty">
          <div className="h-sm">{t('emptyTitle')}</div>
          <div className="body-sm" style={{color: 'var(--ink-soft)', marginTop: 4}}>
            {t('emptyBody')}
          </div>
        </div>
      )}

      <div className="browseUniList">
        {filtered.map(({uni: u, matchedPrograms}) => {
          const tier = u.tier.toUpperCase();
          const tierColor = UNI_TIER_COLORS[tier] ?? {background: 'var(--surface)', color: 'var(--ink)'};

          return (
          <button
            key={u.id}
            onClick={() => setSelectedUniId(u.id)}
            className="browseUniCard"
            type="button"
          >
            <div className="browseUniHeader">
              <div className="browseUniInfo">
                <div className="browseUniName">{u.name}</div>
                <div className="browseUniCity">{u.city} · <span style={{textTransform: 'capitalize'}}>{u.tier}</span></div>
              </div>
              <div className="browseUniHeaderSide">
                <span
                  className="browseUniTier"
                  style={{background: tierColor.background, color: tierColor.color}}
                >
                  {tier}
                </span>
                <span className="browseUniArrow">{`↗`}</span>
              </div>
            </div>
            {u.notes ? <p className="browseUniDescription">{u.notes}</p> : null}
            {tab === 'matched' && matchReason[u.id] ? (
              /* Why this uni is in Potrivite: the program linked to a top match career. */
              <div className="browseTagRow">
                <span className="browseUniMatchReason">✨ {matchReason[u.id]}</span>
              </div>
            ) : null}
            {matchedPrograms.length > 0 ? (
              /* Why this uni matched the search: show the matching programs. */
              <div className="browseTagRow">
                {matchedPrograms.slice(0, 2).map((program) => (
                  <span key={program.id} className="browseTagSoft browseTagMatch">🎓 {program.name}</span>
                ))}
                {matchedPrograms.length > 2 ? (
                  <span className="browseTagSoft">+{matchedPrograms.length - 2}</span>
                ) : null}
              </div>
            ) : (u.tags ?? []).length > 0 && (
              <div className="browseTagRow">
                {u.tags.slice(0, 4).map((tg) => (
                  <span key={tg} className="browseTagSoft">{tg}</span>
                ))}
              </div>
            )}
          </button>
          );
        })}
      </div>
    </div>
  );
}

function UniDetail({
  careersById,
  isSaved,
  onBack,
  onSave,
  programs,
  t,
  uni,
}: {
  careersById: Record<string, Career>;
  isSaved: boolean;
  onBack: () => void;
  onSave: () => void;
  programs: Program[];
  t: TFunc;
  uni: Institution;
}) {
  const tier = uni.tier.toUpperCase();
  const tierColor = UNI_TIER_COLORS[tier] ?? {background: 'var(--surface)', color: 'var(--ink)'};
  const link = uniLinkFor(uni);

  return (
    <div className="browseSection browseUniDetail">
      <div className="browseUniDetailNav">
        <button className="browseUniBack" onClick={onBack} type="button" aria-label={t('uniBackLabel')}>
          ←
        </button>
        <button
          className={isSaved ? 'browseUniSave isSaved' : 'browseUniSave'}
          onClick={onSave}
          type="button"
          aria-label={isSaved ? t('uniSavedLabel') : t('uniSaveLabel')}
        >
          {isSaved ? '★' : '☆'}
        </button>
      </div>

      <section className="browseUniDetailHero">
        <span className="browseUniDetailTier" style={{background: tierColor.background, color: tierColor.color}}>
          {tier} · {uni.kind}
        </span>
        <h2>{uni.name}</h2>
        <p>{uni.city}</p>
      </section>

      <a
        className="browseUniPrimaryLink"
        href={link.url}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span>{link.isFallback ? t('uniGoogleSearch') : t('uniOfficialSite')}</span>
        <span aria-hidden="true">↗</span>
      </a>

      <button
        className={isSaved ? 'browseUniFollow isSaved' : 'browseUniFollow'}
        onClick={onSave}
        type="button"
      >
        {isSaved ? t('uniSavedCta') : t('uniSaveCta')}
      </button>

      {link.isFallback ? <p className="browseUniFallback">{t('uniFallbackNote', {name: uni.name})}</p> : null}

      {uni.notes ? <div className="browseUniNote">{uni.notes}</div> : null}

      {programs.length > 0 ? (
        <section className="browseUniDetailSection">
          <h3>{t('uniProgramsTitle', {count: programs.length})}</h3>
          <div className="browseUniProgramList">
            {programs.map((program) => {
              const programUrl = program.url || (
                link.isFallback
                  ? `https://www.google.com/search?q=${encodeURIComponent(`${uni.name} ${program.name}`)}`
                  : link.url
              );
              const careerNames = (program.careerIds ?? [])
                .map((careerId) => careersById[careerId]?.name)
                .filter(Boolean)
                .slice(0, 3);

              return (
                <a
                  className="browseUniProgramCard"
                  href={programUrl}
                  key={program.id}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <div className="browseUniProgramHeader">
                    <strong>{program.name}</strong>
                    <span aria-hidden="true">↗</span>
                  </div>
                  <div className="browseUniProgramMeta">
                    {program.duration ? <span>{program.duration}</span> : null}
                    {program.pathType ? (
                      <span
                        style={{
                          background: PATH_COLOR[program.pathType] ?? '#fff',
                          color: PATH_TEXT[program.pathType] ?? '#000',
                        }}
                      >
                        {PATH_LABEL[program.pathType] ?? program.pathType.toUpperCase()}
                      </span>
                    ) : null}
                    {(program.language ?? []).slice(0, 2).map((language) => (
                      <span key={language}>{language.toUpperCase()}</span>
                    ))}
                    {careerNames.map((careerName) => (
                      <span className="isCareer" key={careerName}>→ {careerName}</span>
                    ))}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {(uni.domains ?? []).length > 0 ? (
        <section className="browseUniDetailSection">
          <h3>{t('uniDomainsTitle')}</h3>
          <div className="browseUniStickerRow">
            {(uni.domains ?? []).map((domain, index) => (
              <span className={index % 3 === 1 ? 'isWhite' : index % 3 === 2 ? 'isGreen' : ''} key={domain}>
                {domain}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {(uni.tags ?? []).length > 0 ? (
        <section className="browseUniDetailSection">
          <h3>{t('uniTagsTitle')}</h3>
          <div className="browseUniHashRow">
            {(uni.tags ?? []).map((uniTag) => <span key={uniTag}>#{uniTag}</span>)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
