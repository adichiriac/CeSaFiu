import {getAllCareers} from '@/lib/careers/load';
import {isLocale, locales, type Locale} from '@/i18n/config';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import ProfileClient from './profile-client';

type ProfilePageProps = {
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function ProfilePage({params}: ProfilePageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale as Locale);

  return <ProfileClient careers={getAllCareers()} locale={locale} />;
}
