'use client';

/**
 * Header account indicator — answers "am I signed in, and with what email?"
 *
 *   signed out → outlined button "Intră în cont" (opens the magic-link modal)
 *   signed in  → avatar with the email initial + status dot; click opens a
 *                small menu: email, where the data lives, sign out.
 *
 * Renders nothing while auth is loading or when Supabase isn't configured,
 * so the header never flashes the wrong state.
 */

import Link from 'next/link';
import {useLocale, useTranslations} from 'next-intl';
import {useEffect, useId, useRef, useState} from 'react';
import {useAuthGate} from '@/components/auth/auth-provider';

/** Material Symbols ligature name (not user-facing copy). */
const SIGNED_OUT_ICON = 'person';

export default function AccountChip() {
  const t = useTranslations('account');
  const locale = useLocale();
  const {configured, loading, user, email, syncState, signOut, openAccount} = useAuthGate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!configured || loading) return null;

  if (!user) {
    return (
      <button
        aria-label={t('signInAria')}
        className="accountChip isSignedOut"
        onClick={openAccount}
        title={t('signInAria')}
        type="button"
      >
        <span aria-hidden="true" className="material-symbols-outlined accountChipIcon">{SIGNED_OUT_ICON}</span>
        <span className="accountChipLabel">{t('signIn')}</span>
      </button>
    );
  }

  const initial = (email ?? '?').trim().charAt(0).toUpperCase() || '?';
  const statusKey =
    syncState === 'synced'
      ? 'statusSynced'
      : syncState === 'pending_consent'
        ? 'statusPending'
        : syncState === 'needs_sync'
          ? 'statusNeedsSync'
          : 'statusNeedsAge';

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setBusy(false);
    setOpen(false);
  }

  return (
    <div className="accountChipWrap" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('menuAria', {email: email ?? ''})}
        className={`accountChip isSignedIn is-${syncState}`}
        onClick={() => setOpen((value) => !value)}
        title={email ?? undefined}
        type="button"
      >
        <span aria-hidden="true" className="accountChipAvatar">{initial}</span>
        <span aria-hidden="true" className="accountChipDot" />
      </button>

      {open ? (
        <div className="accountMenu" data-rrweb-mask data-umami-ignore id={menuId} role="dialog" aria-label={t('menuTitle')}>
          <p className="accountMenuEyebrow">{t('signedInAs')}</p>
          <p className="accountMenuEmail">{email}</p>
          <p className={`accountMenuStatus is-${syncState}`}>{t(statusKey)}</p>
          {syncState !== 'synced' ? (
            <button
              className="button buttonPrimary accountMenuAction"
              onClick={() => {
                setOpen(false);
                openAccount();
              }}
              type="button"
            >
              {syncState === 'needs_sync' ? t('retrySync') : t('finishSetup')}
            </button>
          ) : null}
          <Link className="accountMenuLink" href={`/${locale}/profil`} onClick={() => setOpen(false)}>
            {t('openProfile')}
          </Link>
          <button className="accountMenuSignOut" disabled={busy} onClick={handleSignOut} type="button">
            {busy ? t('signingOut') : t('signOut')}
          </button>
          {syncState === 'synced' ? <p className="accountMenuNote">{t('signOutNote')}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
