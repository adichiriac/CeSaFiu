/// <reference lib="webworker" />

import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
  type PrecacheEntry,
  type RouteMatchCallbackOptions,
  type RuntimeCaching
} from 'serwist';

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<PrecacheEntry | string>;
};

const ONE_DAY = 24 * 60 * 60;
const LOCALE_AUTH_PATH = /^\/(?:ro|en)\/auth(?:\/|$)/;

function isDeniedSameOriginPath(pathname: string) {
  return (
    pathname === '/sw.js' ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/r/') ||
    pathname === '/quiz' ||
    pathname.startsWith('/quiz/') ||
    LOCALE_AUTH_PATH.test(pathname)
  );
}

function isSafeSameOrigin({request, sameOrigin, url}: RouteMatchCallbackOptions) {
  return sameOrigin && request.method === 'GET' && !isDeniedSameOriginPath(url.pathname);
}

function isDocumentRequest(request: Request) {
  return (
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.headers.get('accept')?.includes('text/html')
  );
}

function hasExtension(pathname: string, extensions: string[]) {
  return extensions.some((extension) => pathname.endsWith(extension));
}

const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({sameOrigin, url}) => sameOrigin && url.pathname === '/sw.js',
    handler: new NetworkOnly()
  },
  {
    matcher: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: 'google-fonts-webfonts',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 365 * ONE_DAY,
          maxAgeFrom: 'last-used'
        })
      ]
    })
  },
  {
    matcher: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: 'google-fonts-stylesheets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 7 * ONE_DAY,
          maxAgeFrom: 'last-used'
        })
      ]
    })
  },
  {
    matcher: (options) =>
      isSafeSameOrigin(options) &&
      (options.url.pathname.startsWith('/_next/static/') ||
        hasExtension(options.url.pathname, ['.js', '.css', '.woff', '.woff2'])),
    handler: new CacheFirst({
      cacheName: 'static-build-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 96,
          maxAgeSeconds: ONE_DAY,
          maxAgeFrom: 'last-used'
        })
      ]
    })
  },
  {
    matcher: (options) =>
      isSafeSameOrigin(options) &&
      (options.url.pathname.startsWith('/_next/image') ||
        hasExtension(options.url.pathname, ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp'])),
    handler: new StaleWhileRevalidate({
      cacheName: 'static-image-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 96,
          maxAgeSeconds: 30 * ONE_DAY,
          maxAgeFrom: 'last-used'
        })
      ]
    })
  },
  {
    matcher: (options) =>
      isSafeSameOrigin(options) &&
      hasExtension(options.url.pathname, ['.json', '.xml', '.csv']) &&
      !options.url.pathname.startsWith('/_next/data/'),
    handler: new NetworkFirst({
      cacheName: 'static-data-assets',
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: ONE_DAY,
          maxAgeFrom: 'last-used'
        })
      ]
    })
  },
  {
    matcher: (options) =>
      isSafeSameOrigin(options) &&
      options.request.headers.get('RSC') === '1' &&
      options.request.headers.get('Next-Router-Prefetch') === '1',
    handler: new NetworkFirst({
      cacheName: 'pages-rsc-prefetch',
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: ONE_DAY,
          maxAgeFrom: 'last-used'
        })
      ]
    })
  },
  {
    matcher: (options) => isSafeSameOrigin(options) && options.request.headers.get('RSC') === '1',
    handler: new NetworkFirst({
      cacheName: 'pages-rsc',
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: ONE_DAY,
          maxAgeFrom: 'last-used'
        })
      ]
    })
  },
  {
    matcher: (options) => isSafeSameOrigin(options) && isDocumentRequest(options.request),
    handler: new NetworkFirst({
      cacheName: 'pages-html',
      networkTimeoutSeconds: 4,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: ONE_DAY,
          maxAgeFrom: 'last-used'
        })
      ]
    })
  }
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  cacheId: 'cesafiu',
  disableDevLogs: true,
  runtimeCaching,
  precacheOptions: {
    cleanupOutdatedCaches: true
  }
});

serwist.setCatchHandler(async ({request}) => {
  if (!isDocumentRequest(request)) {
    return Response.error();
  }

  const url = new URL(request.url);
  const fallbackUrl = url.pathname.startsWith('/en') ? '/en/offline' : '/ro/offline';
  return (await serwist.matchPrecache(fallbackUrl)) ?? Response.error();
});

serwist.addEventListeners();
