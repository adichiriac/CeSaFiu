import {getTranslations, setRequestLocale} from 'next-intl/server';
import {isLocale, type Locale} from '@/i18n/config';
import {notFound} from 'next/navigation';

type HomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function HomePage({params}: HomePageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const t = await getTranslations('home');

  return (
    <main className="shell">
      <section className="intro" aria-labelledby="home-title">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 id="home-title">{t('title')}</h1>
        <p className="lead">{t('lead')}</p>
      </section>
    </main>
  );
}
