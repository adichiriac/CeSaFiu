/**
 * Minimal Umami event-tracking helper.
 *
 * The Umami script is loaded in apps/web/src/app/[locale]/layout.tsx; it
 * auto-tracks pageviews. This wrapper lets components fire custom events
 * without throwing if the script is blocked, not yet loaded, or running
 * server-side.
 */

type UmamiData = Record<string, string | number | boolean | null | undefined>;

type UmamiWindow = {
  umami?: {
    track?: (event: string, data?: UmamiData) => void;
  };
};

/**
 * Fire a custom Umami event. Safe to call from server-rendered code (no-op).
 * Safe to call before the Umami script has loaded (no-op).
 */
export function trackEvent(event: string, data?: UmamiData): void {
  if (typeof window === 'undefined') return;
  const win = window as unknown as UmamiWindow;
  const umami = win.umami;
  if (!umami || typeof umami.track !== 'function') return;
  try {
    umami.track(event, data);
  } catch {
    // Swallow — analytics must never break the UI.
  }
}
