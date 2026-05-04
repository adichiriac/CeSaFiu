import {isLocale, type Locale} from '@/i18n/config';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import AuthCallbackClient from './auth-callback-client';

type AuthCallbackPageProps = {
  params: Promise<{locale: string}>;
};

export default async function AuthCallbackPage({params}: AuthCallbackPageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  return <AuthCallbackClient locale={locale} />;
}
