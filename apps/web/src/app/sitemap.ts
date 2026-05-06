import type {MetadataRoute} from 'next';
import {locales} from '@/i18n/config';
import {getAllCareers} from '@/lib/careers/load';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? 'https://cesafiu.ro').replace(/\/$/, '');
type SitemapEntry = MetadataRoute.Sitemap[number];

function localizedPath(path: string) {
  return Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const appRoutes = ['', '/browse', '/rezultate', '/profil'];
  const staticEntries: SitemapEntry[] = appRoutes.flatMap((path) =>
    locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: path === '' ? 'weekly' : 'monthly',
      priority: path === '' ? 1 : 0.7,
      alternates: {
        languages: localizedPath(path),
      },
    })),
  );

  const careerEntries: SitemapEntry[] = getAllCareers().flatMap((career) =>
    locales.map((locale) => {
      const path = `/cariera/${career.id}`;
      return {
        url: `${SITE_URL}/${locale}${path}`,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: {
          languages: localizedPath(path),
        },
      };
    }),
  );

  return [...staticEntries, ...careerEntries];
}
