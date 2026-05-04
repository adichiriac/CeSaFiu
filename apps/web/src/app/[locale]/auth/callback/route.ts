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

export async function GET(request: Request, context: AuthCallbackContext) {
  const {locale} = await context.params;
  if (!isLocale(locale)) {
    return NextResponse.redirect(new URL('/ro/profil?auth_error=1', request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = safeRedirectPath(locale, requestUrl.searchParams.get('next'));
  const supabase = await getSupabaseServerClient();

  if (!supabase || !code) {
    return NextResponse.redirect(new URL(`/${locale}/profil?auth_error=1`, request.url));
  }

  const {error} = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/${locale}/profil?auth_error=1`, request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
