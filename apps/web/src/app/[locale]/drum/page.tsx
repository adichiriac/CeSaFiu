import {getAllCareers, getAllPaths} from '@/lib/careers/load';
import {getJourneyPaths} from '@/lib/journey/load';
import {isLocale, locales, type Locale} from '@/i18n/config';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import JourneyClient from './journey-client';

type DrumPageProps = {
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function DrumPage({params}: DrumPageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale as Locale);

  // Slim payload: the journey only needs identity fields per career.
  const careers = getAllCareers().map(({id, name, emoji, color}) => ({id, name, emoji, color}));

  return (
    <JourneyClient
      careers={careers}
      journeyPaths={getJourneyPaths()}
      locale={locale}
      paths={getAllPaths()}
    />
  );
}
