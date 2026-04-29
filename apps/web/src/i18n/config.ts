export const locales = ['ro', 'en'] as const;
export const defaultLocale = 'ro';

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
