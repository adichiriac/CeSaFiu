import {getTranslations, setRequestLocale} from 'next-intl/server';
import {isLocale, type Locale} from '@/i18n/config';
import {LanguageSelector} from '@/components/LanguageSelector';
import ProfilCompletCard from '@/components/profil-complet-card';
import Link from 'next/link';
import {notFound} from 'next/navigation';

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type TestCard = {
  id: 'scenarii' | 'personalitate' | 'vocational';
  label: string;
  sub: string;
  description: string;
  href: string;
  action: string;
};

type QuickGuide = {
  label: string;
  value: string;
};

type PreviewItem = {
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
  const quickGuides = t.raw('startGuides') as QuickGuide[];
  const previewItems = t.raw('resultsPreviewItems') as PreviewItem[];
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
            <a className="helpButton" href="#home-help" aria-label={t('helpLabel')}>
              {t('helpGlyph')}
            </a>
          </div>
        </header>

        <div className="noRobotSticker">
          <span aria-hidden="true" />
          {t('noRobots')}
        </div>

        <p className="prototypeEyebrow">{t('eyebrow')}</p>

        <h1 className="prototypeTitle" id="home-title">
          <span>{t('titleLine1')}</span>
          <mark>{t('titleLine2')}</mark>
          <span>{t('titleLine3')}</span>
          <span className="underlined">{t('titleLine4')}</span>
        </h1>

        <p className="prototypeLead">
          <span>{t('leadPrefix')}</span>
          <span className="prototypeLeadHighlights">
            <b className="tonePurple">{t('leadHighlight1')}</b>
            <b className="toneGreen">{t('leadHighlight2')}</b>
            <b className="toneYellow">{t('leadHighlight3')}</b>
          </span>
        </p>

        <div className="prototypeTestRail">
          {tests.map((test, index) => (
            <Link
              className={`prototypeTestCard prototypeTestCard-${test.id}`}
              href={`/${locale}${test.href}`}
              key={test.id}
            >
              {index === 0 ? (
                <span className="prototypeStartNudge">{t('recommendedTest')}</span>
              ) : null}
              <span className="prototypeIcon" aria-hidden="true" />
              <span className="prototypeCardCopy">
                <strong>{test.label}</strong>
                <span>{test.sub}</span>
                <small>{test.description}</small>
              </span>
              <span className="prototypeArrow" aria-label={t('arrowLabel')} role="img">
                {t('arrowGlyph')}
              </span>
            </Link>
          ))}
        </div>

        <ProfilCompletCard locale={locale} />


        <div className="prototypeHomeLower">
          <section className="prototypeInfoGrid" aria-label={t('startGuideTitle')}>
            <details className="prototypeDisclosure prototypeStartCard">
              <summary className="prototypeDisclosureSummary">
                {t('startGuideTitle')}
              </summary>
              <div className="prototypeDisclosureBody">
                <p className="prototypeInfoLead">{t('startGuideLead')}</p>
                <div className="prototypeGuideList">
                  {quickGuides.map((guide) => (
                    <div className="prototypeGuideRow" key={guide.label}>
                      <span>{guide.label}</span>
                      <strong>{guide.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </details>

            <details className="prototypeDisclosure prototypePreviewCard">
              <summary className="prototypeDisclosureSummary">
                {t('resultsPreviewTitle')}
              </summary>
              <div className="prototypeDisclosureBody">
                <p className="prototypeInfoLead">{t('resultsPreviewLead')}</p>
                <div className="prototypePreviewList">
                  {previewItems.map((item) => (
                    <div className="prototypePreviewRow" key={item.title}>
                      <strong>{item.title}</strong>
                      <span>{item.body}</span>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </section>

          <article className="prototypeStoryCard" aria-label={t('storyEyebrow')}>
            <p className="prototypeSectionLabel">{t('storyEyebrow')}</p>
            <h2>{t('storyTitle')}</h2>
            <blockquote>{t('storyQuote')}</blockquote>
            <p>{t('storyMeta')}</p>
          </article>

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

        <div className="prototypeNavRow">
          <Link className="prototypeNavLink" href={`/${locale}/rezultate`}>
            {t('navResults')}
          </Link>
          <Link className="prototypeNavLink" href={`/${locale}/browse`}>
            {t('navBrowse')}
          </Link>
        </div>

      </section>
    </main>
  );
}
