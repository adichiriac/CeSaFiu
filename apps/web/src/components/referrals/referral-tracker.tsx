'use client';

import {useAuthGate} from '@/components/auth/auth-provider';
import {getSupabaseBrowserClient} from '@/lib/supabase/client';
import {captureInboundReferral, recordReferralOnboarded} from '@/lib/referrals/client';
import {usePathname, useSearchParams} from 'next/navigation';
import {useEffect} from 'react';

export default function ReferralTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {user, profile} = useAuthGate();

  useEffect(() => {
    const path = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ''}`;
    void captureInboundReferral(searchParams, path);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!user || !profile || profile.age_band === 'unknown') {
      return;
    }

    async function record() {
      const supabase = getSupabaseBrowserClient();
      const {data} = supabase ? await supabase.auth.getSession() : {data: {session: null}};
      await recordReferralOnboarded(data.session?.access_token);
    }

    void record();
  }, [profile, user]);

  return null;
}
