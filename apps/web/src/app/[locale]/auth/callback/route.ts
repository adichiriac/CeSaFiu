import {isLocale} from '@/i18n/config';
import {getSupabaseServerClient} from '@/lib/supabase/server';
import {NextResponse} from 'next/server';

type AuthCallbackContext = {
  params: Promise<{
    locale: string;
  }>;
};

function safeRedirectPath(locale: string, value: string | null) {
  if (!value?.startsWith(`/${locale}/`)) {
    return `/${locale}/profil`;
  }

  return value;
}

function getPublicOrigin(request: Request) {
  const configuredOrigin = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (configuredOrigin) {
    return new URL(configuredOrigin).origin;
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const fallbackUrl = new URL(request.url);
  const host = forwardedHost ?? request.headers.get('host')?.split(',')[0]?.trim() ?? fallbackUrl.host;
  const proto = forwardedProto ?? fallbackUrl.protocol.replace(':', '');

  return `${proto}://${host}`;
}

export async function GET(request: Request, context: AuthCallbackContext) {
  const {locale} = await context.params;
  const publicOrigin = getPublicOrigin(request);

  if (!isLocale(locale)) {
    return NextResponse.redirect(new URL('/ro/profil?auth_error=1', publicOrigin));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeRedirectPath(locale, requestUrl.searchParams.get('next'));
  const supabase = await getSupabaseServerClient();

  if (!supabase || !code) {
    return NextResponse.redirect(new URL(`/${locale}/profil?auth_error=1`, publicOrigin));
  }

  const {error} = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/profil?auth_error=1`, publicOrigin));
  }

  return NextResponse.redirect(new URL(next, publicOrigin));
}
