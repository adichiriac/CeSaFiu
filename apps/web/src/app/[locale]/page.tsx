import {getTranslations, setRequestLocale} from 'next-intl/server';
import {isLocale, type Locale} from '@/i18n/config';
import {LanguageSelector} from '@/components/LanguageSelector';
import BottomNav from '@/components/bottom-nav';
import ProfilCompletCard from '@/components/profil-complet-card';
import ThemeToggle from '@/components/theme-toggle';
import TimeBadge from '@/components/time-badge';
import Link from 'next/link';
import {notFound} from 'next/navigation';

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type TestCard = {
  id: 'vocational' | 'personalitate';
  label: string;
  sub: string;
  minutes: string;
  href: string;
};

type PreviewPromise = {
  title: string;
  body: string;
};

type HelpItem = {
  title: string;
  body: string;
};

export default async function HomePage({params}: HomePageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const t = await getTranslations('home');
  const tests = t.raw('tests') as TestCard[];
  const previewPromises = t.raw('previewPromises') as PreviewPromise[];
  const previewList = t.raw('previewCard.list') as string[];
  const howSteps = t.raw('howSteps') as string[];
  const helpItems = t.raw('helpItems') as HelpItem[];

  return (
    <main className="prototypeHome">
      <section className="prototypeCanvas" aria-labelledby="home-title">
        <header className="prototypeHeader">
          <Link className="prototypeBrand" href={`/${locale}`} aria-label={t('brand')}>
            <span>{t('brandCe')}</span>
            <strong>{t('brandRest')}</strong>
          </Link>
          <div className="prototypeHeaderRight">
            <LanguageSelector />
            <ThemeToggle />
            <a className="helpButton" href="#home-help" aria-label={t('helpLabel')}>
              {t('helpGlyph')}
            </a>
          </div>
        </header>

        <h1 className="prototypeTitle" id="home-title">
          <span>{t('titleLine1')}</span>
          <mark>{t('titleLine2')}</mark>
          <span>{t('titleLine3')}</span>
          <span className="underlined">{t('titleLine4')}</span>
        </h1>

        <p className="prototypeLead">{t('lead')}</p>

        <Link className="homePrimaryCta" href={`/${locale}${t('primaryCta.href')}`}>
          <span className="homePrimaryCtaCopy">
            <span className="homePrimaryCtaBadge">{t('primaryCta.badge')}</span>
            <strong className="homePrimaryCtaTitle">
              {t('primaryCta.title')}
              <span className="homePrimaryCtaArrow" aria-hidden="true">
                {t('arrowGlyph')}
              </span>
            </strong>
            <span className="homePrimaryCtaMeta">{t('primaryCta.meta')}</span>
          </span>
          <TimeBadge minutes={t('primaryCta.minutes')} className="homeTimeBadge--onLime" />
        </Link>

        <p className="prototypeSectionLabel homeOtherLabel">{t('otherTestsLabel')}</p>
        <div className="homeAltRail">
          {tests.map((test) => (
            <Link
              className={`homeAltCard homeAltCard-${test.id}`}
              href={`/${locale}${test.href}`}
              key={test.id}
            >
              <span className="homeAltCardHead">
                <strong className="homeAltCardTitle">{test.label}</strong>
                <TimeBadge minutes={test.minutes} />
              </span>
              <span className="homeAltCardSub">{test.sub}</span>
            </Link>
          ))}
        </div>

        <ProfilCompletCard locale={locale} />

        <div className="prototypeHomeLower">
          <section className="homePreview" aria-labelledby="home-preview-title">
            <p className="prototypeSectionLabel homePreviewLabel" id="home-preview-title">
              {t('resultsPreviewTitle')}
            </p>
            <div className="homePreviewRow">
              <div className="homePreviewCard" aria-hidden="true">
                <span className="homePreviewCardEyebrow">{t('previewCard.eyebrow')}</span>
                <strong className="homePreviewCardName">{t('previewCard.name')}</strong>
                <span className="homePreviewCardMatch">{t('previewCard.match')}</span>
                <ol className="homePreviewCardList">
                  {previewList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
                <span className="homePreviewCardSite">{t('previewCard.site')}</span>
              </div>
              <div className="homePreviewPromises">
                {previewPromises.map((item) => (
                  <p className="homePreviewPromise" key={item.title}>
                    <strong>{item.title}</strong> — {item.body}
                  </p>
                ))}
                <span className="homePreviewBadge">{t('previewBadge')}</span>
              </div>
            </div>
          </section>

          <article className="prototypeStoryCard" aria-label={t('storyEyebrow')}>
            <p className="prototypeSectionLabel prototypeStoryLabel">{t('storyEyebrow')}</p>
            <blockquote>{t('storyQuote')}</blockquote>
            <p>{t('storyMeta')}</p>
          </article>

          <section className="homeHow" aria-labelledby="home-how-title">
            <p className="prototypeSectionLabel" id="home-how-title">
              {t('howTitle')}
            </p>
            <div className="homeHowSteps">
              {howSteps.map((step) => (
                <span className="homeHowStep" key={step}>
                  {step}
                </span>
              ))}
            </div>
          </section>

          <section className="prototypeHelpCard" id="home-help" aria-labelledby="home-help-title">
            <div className="prototypeHelpIntro">
              <p className="prototypeSectionLabel">{t('helpTitle')}</p>
              <h2 id="home-help-title">{t('helpLead')}</h2>
              <p>{t('helpBody')}</p>
            </div>
            <div className="prototypeHelpList">
              {helpItems.map((item) => (
                <article className="prototypeHelpItem" key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
            <div className="prototypeAlgorithmNote">
              <strong>{t('algorithmTitle')}</strong>
              <p>{t('algorithmBody')}</p>
            </div>
          </section>
        </div>
      </section>
      <BottomNav active="tests" locale={locale} />
    </main>
  );
}
