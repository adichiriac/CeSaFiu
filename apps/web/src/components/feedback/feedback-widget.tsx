'use client';

/**
 * Hovering feedback widget.
 *
 * Renders a discreet tab on the right edge of the viewport. Click opens a
 * three-step panel:
 *
 *   1. Rating  — pick an emoji 1..5 (always required, single tap submits if user
 *                bails on step 2; we capture the rating immediately).
 *   2. Detail  — optional message + category. Skippable.
 *   3. Done    — thank-you, auto-closes after a moment.
 *
 * Always-linked-when-logged-in: if a Supabase session is present, the request
 * goes out with the access token in `Authorization`. The server resolves
 * the user_id from that and stores it on the row. No opt-in checkbox.
 *
 * Anti-abuse:
 *   - Honeypot field `website` (must stay empty)
 *   - Cloudflare Turnstile (when configured) — token requested only when the
 *     widget is opened, so we don't load CF script on every page-view
 *   - Server enforces rate limiting independently
 *   - We persist a short anon-session token in localStorage purely for soft
 *     dedup; it's hashed server-side before storage
 */

import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {useLocale, useTranslations} from 'next-intl';
import Script from 'next/script';
import {usePathname} from 'next/navigation';
import {useCallback, useEffect, useId, useMemo, useRef, useState} from 'react';

const ANON_SESSION_STORAGE_KEY = 'cesafiu.feedback.anon';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type Category = 'bug' | 'confused' | 'suggestion' | 'praise';
type Stage = 'rating' | 'detail' | 'done';

const RATINGS: Array<{value: 1 | 2 | 3 | 4 | 5; emoji: string; key: string}> = [
  {value: 1, emoji: '😞', key: 'rating1'},
  {value: 2, emoji: '😕', key: 'rating2'},
  {value: 3, emoji: '😐', key: 'rating3'},
  {value: 4, emoji: '🙂', key: 'rating4'},
  {value: 5, emoji: '🤩', key: 'rating5'}
];

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'flexible' | 'compact' | 'invisible';
          appearance?: 'always' | 'execute' | 'interaction-only';
        }
      ) => string;
      execute: (id: string) => void;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

function getOrCreateAnonSession(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.localStorage.getItem(ANON_SESSION_STORAGE_KEY);
    if (existing) return existing;
    const fresh = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(ANON_SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    return '';
  }
}

function suggestCategory(rating: number): Category | null {
  if (rating <= 2) return 'bug';
  if (rating === 3) return 'confused';
  if (rating === 4) return 'suggestion';
  return 'praise';
}

export default function FeedbackWidget() {
  const t = useTranslations('feedback');
  const locale = useLocale();
  const pathname = usePathname();
  const dialogId = useId();

  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>('rating');
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState('');
  // Honeypot — bots fill any visible field.
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const turnstileTokenResolverRef = useRef<((token: string) => void) | null>(null);
  const [turnstileScriptReady, setTurnstileScriptReady] = useState(false);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  // Mount the Turnstile widget once the script + container are both ready.
  useEffect(() => {
    if (!turnstileSiteKey || !turnstileScriptReady || !open) return;
    if (turnstileWidgetIdRef.current) return;
    if (!turnstileContainerRef.current || !window.turnstile) return;

    try {
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        action: 'feedback',
        size: 'invisible',
        appearance: 'interaction-only',
        callback: (token) => {
          const resolve = turnstileTokenResolverRef.current;
          turnstileTokenResolverRef.current = null;
          resolve?.(token);
        },
        'error-callback': () => {
          const resolve = turnstileTokenResolverRef.current;
          turnstileTokenResolverRef.current = null;
          resolve?.('');
        }
      });
    } catch (err) {
      console.warn('feedback: turnstile_render_failed', err);
    }
  }, [turnstileSiteKey, turnstileScriptReady, open]);

  // Tear down Turnstile on unmount so we don't leak a hidden iframe between
  // route navigations.
  useEffect(() => {
    return () => {
      if (turnstileWidgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(turnstileWidgetIdRef.current);
        } catch {
          // ignore
        }
        turnstileWidgetIdRef.current = null;
      }
    };
  }, []);

  const requestTurnstileToken = useCallback((): Promise<string> => {
    if (!turnstileSiteKey || !window.turnstile || !turnstileWidgetIdRef.current) {
      // Soft mode — server accepts empty token if it's also unconfigured.
      return Promise.resolve('');
    }
    return new Promise<string>((resolve) => {
      turnstileTokenResolverRef.current = resolve;
      // Reset previous state so execute always produces a fresh token.
      try {
        window.turnstile?.reset(turnstileWidgetIdRef.current ?? undefined);
        window.turnstile?.execute(turnstileWidgetIdRef.current!);
      } catch {
        resolve('');
      }
      // Don't hang forever on a slow/blocked CF challenge.
      setTimeout(() => {
        if (turnstileTokenResolverRef.current === resolve) {
          turnstileTokenResolverRef.current = null;
          resolve('');
        }
      }, 8000);
    });
  }, [turnstileSiteKey]);

  const handleRating = useCallback(
    (value: number) => {
      setRating(value);
      setCategory((prev) => prev ?? suggestCategory(value));
      setStage('detail');
    },
    [setRating, setCategory, setStage]
  );

  const handleSubmit = useCallback(async () => {
    if (!rating || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const turnstileToken = await requestTurnstileToken();

      const sessionPromise = supabase ? supabase.auth.getSession() : Promise.resolve(null);
      const sessionResult = await sessionPromise;
      const accessToken =
        sessionResult && 'data' in sessionResult ? sessionResult.data.session?.access_token : undefined;

      const headers: Record<string, string> = {'content-type': 'application/json'};
      if (accessToken) {
        headers.authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          rating,
          category,
          message: message.trim() || null,
          pagePath: pathname ?? null,
          locale,
          appVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? null,
          website,
          turnstileToken,
          anonSessionToken: accessToken ? undefined : getOrCreateAnonSession()
        })
      });

      if (response.ok) {
        setStage('done');
        // Auto-close after a beat so the user can read the thank-you.
        setTimeout(() => {
          setOpen(false);
          // Reset state so the next open starts clean.
          setStage('rating');
          setRating(null);
          setCategory(null);
          setMessage('');
        }, 2000);
        return;
      }

      if (response.status === 429) {
        setError(t('errorRateLimited'));
      } else {
        setError(t('errorGeneric'));
      }
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setSubmitting(false);
    }
  }, [rating, category, message, website, pathname, locale, supabase, requestTurnstileToken, submitting, t]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Close on Escape key for a11y.
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {turnstileSiteKey ? (
        <Script
          src={TURNSTILE_SCRIPT_SRC}
          strategy="lazyOnload"
          onLoad={() => setTurnstileScriptReady(true)}
        />
      ) : null}

      <button
        type="button"
        className="feedbackTab"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span aria-hidden="true">💬</span>
        <span className="feedbackTabLabel">{t('tab')}</span>
      </button>

      <div
        id={dialogId}
        role="dialog"
        aria-label={t('dialogLabel')}
        aria-hidden={!open}
        className={open ? 'feedbackPanel feedbackPanelOpen' : 'feedbackPanel'}
      >
        <div className="feedbackPanelInner">
          <div className="feedbackHeader">
            <h2 className="feedbackTitle">{t('title')}</h2>
            <button
              type="button"
              className="feedbackClose"
              onClick={handleClose}
              aria-label={t('close')}
            >
              {t('closeIcon')}
            </button>
          </div>

          {stage === 'rating' ? (
            <div className="feedbackBody">
              <p className="feedbackPrompt">{t('ratingPrompt')}</p>
              <div className="feedbackRatings" role="radiogroup" aria-label={t('ratingPrompt')}>
                {RATINGS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={rating === option.value}
                    aria-label={t(option.key)}
                    className={
                      rating === option.value
                        ? 'feedbackRating feedbackRatingActive'
                        : 'feedbackRating'
                    }
                    onClick={() => handleRating(option.value)}
                  >
                    <span aria-hidden="true">{option.emoji}</span>
                  </button>
                ))}
              </div>
              <p className="feedbackHint">{t('hintAnonymous')}</p>
            </div>
          ) : null}

          {stage === 'detail' ? (
            <div className="feedbackBody">
              <p className="feedbackPrompt">{t('detailPrompt')}</p>

              <div className="feedbackCategories" role="radiogroup" aria-label={t('categoryLabel')}>
                {(['bug', 'confused', 'suggestion', 'praise'] as Category[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="radio"
                    aria-checked={category === cat}
                    className={
                      category === cat
                        ? 'feedbackCategory feedbackCategoryActive'
                        : 'feedbackCategory'
                    }
                    onClick={() => setCategory(cat)}
                  >
                    {t(`category_${cat}`)}
                  </button>
                ))}
              </div>

              <label className="feedbackFieldLabel" htmlFor={`${dialogId}-msg`}>
                {t('messageLabel')}
              </label>
              <textarea
                id={`${dialogId}-msg`}
                className="feedbackTextarea"
                value={message}
                onChange={(event) => setMessage(event.target.value.slice(0, 500))}
                maxLength={500}
                rows={4}
                placeholder={t('messagePlaceholder')}
              />
              <div className="feedbackCharCount" aria-live="polite">
                {t('charCount', {count: message.length, max: 500})}
              </div>

              {/* Honeypot — visually hidden, autocomplete=off, ignored by users. */}
              <label className="feedbackHoneypot" aria-hidden="true">
                {t('honeypotLabel')}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </label>

              {error ? (
                <p className="feedbackError" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="feedbackActions">
                <button
                  type="button"
                  className="feedbackButtonGhost"
                  onClick={() => setStage('rating')}
                >
                  {t('back')}
                </button>
                <button
                  type="button"
                  className="feedbackButton"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? t('submitting') : t('submit')}
                </button>
              </div>
            </div>
          ) : null}

          {stage === 'done' ? (
            <div className="feedbackBody">
              <p className="feedbackThanks">{t('thanks')}</p>
            </div>
          ) : null}

          <div ref={turnstileContainerRef} aria-hidden="true" className="feedbackTurnstile" />
        </div>
      </div>
    </>
  );
}
