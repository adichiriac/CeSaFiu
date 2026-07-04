'use client';

import {Serwist, type SerwistLifecycleWaitingEvent} from '@serwist/window';
import {usePathname} from 'next/navigation';
import {useTranslations} from 'next-intl';
import {useEffect, useMemo, useRef, useState} from 'react';
import {trackEvent} from '@/lib/analytics/umami';

type PwaManagerProps = {
  locale: string;
};

type BeforeInstallPromptChoice = {
  outcome: 'accepted' | 'dismissed';
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<BeforeInstallPromptChoice>;
};

type StandaloneNavigator = Navigator & {
  standalone?: boolean;
};

const PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const PROMPT_COOLDOWN_KEY = 'cesafiu:pwa:lastPromptAt';
const SESSION_EVENT_KEY = 'cesafiu:pwa:sessionTracked';

function isStandaloneDisplay() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as StandaloneNavigator).standalone);
}

function isIosLike() {
  if (typeof navigator === 'undefined') return false;
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function hasCompletedTest() {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith('cesafiu:test:') && key.endsWith(':latest')) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

function isPromptCoolingDown() {
  try {
    const lastPromptAt = Number(localStorage.getItem(PROMPT_COOLDOWN_KEY) ?? 0);
    return Number.isFinite(lastPromptAt) && Date.now() - lastPromptAt < PROMPT_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markPromptShown() {
  try {
    localStorage.setItem(PROMPT_COOLDOWN_KEY, String(Date.now()));
  } catch {
    // Cooldown is best-effort; install UX must not break the app.
  }
}

export default function PwaManager({locale}: PwaManagerProps) {
  const t = useTranslations('pwa');
  const pathname = usePathname();
  const serwistRef = useRef<Serwist | null>(null);
  const reloadForUpdateRef = useRef(false);
  const shownPromptRef = useRef<string | null>(null);
  const [updateReady, setUpdateReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installVisible, setInstallVisible] = useState(false);
  const [iosHintVisible, setIosHintVisible] = useState(false);

  const surface = useMemo<'results' | 'profile' | null>(() => {
    if (pathname === `/${locale}/rezultate`) return 'results';
    if (pathname === `/${locale}/profil`) return 'profile';
    return null;
  }, [locale, pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (sessionStorage.getItem(SESSION_EVENT_KEY)) return;
      sessionStorage.setItem(SESSION_EVENT_KEY, '1');
    } catch {
      // Continue; analytics should be best-effort.
    }

    const standalone = isStandaloneDisplay();
    trackEvent('pwa_session', {
      standalone,
      display_mode: standalone ? 'standalone' : 'browser',
      source: new URLSearchParams(window.location.search).get('source')
    });
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator) || typeof caches === 'undefined') return;

    const serwist = new Serwist('/sw.js', {scope: '/'});
    serwistRef.current = serwist;

    serwist.addEventListener('waiting', (event: SerwistLifecycleWaitingEvent) => {
      if (!navigator.serviceWorker.controller) return;
      if (event.isExternal) return;
      setUpdateReady(true);
      trackEvent('pwa_update_waiting', {is_update: Boolean(event.isUpdate)});
    });

    serwist.addEventListener('controlling', () => {
      if (reloadForUpdateRef.current) {
        window.location.reload();
      }
    });

    void serwist.register();
  }, []);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function onAppInstalled() {
      setInstallVisible(false);
      setDeferredPrompt(null);
      trackEvent('pwa_installed', {source: 'appinstalled'});
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  useEffect(() => {
    const shouldShow =
      Boolean(surface) &&
      hasCompletedTest() &&
      !isStandaloneDisplay() &&
      !isPromptCoolingDown() &&
      (Boolean(deferredPrompt) || isIosLike());

    setInstallVisible(shouldShow);
    setIosHintVisible(shouldShow && !deferredPrompt && isIosLike());

    if (!shouldShow || !surface) {
      return;
    }

    const promptKind = deferredPrompt ? 'native' : 'ios_hint';
    const promptKey = `${surface}:${promptKind}`;
    if (shownPromptRef.current === promptKey) {
      return;
    }

    shownPromptRef.current = promptKey;
    markPromptShown();
    trackEvent('pwa_prompt_shown', {surface, prompt: promptKind});
  }, [deferredPrompt, surface]);

  async function openInstallPrompt() {
    if (iosHintVisible) {
      setInstallVisible(false);
      trackEvent('pwa_prompt_ios_acknowledged', {surface});
      return;
    }

    if (!deferredPrompt) {
      return;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    trackEvent(choice.outcome === 'accepted' ? 'pwa_prompt_accepted' : 'pwa_prompt_dismissed', {
      platform: choice.platform,
      surface
    });
    setDeferredPrompt(null);
    setInstallVisible(false);
  }

  function dismissInstallPrompt() {
    setInstallVisible(false);
    trackEvent('pwa_prompt_dismissed', {surface, reason: 'manual'});
  }

  function reloadForUpdate() {
    reloadForUpdateRef.current = true;
    trackEvent('pwa_update_reload');
    serwistRef.current?.messageSkipWaiting();
  }

  if (!updateReady && !installVisible) {
    return null;
  }

  return (
    <div className="pwaToastStack" aria-live="polite">
      {updateReady ? (
        <section className="pwaToast pwaToast--update" aria-label={t('updateTitle')}>
          <div>
            <strong>{t('updateTitle')}</strong>
            <p>{t('updateBody')}</p>
          </div>
          <button className="pwaToastAction" onClick={reloadForUpdate} type="button">
            {t('updateAction')}
          </button>
        </section>
      ) : null}

      {installVisible ? (
        <section className="pwaToast pwaToast--install" aria-label={iosHintVisible ? t('iosTitle') : t('installTitle')}>
          <button className="pwaToastClose" onClick={dismissInstallPrompt} type="button" aria-label={t('dismiss')}>
            {t('dismissGlyph')}
          </button>
          <div>
            <strong>{iosHintVisible ? t('iosTitle') : t('installTitle')}</strong>
            <p>{iosHintVisible ? t('iosBody') : t('installBody')}</p>
          </div>
          <button className="pwaToastAction" onClick={openInstallPrompt} type="button">
            {iosHintVisible ? t('iosAction') : t('installAction')}
          </button>
        </section>
      ) : null}
    </div>
  );
}
