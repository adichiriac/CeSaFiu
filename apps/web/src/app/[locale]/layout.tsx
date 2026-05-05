import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import Script from 'next/script';
import {Suspense, type ReactNode} from 'react';
import '../globals.css';
import {isLocale, locales, type Locale} from '@/i18n/config';
import {AuthProvider} from '@/components/auth/auth-provider';
import ReferralTracker from '@/components/referrals/referral-tracker';

const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL ?? 'https://umami-production-00d8.up.railway.app';
const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? 'b582fdd9-94f2-47c2-86ce-54bcc810e434';

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export async function generateMetadata({params}: LocaleLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: 'meta'});
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <Script
          data-website-id={UMAMI_ID}
          defer
          src={`${UMAMI_URL}/script.js`}
          strategy="afterInteractive"
        />
        <Script
          data-mask-level="moderate"
          data-max-duration="300000"
          data-sample-rate="0.15"
          data-website-id={UMAMI_ID}
          defer
          src={`${UMAMI_URL}/recorder.js`}
          strategy="afterInteractive"
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Suspense fallback={null}>
              <ReferralTracker />
            </Suspense>
            {children}
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
