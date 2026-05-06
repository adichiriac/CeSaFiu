import type {MetadataRoute} from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? 'https://cesafiu.ro').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/ro/auth/',
        '/en/auth/',
        '/ro/acord-parinte',
        '/en/acord-parinte',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
