'use client';

/**
 * Phase D — Share-first full-screen overlay.
 *
 * Despite the file name, this is no longer a centered modal — it's a
 * full-viewport overlay so internal scroll works on mobile (the auth-gate
 * modal pattern left the background page underneath catching scroll events,
 * which broke the share flow on iOS Safari). The card body sits inside this
 * overlay with its own scroll container; a sticky header keeps the close
 * button visible while the user scrolls through the card preview / share
 * actions.
 *
 * Auto-opens once per user on the results page (the parent gates this via a
 * localStorage flag). After dismiss the page is reachable normally with a
 * paper-plane re-trigger button positioned over the meta-strip seam.
 *
 * See docs/VIRAL-PHASE-D-PLAN.md §5 D1.1 (and the D1.2 amendment to be
 * landed once telemetry on the full-screen overlay is in).
 */

import {useCallback, useEffect, useRef, type ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {trackEvent} from '@/lib/analytics/umami';

type ShareableCardModalProps = {
  open: boolean;
  onDismiss: () => void;
  trigger: 'auto' | 'manual';
  /** Whether the user shared while the overlay was open — drives dismiss telemetry. */
  didShare: boolean;
  children: ReactNode;
};

export default function ShareableCardModal({open, onDismiss, trigger, didShare, children}: ShareableCardModalProps) {
  const t = useTranslations('shareableCard.modal');
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      openedAtRef.current = null;
      return;
    }
    openedAtRef.current = Date.now();
    trackEvent('card_modal_opened', {trigger});
    // Move focus into the overlay for keyboard users.
    closeButtonRef.current?.focus();
  }, [open, trigger]);

  // Compose dismissal into a single handler so telemetry stays consistent
  // across ESC / X button paths.
  const dismiss = useCallback(() => {
    const elapsed = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
    trackEvent('card_modal_dismissed', {time_open_ms: elapsed, did_share: didShare});
    onDismiss();
  }, [didShare, onDismiss]);

  // ESC key closes the overlay.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, dismiss]);

  // Lock body scroll while open so background page doesn't drift when the
  // user scrolls inside the overlay. The overlay itself is the scroll
  // container; the body is locked.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      data-rrweb-mask
      data-umami-ignore
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--paper)',
        zIndex: 100,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Sticky header — X close stays visible while content scrolls. */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          background: 'var(--paper)',
          padding: '12px 16px',
          borderBottom: '2px solid #000',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={dismiss}
          aria-label={t('closeLabel')}
          style={{
            width: 42,
            height: 42,
            border: '2px solid #000',
            background: '#fff',
            color: '#000',
            boxShadow: '3px 3px 0 #000',
            fontSize: 22,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Content — max-width caps on desktop, fills mobile naturally. */}
      <div style={{maxWidth: 480, margin: '0 auto', padding: '16px 16px 56px'}}>
        {children}
      </div>
    </div>
  );
}
