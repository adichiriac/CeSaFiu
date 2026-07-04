import Link from 'next/link';
import {notFound} from 'next/navigation';
import {setRequestLocale} from 'next-intl/server';
import {isLocale, type Locale} from '@/i18n/config';

type OfflinePageProps = {
  params: Promise<{locale: string}>;
};

const copy = {
  ro: {
    eyebrow: 'Offline',
    title: 'Nu avem conexiune acum',
    lead: 'Poți continua ce era deja încărcat. Testele începute rămân salvate pe dispozitiv și revin când ai internet.',
    home: 'Înapoi la start',
    profile: 'Vezi profilul'
  },
  en: {
    eyebrow: 'Offline',
    title: 'No connection right now',
    lead: 'You can keep using what was already loaded. Started tests stay saved on this device and come back when you are online.',
    home: 'Back to start',
    profile: 'View profile'
  }
};

export default async function OfflinePage({params}: OfflinePageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale as Locale);

  const t = copy[locale as Locale];

  return (
    <main className="offlinePage">
      <section className="offlinePanel" aria-labelledby="offline-title">
        <p className="testEyebrow">{t.eyebrow}</p>
        <h1 id="offline-title">{t.title}</h1>
        <p>{t.lead}</p>
        <div className="offlineActions">
          <Link className="button buttonPrimary" href={`/${locale}`}>
            {t.home}
          </Link>
          <Link className="button" href={`/${locale}/profil`}>
            {t.profile}
          </Link>
        </div>
      </section>
    </main>
  );
}
