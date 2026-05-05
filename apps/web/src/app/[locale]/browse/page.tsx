import {getAllCareers, getAllInstitutions, getAllPaths, getAllPrograms} from '@/lib/careers/load';
import {isLocale, type Locale} from '@/i18n/config';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import BrowseClient from './browse-client';

type BrowsePageProps = {
  params: Promise<{locale: string}>;
};

export default async function BrowsePage({params}: BrowsePageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale as Locale);

  const careers = getAllCareers();
  const institutions = getAllInstitutions();
  const programs = getAllPrograms();
  const paths = getAllPaths();

  return <BrowseClient careers={careers} institutions={institutions} locale={locale} paths={paths} programs={programs} />;
}
