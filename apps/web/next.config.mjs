import {withSentryConfig} from '@sentry/nextjs';
import withSerwistInit from '@serwist/next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const buildRevision = process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.NEXT_PUBLIC_COMMIT_SHA ?? String(Date.now());
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  register: false,
  cacheOnNavigation: false,
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [
    {
      url: '/ro/offline',
      revision: buildRevision
    },
    {
      url: '/en/offline',
      revision: buildRevision
    }
  ]
});

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true
};

export default withSentryConfig(withSerwist(withNextIntl(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  widenClientFileUpload: false
});
