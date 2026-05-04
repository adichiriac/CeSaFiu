import createMiddleware from 'next-intl/middleware';
import type {NextRequest} from 'next/server';
import {defaultLocale, locales} from './i18n/config';

const intlMiddleware = createMiddleware({
  defaultLocale,
  locales,
  localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  const location = response.headers.get('location');

  if (!location) {
    return response;
  }

  const publicHost = getPublicHost(request);
  if (publicHost !== 'cesafiu.ro' && publicHost !== 'www.cesafiu.ro') {
    return response;
  }

  try {
    const redirectUrl = new URL(location);
    if (redirectUrl.port === '8080' && redirectUrl.hostname === publicHost) {
      redirectUrl.port = '';
      response.headers.set('location', redirectUrl.toString());
    }
  } catch {
    // Leave non-absolute locations untouched.
  }

  return response;
}

function getPublicHost(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host') ?? '';
  return host.split(',')[0]?.trim().replace(/:\d+$/, '') ?? '';
}

export const config = {
  matcher: ['/', '/(ro|en)/:path*']
};
