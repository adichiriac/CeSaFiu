import type {Metadata, Viewport} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getMessages, getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import Script from 'next/script';
import {Suspense, type ReactNode} from 'react';
import '../globals.css';
import {isLocale, locales, type Locale} from '@/i18n/config';
import {AuthProvider} from '@/components/auth/auth-provider';
import FeedbackWidget from '@/components/feedback/feedback-widget';
import PwaManager from '@/components/pwa/pwa-manager';
import ReferralTracker from '@/components/referrals/referral-tracker';

// Applied before paint to avoid a light/dark flash; mirrors theme-toggle logic.
const THEME_INIT_SCRIPT =
  "(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();";

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

export const viewport: Viewport = {
  themeColor: [
    {media: '(prefers-color-scheme: light)', color: '#fef9f1'},
    {media: '(prefers-color-scheme: dark)', color: '#161318'}
  ]
};

export async function generateMetadata({params}: LocaleLayoutProps): Promise<Metadata> {
  const {locale} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: 'meta'});
  const title = t('title');
  const description = t('description');
  const baseUrl = 'https://cesafiu.ro';

  return {
    applicationName: 'Ce Să Fiu?',
    title,
    description,
    manifest: '/site.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'Ce Să Fiu?'
    },
    formatDetection: {
      telephone: false
    },
    icons: {
      icon: [
        {url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png'},
        {url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png'}
      ],
      apple: [{url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png'}],
      other: [
        {rel: 'manifest', url: '/site.webmanifest'},
        {rel: 'icon', url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png'},
        {rel: 'icon', url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png'}
      ]
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}`,
      siteName: 'Ce Să Fiu?',
      images: [
        {
          url: `${baseUrl}/og-card-v2.png`,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      locale,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-card-v2.png`]
    }
  };
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const messages = await getMessages();

  // suppressHydrationWarning: the no-flash theme script sets data-theme on
  // <html> before hydration, so this attribute legitimately differs from the
  // server render. Suppression is attribute-only and element-scoped.
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Apply stored theme before paint to prevent a flash of the wrong theme */}
        <script dangerouslySetInnerHTML={{__html: THEME_INIT_SCRIPT}} />
        {/* Material Symbols for quiz icons */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap"
          rel="stylesheet"
        />
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
            <PwaManager locale={locale} />
            <FeedbackWidget />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
