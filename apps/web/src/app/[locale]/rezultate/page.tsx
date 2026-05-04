import {isLocale, type Locale} from '@/i18n/config';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import ResultsClient from './results-client';

type ResultsPageProps = {
  params: Promise<{locale: string}>;
};

export default async function ResultsPage({params}: ResultsPageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale as Locale);

  return <ResultsClient locale={locale} />;
}
