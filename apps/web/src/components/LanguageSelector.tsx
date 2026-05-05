'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';

const LOCALES: Record<string, {flag: string; label: string}> = {
  ro: {flag: '🇷🇴', label: 'Română'},
  en: {flag: '🇬🇧', label: 'English'}
};

export function LanguageSelector() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchLocale(next: string) {
    // Replace /<locale>/ prefix in the pathname
    const newPath = `/${next}${pathname.slice(locale.length + 1)}`;
    router.push(newPath);
    setOpen(false);
  }

  const current = LOCALES[locale] ?? LOCALES['ro'];
  const others = Object.entries(LOCALES).filter(([code]) => code !== locale);

  return (
    <div className="langSelector" ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Language: ${current.label}`}
        className="langSelectorBtn"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <span aria-hidden="true" className="langFlag">{current.flag}</span>
      </button>

      {open && (
        <ul className="langDropdown" role="listbox">
          {others.map(([code, info]) => (
            <li key={code} role="option" aria-selected={false}>
              <button
                className="langOption"
                onClick={() => switchLocale(code)}
                type="button"
              >
                <span aria-hidden="true" className="langFlag">{info.flag}</span>
                <span>{info.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
