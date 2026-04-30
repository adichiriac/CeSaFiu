import {isLocale, locales, type Locale} from '@/i18n/config';
import {getQuestionnaire} from '@/lib/questionnaires/load';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import QuestionnaireClient from './questionnaire-client';

type TestPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    ['scenarii', 'personalitate', 'ipip-neo-60', 'vocational'].map((slug) => ({
      locale,
      slug
    }))
  );
}

export default async function TestPlaceholderPage({params}: TestPageProps) {
  const {locale, slug} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const t = await getTranslations('home');
  const definition = getQuestionnaire(slug);

  if (!definition) {
    notFound();
  }

  return <QuestionnaireClient brandCe={t('brandCe')} brandRest={t('brandRest')} definition={definition} locale={locale} />;
}
