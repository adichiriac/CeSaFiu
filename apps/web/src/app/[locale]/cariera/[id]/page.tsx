import {getAllCareers, getCareerById, getProgramsForCareer} from '@/lib/careers/load';
import {isLocale, locales, type Locale} from '@/i18n/config';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import CareerClient from './career-client';

type CareerPageProps = {
  params: Promise<{locale: string; id: string}>;
};

export async function generateStaticParams() {
  const careers = getAllCareers();
  return locales.flatMap((locale) =>
    careers.map((c) => ({locale, id: c.id})),
  );
}

export default async function CareerPage({params}: CareerPageProps) {
  const {locale, id} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale as Locale);

  const career = getCareerById(id);
  if (!career) notFound();

  const programs = getProgramsForCareer(id);

  return <CareerClient career={career} locale={locale} programs={programs} />;
}
