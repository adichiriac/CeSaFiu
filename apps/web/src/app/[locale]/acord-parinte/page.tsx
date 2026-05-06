import {isLocale, locales, type Locale} from '@/i18n/config';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import Link from 'next/link';
import {notFound} from 'next/navigation';

export const dynamic = 'force-dynamic';

type Status = 'confirmed' | 'expired' | 'already_used' | 'invalid' | 'error';

const STATUSES: Status[] = ['confirmed', 'expired', 'already_used', 'invalid', 'error'];

function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && (STATUSES as string[]).includes(value);
}

type AcordParintePageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{status?: string}>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function AcordParintePage({params, searchParams}: AcordParintePageProps) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale as Locale);

  const {status: rawStatus} = await searchParams;
  // Default to "invalid" so a bare /acord-parinte hit still gets a coherent
  // page instead of crashing. `error` is folded into the same UI as `invalid`
  // — same user advice, same CTA.
  const status: Status = isStatus(rawStatus) ? rawStatus : 'invalid';
  const uiKey = status === 'error' ? 'invalid' : status;

  const t = await getTranslations('parentConsentPage');
  const homeT = await getTranslations('home');

  const eyebrow = t(`${uiKey}Eyebrow` as const);
  const title = t(`${uiKey}Title` as const);
  const lead = t(`${uiKey}Lead` as const);

  return (
    <main className="questionnairePage">
      <section className="questionnairePanel consentRequiredPanel">
        <Link className="miniBrand" href={`/${locale}`}>
          <span>{homeT('brandCe')}</span>
          <strong>{homeT('brandRest')}</strong>
        </Link>
        <p className="testEyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{lead}</p>
        <Link className="button buttonPrimary" href={`/${locale}`}>
          {t('ctaHome')}
        </Link>
      </section>
    </main>
  );
}
