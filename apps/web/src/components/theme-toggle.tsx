'use client';

import {useEffect, useState} from 'react';
import {useTranslations} from 'next-intl';

type ThemeMode = 'system' | 'light' | 'dark';

const ORDER: ThemeMode[] = ['system', 'light', 'dark'];
const ICON: Record<ThemeMode, string> = {
  system: 'brightness_auto',
  light: 'light_mode',
  dark: 'dark_mode'
};

function applyMode(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'system') {
    root.removeAttribute('data-theme');
    try {
      localStorage.removeItem('theme');
    } catch {
      /* ignore */
    }
    return;
  }
  root.setAttribute('data-theme', mode);
  try {
    localStorage.setItem('theme', mode);
  } catch {
    /* ignore */
  }
}

export default function ThemeToggle() {
  const t = useTranslations('theme');
  const [mode, setMode] = useState<ThemeMode>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: ThemeMode = 'system';
    try {
      const raw = localStorage.getItem('theme');
      if (raw === 'light' || raw === 'dark') {
        stored = raw;
      }
    } catch {
      /* ignore */
    }
    setMode(stored);
    setMounted(true);
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length];
    setMode(next);
    applyMode(next);
  }

  // Avoid hydration mismatch: render a stable placeholder until mounted.
  const label = t(mode);

  return (
    <button
      aria-label={t('cycle', {mode: label})}
      className="themeToggle"
      onClick={cycle}
      title={t('cycle', {mode: label})}
      type="button"
    >
      <span aria-hidden="true" className="material-symbols-outlined themeToggleIcon">
        {mounted ? ICON[mode] : ICON.system}
      </span>
      <span className="themeToggleLabel">{mounted ? label : ''}</span>
    </button>
  );
}
