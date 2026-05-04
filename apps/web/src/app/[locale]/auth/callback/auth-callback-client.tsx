'use client';

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';

export default function AuthCallbackClient({locale}: {locale: string}) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFailed(true);
      return;
    }

    const finish = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        const {error: exchangeError} = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setFailed(true);
          return;
        }
      } else {
        const {error: sessionError} = await supabase.auth.getSession();
        if (sessionError) {
          setFailed(true);
          return;
        }
      }

      router.replace(`/${locale}/profil`);
    };

    void finish();
  }, [locale, router, t]);

  return (
    <main className="questionnairePage">
      <section className="questionnairePanel">
        <p className="testEyebrow">{failed ? t('callbackErrorEyebrow') : t('callbackEyebrow')}</p>
        <h1>{failed ? t('callbackErrorTitle') : t('callbackTitle')}</h1>
        {failed ? <p className="authGateError">{t('callbackErrorLead')}</p> : null}
      </section>
    </main>
  );
}
