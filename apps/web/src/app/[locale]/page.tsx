import {getTranslations, setRequestLocale} from 'next-intl/server';
import {isLocale, type Locale} from '@/i18n/config';
import Link from 'next/link';
import {notFound} from 'next/navigation';

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

type TestCard = {
  id: 'scenarii' | 'personalitate' | 'ipip' | 'vocational';
  label: string;
  sub: string;
  description: string;
  href: string;
  action: string;
};

export default async function HomePage({params}: HomePageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const t = await getTranslations('home');
  const tests = t.raw('tests') as TestCard[];

  return (
    <main className="prototypeHome">
      <section className="prototypeCanvas" aria-labelledby="home-title">
        <header className="prototypeHeader">
          <Link className="prototypeBrand" href={`/${locale}`} aria-label={t('brand')}>
            <span>{t('brandCe')}</span>
            <strong>{t('brandRest')}</strong>
          </Link>
          <button className="helpButton" type="button" aria-label={t('helpLabel')}>
            {t('helpGlyph')}
          </button>
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

        <p className="prototypeLead">{t('lead')}</p>

        <div className="prototypeTestRail">
          {tests.map((test) => (
            <Link
              className={`prototypeTestCard prototypeTestCard-${test.id}`}
              href={`/${locale}${test.href}`}
              key={test.id}
            >
              <span className="prototypeIcon" aria-hidden="true" />
              <span className="prototypeCardCopy">
                <strong>{test.label}</strong>
                <span>{test.sub}</span>
              </span>
              <span className="prototypeArrow" aria-label={t('arrowLabel')} role="img">
                {t('arrowGlyph')}
              </span>
            </Link>
          ))}
        </div>

      </section>
    </main>
  );
}
