'use client';

import BottomNav from '@/components/bottom-nav';
import Link from 'next/link';
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import type {Career} from '@/lib/matcher';
import type {Institution, PathEntry} from '@/lib/careers/types';

type BrowseClientProps = {
  careers: Career[];
  institutions: Institution[];
  paths: (PathEntry & {emoji?: string; color?: string; tagline?: string; duration?: string; cost?: string})[];
  locale: string;
};

type Section = 'careers' | 'paths' | 'unis';

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

const PATH_COLORS: Record<string, string> = {
  purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)',
};

export default function BrowseClient({careers, institutions, paths, locale}: BrowseClientProps) {
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
      {section === 'unis'    && <UnisBrowse institutions={institutions} t={t} />}

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

type PathFull = PathEntry & {emoji?: string; color?: string; tagline?: string; duration?: string; cost?: string; pros?: string[]; cons?: string[]; bestFor?: string[]; next?: string[]};

function PathsBrowse({paths, t}: {paths: PathFull[]; t: TFunc}) {
  const [selected, setSelected] = useState<string | null>(null);

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

          return (
            <div key={p.id} style={{transform: `rotate(${i % 2 ? 0.4 : -0.4}deg)`}}>
              <button
                className="browsePathCard"
                style={{background: bg, color: textC}}
                onClick={() => setSelected(isOpen ? null : p.id)}
                aria-expanded={isOpen}
              >
                <div className="browsePathCardContent">
                  <div className="browsePathEmoji">{p.emoji ?? `→`}</div>
                  <div className="browsePathMeta">
                    <div className="browsePathDuration">{p.duration} · {p.cost}</div>
                    <div className="browsePathName">{p.name}</div>
                  </div>
                  <div className="browsePathChevron">{isOpen ? `↑` : `↓`}</div>
                </div>
                {p.tagline && <div className="browsePathTagline">{`„${p.tagline}"`}</div>}
              </button>

              {isOpen && (
                <div className="browsePathExpanded">
                  {p.pros && p.pros.length > 0 && (
                    <div className="browsePathSection">
                      <div className="browsePathSectionTitle">{t('pathPro')}</div>
                      {p.pros.map((pro) => <div key={pro} className="browsePathItem">{`· ${pro}`}</div>)}
                    </div>
                  )}
                  {p.cons && p.cons.length > 0 && (
                    <div className="browsePathSection">
                      <div className="browsePathSectionTitle">{t('pathContra')}</div>
                      {p.cons.map((con) => <div key={con} className="browsePathItem">{`· ${con}`}</div>)}
                    </div>
                  )}
                  {p.bestFor && p.bestFor.length > 0 && (
                    <div className="browsePathSection">
                      <div className="browsePathSectionTitle">{t('pathBestFor')}</div>
                      {p.bestFor.map((bf) => <div key={bf} className="browsePathItem">{`· ${bf}`}</div>)}
                    </div>
                  )}
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

function UnisBrowse({institutions, t}: {institutions: Institution[]; t: TFunc}) {
  const [city, setCity] = useState('all');
  const [tag, setTag] = useState('all');

  const cities = ['all', ...Array.from(new Set(institutions.map((u) => u.city).filter(Boolean)))].slice(0, 12);

  const filtered = institutions.filter((u) => {
    if (city !== 'all' && u.city !== city) return false;
    if (tag !== 'all' && !(u.tags ?? []).includes(tag)) return false;
    return true;
  });

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
        {filtered.map((u) => (
          <a
            key={u.id}
            href={u.url ?? `https://www.google.com/search?q=${encodeURIComponent(u.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="browseUniCard"
          >
            <div className="browseUniHeader">
              <div className="browseUniInfo">
                <div className="browseUniName">{u.name}</div>
                <div className="browseUniCity">{u.city} · <span style={{textTransform: 'capitalize'}}>{u.tier}</span></div>
              </div>
              <div className="browseUniHeaderSide">
                {u.tier === 'top' ? <span className="browseUniTier">{t('tierTop')}</span> : null}
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
          </a>
        ))}
      </div>
    </div>
  );
}
