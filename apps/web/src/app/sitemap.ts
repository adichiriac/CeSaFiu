import type {MetadataRoute} from 'next';
import {locales} from '@/i18n/config';
import {getAllCareers} from '@/lib/careers/load';
import type {QuestionnaireSlug} from '@/lib/questionnaires/types';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? 'https://cesafiu.ro').replace(/\/$/, '');
type SitemapEntry = MetadataRoute.Sitemap[number];

function localizedPath(path: string) {
  return Object.fromEntries(locales.map((locale) => [locale, `${SITE_URL}/${locale}${path}`]));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const appRoutes = ['', '/browse', '/rezultate', '/profil'];
  const testRoutes: QuestionnaireSlug[] = ['scenarii', 'vocational', 'personalitate', 'vocational-deep', 'ipip-neo-60'];
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

  const testEntries: SitemapEntry[] = testRoutes.flatMap((slug) => {
    const path = `/test/${slug}`;
    const isEntryTest = slug === 'scenarii' || slug === 'vocational';

    return locales.map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: isEntryTest ? 0.8 : 0.65,
      alternates: {
        languages: localizedPath(path),
      },
    }));
  });

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

  return [...staticEntries, ...testEntries, ...careerEntries];
}
