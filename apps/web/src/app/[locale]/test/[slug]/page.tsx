import {isLocale, locales, type Locale} from '@/i18n/config';
import {getQuestionnaire} from '@/lib/questionnaires/load';
import {getSupabaseServerClient} from '@/lib/supabase/server';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import QuestionnaireClient from './questionnaire-client';

type TestPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateStaticParams() {
  return locales.flatMap((locale) =>
    ['scenarii', 'personalitate', 'ipip-neo-60', 'vocational', 'vocational-deep'].map((slug) => ({
      locale,
      slug
    }))
  );
}

export default async function TestPlaceholderPage({params}: TestPageProps) {
  const {locale, slug} = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);
  const t = await getTranslations('home');
  const definition = getQuestionnaire(slug);

  if (!definition) {
    notFound();
  }

  if (slug === 'ipip-neo-60') {
    const supabase = await getSupabaseServerClient();
    const {data: userData} = supabase ? await supabase.auth.getUser() : {data: {user: null}};

    if (supabase && userData.user) {
      const {data: profile} = await supabase
        .from('profiles')
        .select('consent_status')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (profile?.consent_status === 'pending_parent') {
        const authT = await getTranslations('auth');
        return (
          <main className="questionnairePage">
            <section className="questionnairePanel consentRequiredPanel">
              <Link className="miniBrand" href={`/${locale}`}>
                <span>{t('brandCe')}</span>
                <strong>{t('brandRest')}</strong>
              </Link>
              <p className="testEyebrow">{authT('consentRequiredEyebrow')}</p>
              <h1>{authT('consentRequiredTitle')}</h1>
              <p>{authT('consentRequiredLead')}</p>
              <Link className="button buttonPrimary" href={`/${locale}/test/scenarii`}>
                {authT('consentRequiredCTA')}
              </Link>
            </section>
          </main>
        );
      }
    }
  }

  return <QuestionnaireClient brandCe={t('brandCe')} brandRest={t('brandRest')} definition={definition} locale={locale} />;
}
