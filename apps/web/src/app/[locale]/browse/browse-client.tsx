'use client';

import BottomNav from '@/components/bottom-nav';
import {useAuthGate} from '@/components/auth/auth-provider';
import Link from 'next/link';
import {useMemo, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Career} from '@/lib/matcher';
import type {Institution, PathEntry, Program} from '@/lib/careers/types';

type BrowseClientProps = {
  careers: Career[];
  institutions: Institution[];
  paths: (PathEntry & {emoji?: string; color?: string; tagline?: string; duration?: string; cost?: string})[];
  programs: Program[];
  locale: string;
};

type Section = 'careers' | 'paths' | 'unis';
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

const FILTERS = [
  {id: 'all',         label: 'Toate'},
  {id: 'facultate',   label: 'Facultate'},
  {id: 'profesional', label: 'Profesional'},
  {id: 'autodidact',  label: 'Autodidact'},
  {id: 'antreprenor', label: 'Antreprenor'},
  {id: 'mixt',        label: 'Mixt'},
];

const UNI_TAGS = ['all', 'IT', 'medicină', 'business', 'artă', 'umaniste', 'inginerie', 'antreprenoriat', 'profesional', 'autodidact'];
const UNI_TIER_COLORS: Record<string, {background: string; color: string}> = {
  TOP: {background: 'var(--green)', color: '#000'},
  GOOD: {background: 'var(--yellow)', color: '#000'},
  BOOTCAMP: {background: 'var(--purple)', color: '#fff'},
  PROGRAM: {background: '#000', color: 'var(--green)'},
  TRADE: {background: 'var(--yellow)', color: '#000'},
  POST: {background: '#fff', color: '#000'},
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
const SAVED_UNI_KEY = 'cesafiu:saved-universities';

function readSavedUniIds() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_UNI_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
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
  const [section, setSection] = useState<Section>('unis');

  const tabs: Array<{id: Section; label: string}> = [
    {id: 'careers', label: t('tabCareers')},
    {id: 'paths',   label: t('tabPaths')},
    {id: 'unis',    label: t('tabUnis')},
  ];

  return (
    <main className="browsePage">
      <div className="browseHeader">
        <Link href={`/${locale}`} className="miniBrand">
          <span>{t('brandCe')}</span><strong>{t('brandRest')}</strong>
        </Link>
        <button className="browseHelpButton" type="button" aria-label={t('helpLabel')}>
          {t('helpGlyph')}
        </button>
      </div>

      <div className="browseIntro">
        <h1 className="browseTitle">{t('title')}</h1>
        <p className="browseSub">{t('lead')}</p>
      </div>

      <div className="browseTabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={section === tab.id ? 'browseTab isSelected' : 'browseTab'}
            aria-selected={section === tab.id}
            onClick={() => setSection(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {section === 'careers' && <CareersBrowse careers={careers} locale={locale} t={t} />}
      {section === 'paths'   && <PathsBrowse paths={paths} t={t} />}
      {section === 'unis'    && <UnisBrowse careers={careers} institutions={institutions} programs={programs} t={t} />}

      <BottomNav active="explore" locale={locale} />
    </main>
  );
}

// ── Careers ────────────────────────────────────────────────────────────────────

type TFunc = ReturnType<typeof useTranslations<'browse'>>;

function CareersBrowse({careers, locale, t}: {careers: Career[]; locale: string; t: TFunc}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = careers.filter((c) => {
    if (filter !== 'all' && c.pathType !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!`${c.name} ${c.tagline} ${c.description}`.toLowerCase().includes(q)) return false;
    }
    return true;
  });

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

      <div className="browseFilterRow">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={filter === f.id ? 'browseFilterChip isSelected' : 'browseFilterChip'}
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
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
              <div className="browseCareerName">{c.name}</div>
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
  const [selectedUniId, setSelectedUniId] = useState<string | null>(null);
  const [savedUniIds, setSavedUniIds] = useState<string[]>(() => readSavedUniIds());
  const careersById = useMemo(() => Object.fromEntries(careers.map((career) => [career.id, career])), [careers]);

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

  const filtered = institutions.filter((u) => {
    if (city !== 'all' && u.city !== city) return false;
    if (tag !== 'all' && !(u.tags ?? []).includes(tag)) return false;
    return true;
  });

  function toggleSavedUni(uniId: string) {
    setSavedUniIds((ids) => {
      const next = ids.includes(uniId) ? ids.filter((id) => id !== uniId) : [...ids, uniId];
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SAVED_UNI_KEY, JSON.stringify(next));
      }
      return next;
    });
  }

  const selectedUni = selectedUniId ? institutions.find((uni) => uni.id === selectedUniId) : null;

  if (selectedUni) {
    return (
      <UniDetail
        careersById={careersById}
        isSaved={savedUniIds.includes(selectedUni.id)}
        onBack={() => setSelectedUniId(null)}
        onSave={() => toggleSavedUni(selectedUni.id)}
        programs={programs.filter((program) => program.universityId === selectedUni.id)}
        t={t}
        uni={selectedUni}
      />
    );
  }

  return (
    <div className="browseSection">
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

      <div className="browseUniList">
        {filtered.map((u) => {
          const tier = u.tier.toUpperCase();
          const tierColor = UNI_TIER_COLORS[tier] ?? {background: '#fff', color: '#000'};

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
            {(u.tags ?? []).length > 0 && (
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
  const tierColor = UNI_TIER_COLORS[tier] ?? {background: '#fff', color: '#000'};
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
