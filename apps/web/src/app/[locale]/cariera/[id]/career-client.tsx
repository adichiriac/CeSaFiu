'use client';

import Link from 'next/link';
import {useState} from 'react';
import {useTranslations} from 'next-intl';
import {useQuizStore} from '@/stores/quiz-store';
import type {Career} from '@/lib/matcher';
import type {Program, Institution} from '@/lib/careers/types';

type ProgramWithInstitution = Program & {institution?: Institution};

type CareerClientProps = {
  career: Career;
  locale: string;
  programs: ProgramWithInstitution[];
};

const CAREER_COLORS: Record<string, string> = {
  purple: 'var(--purple)',
  yellow: 'var(--yellow)',
  green: 'var(--green)',
};

const PATH_LABEL: Record<string, string> = {
  facultate: 'FACULTATE', autodidact: 'AUTODIDACT', antreprenor: 'ANTREPRENOR',
  profesional: 'PROFESIONAL', creator: 'CREATOR', freelance: 'FREELANCE', mixt: 'MIXT', bootcamp: 'BOOTCAMP',
};
const PATH_COLOR: Record<string, string> = {
  facultate: 'var(--purple)', autodidact: 'var(--green)', antreprenor: 'var(--purple)',
  profesional: 'var(--yellow)', creator: 'var(--green)', freelance: 'var(--yellow)',
  mixt: '#fff', bootcamp: 'var(--green)',
};
const PATH_TEXT: Record<string, string> = {
  facultate: '#fff', autodidact: '#000', antreprenor: '#fff',
  profesional: '#000', creator: '#000', freelance: '#000', mixt: '#000', bootcamp: '#000',
};

type Tab = 'day' | 'skills' | 'paths' | 'schools';

export default function CareerClient({career, locale, programs}: CareerClientProps) {
  const t = useTranslations('cariera');
  const [tab, setTab] = useState<Tab>('day');
  const {isSaved, toggleSave} = useQuizStore();
  const saved = isSaved(career.id);
  const heroColor = CAREER_COLORS[career.color] ?? 'var(--purple)';
  const heroTextColor = career.color === 'purple' ? '#fff' : '#000';

  const tabs: Array<{id: Tab; label: string}> = [
    {id: 'day',    label: t('tabDay')},
    {id: 'skills', label: t('tabSkills')},
    {id: 'paths',  label: t('tabPaths')},
    {id: 'schools', label: `${t('tabSchools')} (${programs.length})`},
  ];

  return (
    <main className="careerPage">
      <div className="careerCanvas">
        <div className="careerHero" style={{background: heroColor, color: heroTextColor}}>
          <div className="careerHeroNav">
            <Link href={`/${locale}/rezultate`} className="button buttonSecondary careerBackBtn">
              {t('back')}
            </Link>
            <button
              className="button careerSaveBtn"
              onClick={() => toggleSave(career.id)}
              style={{background: saved ? '#000' : '#fff', color: saved ? 'var(--green)' : '#000'}}
              aria-label={saved ? t('saveBtnUnsave') : t('saveBtnSave')}
            >
              {saved ? '★' : '☆'}
            </button>
          </div>

          <div className="careerHeroContent">
            <div
              className="careerEmojiBox"
              style={{boxShadow: `4px 4px 0 ${heroTextColor === '#fff' ? 'rgba(255,255,255,0.32)' : '#000'}`}}
            >
              {career.emoji}
            </div>
            <div className="careerHeroText">
              <div
                className="careerPathPill"
                style={{
                  background: PATH_COLOR[career.pathType] ?? '#fff',
                  color: PATH_TEXT[career.pathType] ?? '#000',
                }}
              >
                {PATH_LABEL[career.pathType] ?? career.pathType.toUpperCase()}
              </div>
              <h1 className="careerTitle">{career.name}</h1>
              <p className="careerTagline">{`„${career.tagline}"`}</p>
            </div>
          </div>
        </div>

        <div className="careerMeta">
          <div className="careerMetaCard">
            <div className="careerMetaLabel">{t('salaryLabel')}</div>
            <div className="careerMetaValue">{career.salary}</div>
          </div>
          <div className="careerMetaCard" style={{background: 'var(--green)'}}>
            <div className="careerMetaLabel">{t('demandLabel')}</div>
            <div className="careerMetaValue">{career.demand}</div>
          </div>
        </div>

        <div className="careerDescription">{career.description}</div>

        <div className="careerTabs">
          {tabs.map((tab_item) => (
            <button
              key={tab_item.id}
              className={tab === tab_item.id ? 'careerTabButton isSelected' : 'careerTabButton'}
              aria-selected={tab === tab_item.id}
              onClick={() => setTab(tab_item.id)}
            >
              {tab_item.label}
            </button>
          ))}
        </div>

        <div className="careerTabContent">
          {tab === 'day' && (
            <div className="careerDayCard">
              <div className="careerDayTitle">{t('dayTitle')}</div>
              {(career.day ?? []).map((item, i) => (
                <div key={i} className="careerDayItem">
                  <div className="careerDayNum">{String(i + 1).padStart(2, '0')}</div>
                  <div className="careerDayText">{item}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'skills' && (
            <div className="careerSkillsGrid">
              {(career.skills ?? []).map((s, i) => (
                <div
                  key={s}
                  className="sticker"
                  style={{
                    background: i % 2 === 0 ? 'var(--yellow)' : '#fff',
                    transform: `rotate(${(i % 2 ? 1 : -1) * 1.5}deg)`,
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          )}

          {tab === 'paths' && (
            <div className="careerPathsList">
              {(career.paths ?? []).map((p) => (
                <div key={p} className="careerPathItem">
                  <div className="careerPathArrow">{`→`}</div>
                  <div className="careerPathText">{p}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'schools' && (
            <div className="careerSchoolsList">
              {programs.length > 0 ? (
                <>
                  <div className="careerSchoolsTitle">
                    {t('schoolsTitle', {count: programs.length})}
                  </div>
                  {programs.map((p) => {
                    const url = p.url ?? (p.institution?.url) ??
                      `https://www.google.com/search?q=${encodeURIComponent(
                        `${p.institution?.name ?? ''} ${p.name}`.trim()
                      )}`;
                    return (
                      <a
                        key={p.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="careerProgramCard"
                      >
                        <div className="careerProgramHeader">
                          <div className="careerProgramInfo">
                            <div className="careerProgramName">{p.name}</div>
                            <div className="careerProgramUni">
                              {p.institution?.name ?? p.universityId}
                              {p.institution?.city ? ` · ${p.institution.city}` : ''}
                            </div>
                          </div>
                          <span className="careerProgramArrow">{`↗`}</span>
                        </div>
                        <div className="careerProgramTags">
                          <span
                            className="careerProgramTag"
                            style={{
                              background: PATH_COLOR[p.pathType] ?? '#fff',
                              color: PATH_TEXT[p.pathType] ?? '#000',
                            }}
                          >
                            {PATH_LABEL[p.pathType] ?? p.pathType.toUpperCase()}
                          </span>
                          <span className="careerProgramTag careerProgramTagSoft">{p.duration}</span>
                          {(p.language ?? []).slice(0, 2).map((lng) => (
                            <span key={lng} className="careerProgramTag">{lng.toUpperCase()}</span>
                          ))}
                        </div>
                        {p.notes && <div className="careerProgramNotes">{p.notes}</div>}
                      </a>
                    );
                  })}
                </>
              ) : (
                <div className="careerNoSchools">
                  <div className="h-sm">{t('noSchoolsTitle')}</div>
                  <div className="body-sm" style={{color: 'var(--ink-soft)', marginTop: 8}}>
                    {t('noSchoolsBody')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="careerActions">
          <button
            className="button buttonPrimary careerPrimaryAction"
            style={{background: saved ? 'var(--green)' : '#000', color: saved ? '#000' : '#fff'}}
            onClick={() => toggleSave(career.id)}
          >
            {saved ? t('saveCTADone') : t('saveCTA')}
          </button>
          <div className="careerActionLinks">
            <Link className="careerTextLink" href={`/${locale}/rezultate`}>
              {t('backResults')}
            </Link>
            <Link className="careerTextLink" href={`/${locale}/browse`}>
              {t('browseCTA')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
