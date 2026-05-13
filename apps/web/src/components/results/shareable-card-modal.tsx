'use client';

/**
 * Phase D — Share-first modal wrapper.
 *
 * Auto-opens once per user on the results page (gated by a localStorage flag);
 * after dismiss, the page is reachable normally with a small re-trigger button.
 * Reuses the auth gate's visual classes (`authGateBackdrop`, `authGatePanel`,
 * `authGateClose`) so the modal language stays consistent across the app.
 *
 * Body content is the existing <ShareableCard /> orchestrator. This wrapper
 * adds: backdrop, X close, ESC, click-outside dismiss, focus management,
 * Umami `card_modal_opened` / `card_modal_dismissed` events.
 *
 * See docs/VIRAL-PHASE-D-PLAN.md §5 D1.1.
 */

import {useCallback, useEffect, useRef, type ReactNode} from 'react';
import {useTranslations} from 'next-intl';
import {trackEvent} from '@/lib/analytics/umami';

type ShareableCardModalProps = {
  open: boolean;
  onDismiss: () => void;
  trigger: 'auto' | 'manual';
  /** Whether the user shared while the modal was open — drives dismiss telemetry. */
  didShare: boolean;
  children: ReactNode;
};

export default function ShareableCardModal({open, onDismiss, trigger, didShare, children}: ShareableCardModalProps) {
  const t = useTranslations('shareableCard.modal');
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openedAtRef = useRef<number | null>(null);

  // Fire `card_modal_opened` on first open of each cycle, capture timestamp.
  useEffect(() => {
    if (!open) {
      openedAtRef.current = null;
      return;
    }
    openedAtRef.current = Date.now();
    trackEvent('card_modal_opened', {trigger});
    // Move focus into the modal for keyboard users.
    closeButtonRef.current?.focus();
  }, [open, trigger]);

  // Compose dismissal into a single handler so telemetry stays consistent
  // across ESC / outside-click / X button paths.
  const dismiss = useCallback(() => {
    const elapsed = openedAtRef.current ? Date.now() - openedAtRef.current : 0;
    trackEvent('card_modal_dismissed', {time_open_ms: elapsed, did_share: didShare});
    onDismiss();
  }, [didShare, onDismiss]);

  // ESC key closes the modal.
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

  // Lock body scroll while open so the page beneath doesn't drift.
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
      className="authGateBackdrop"
      role="presentation"
      data-rrweb-mask
      data-umami-ignore
      onClick={(e) => {
        // Only close on direct backdrop click, not on bubble from inside.
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <section
        ref={panelRef}
        className="authGatePanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shareable-card-modal-title"
      >
        <button
          ref={closeButtonRef}
          className="authGateClose"
          onClick={dismiss}
          type="button"
          aria-label={t('closeLabel')}
        >
          ×
        </button>
        <p className="authGateEyebrow" id="shareable-card-modal-title">{t('eyebrow')}</p>
        <h2 style={{marginBottom: 8}}>{t('title')}</h2>
        <p>{t('lead')}</p>
        <div style={{marginTop: 18}}>{children}</div>
      </section>
    </div>
  );
}
