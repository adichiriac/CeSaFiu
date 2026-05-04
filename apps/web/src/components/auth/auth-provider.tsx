'use client';

import {getSupabaseBrowserClient, isSupabaseConfigured} from '@/lib/supabase/client';
import {useQuizStore} from '@/stores/quiz-store';
import type {Session, User} from '@supabase/supabase-js';
import {useLocale, useTranslations} from 'next-intl';
import {createContext, type FormEvent, type ReactNode, useContext, useEffect, useMemo, useState} from 'react';

export type AgeBand = '14-15' | '16-17' | '18+' | 'parent' | 'unknown';
export type ConsentStatus = 'self' | 'pending_parent' | 'parent_confirmed' | 'revoked';

type Profile = {
  user_id: string;
  display_name: string | null;
  age_band: AgeBand;
  consent_status: ConsentStatus;
  parent_email_hash: string | null;
};

const PARENT_ERROR_KEYS: Record<string, string> = {
  consent_record_failed: 'parentError',
  consent_request_failed: 'parentError',
  invalid_parent_email: 'parentInvalidEmail',
  invalid_request: 'parentError',
  invalid_session: 'parentInvalidSession',
  missing_session: 'parentMissingSession',
  not_configured: 'notConfigured',
  profile_update_failed: 'profileError'
};

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  isSaved: (careerId: string) => boolean;
  toggleSaveCareer: (careerId: string) => Promise<void>;
  openAuthGate: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const localSavedIds = useQuizStore((state) => state.savedCareerIds);
  const saveLocalCareer = useQuizStore((state) => state.saveCareer);
  const unsaveLocalCareer = useQuizStore((state) => state.unsaveCareer);
  const setLocalSavedCareers = useQuizStore((state) => state.setSavedCareers);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [remoteSavedIds, setRemoteSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'closed' | 'auth' | 'age' | 'parent' | 'parentSent' | 'sent'>('closed');
  const [pendingCareerId, setPendingCareerId] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [sentEmail, setSentEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({data}) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {data: listener} = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setRemoteSavedIds([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session?.user) {
      return;
    }

    void loadProfileAndSaves(session.user);
  }, [session, supabase]);

  useEffect(() => {
    if (!session?.user || !profile || !pendingCareerId) {
      return;
    }

    if (profile.age_band === 'unknown') {
      setModal('age');
      return;
    }

    if (profile.consent_status === 'pending_parent') {
      setPendingCareerId(null);
      setModal(profile.parent_email_hash ? 'parentSent' : 'parent');
      return;
    }

    const careerId = pendingCareerId;
    setPendingCareerId(null);
    void saveCareer(careerId);
  }, [pendingCareerId, profile, session]);

  async function loadProfileAndSaves(user: User) {
    if (!supabase) return;

    const {data: existingProfile} = await supabase
      .from('profiles')
      .select('user_id, display_name, age_band, consent_status, parent_email_hash')
      .eq('user_id', user.id)
      .maybeSingle<Profile>();

    const nextProfile = existingProfile ?? {
      user_id: user.id,
      display_name: user.user_metadata?.name ?? null,
      age_band: 'unknown' as AgeBand,
      consent_status: 'self' as ConsentStatus,
      parent_email_hash: null
    };

    if (!existingProfile) {
      await supabase.from('profiles').insert(nextProfile);
    }

    setProfile(nextProfile);

    const {data: savedRows} = await supabase
      .from('saved_careers')
      .select('career_id')
      .eq('user_id', user.id);

    const remoteIds = (savedRows ?? []).map((row) => row.career_id as string);
    const mergedIds = Array.from(new Set([...localSavedIds, ...remoteIds]));

    if (localSavedIds.length > 0 && nextProfile.consent_status !== 'pending_parent') {
      await supabase.from('saved_careers').upsert(
        localSavedIds.map((careerId) => ({user_id: user.id, career_id: careerId})),
        {onConflict: 'user_id,career_id'}
      );
    }

    setRemoteSavedIds(mergedIds);
    setLocalSavedCareers(mergedIds);

    if (nextProfile.age_band === 'unknown') {
      setModal('age');
    }
  }

  function isSaved(careerId: string) {
    return localSavedIds.includes(careerId) || remoteSavedIds.includes(careerId);
  }

  async function saveCareer(careerId: string) {
    if (!supabase || !session?.user) {
      saveLocalCareer(careerId);
      setPendingCareerId(careerId);
      setModal('auth');
      return;
    }

    if (profile?.consent_status === 'pending_parent') {
      saveLocalCareer(careerId);
      setModal(profile.parent_email_hash ? 'parentSent' : 'parent');
      return;
    }

    saveLocalCareer(careerId);
    setRemoteSavedIds((ids) => Array.from(new Set([...ids, careerId])));
    await supabase.from('saved_careers').upsert(
      {user_id: session.user.id, career_id: careerId},
      {onConflict: 'user_id,career_id'}
    );
  }

  async function unsaveCareer(careerId: string) {
    unsaveLocalCareer(careerId);
    setRemoteSavedIds((ids) => ids.filter((id) => id !== careerId));

    if (!supabase || !session?.user) {
      return;
    }

    await supabase
      .from('saved_careers')
      .delete()
      .eq('user_id', session.user.id)
      .eq('career_id', careerId);
  }

  async function toggleSaveCareer(careerId: string) {
    if (isSaved(careerId)) {
      await unsaveCareer(careerId);
      return;
    }

    await saveCareer(careerId);
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    if (!supabase || !configured) {
      setFormError(t('notConfigured'));
      return;
    }

    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    const {error} = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback`
      }
    });
    setBusy(false);

    if (error) {
      setFormError(t('magicLinkError'));
      return;
    }

    setSentEmail(normalizedEmail);
    setModal('sent');
  }

  async function submitAge(ageBand: AgeBand) {
    if (!supabase || !session?.user) {
      return;
    }

    setBusy(true);
    setFormError('');
    const consentStatus: ConsentStatus = ageBand === '14-15' ? 'pending_parent' : 'self';
    const nextProfile = {
      user_id: session.user.id,
      display_name: session.user.user_metadata?.name ?? null,
      age_band: ageBand,
      consent_status: consentStatus
    };
    const {data, error} = await supabase
      .from('profiles')
      .upsert(nextProfile, {onConflict: 'user_id'})
      .select('user_id, display_name, age_band, consent_status, parent_email_hash')
      .single<Profile>();
    setBusy(false);

    if (error) {
      setFormError(t('profileError'));
      return;
    }

    setProfile(data);
    setModal(ageBand === '14-15' ? 'parent' : 'closed');
  }

  async function submitParentEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    if (!supabase || !session) {
      setModal('auth');
      return;
    }

    setBusy(true);
    const {data} = await supabase.auth.getSession();
    const token = data.session?.access_token;

    const response = await fetch('/api/consent/parent-request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({parentEmail: parentEmail.trim().toLowerCase()})
    });
    const body = (await response.json()) as {error?: string; profile?: Profile};
    setBusy(false);

    if (!response.ok || body.error) {
      const key = body.error ? PARENT_ERROR_KEYS[body.error] : null;
      setFormError(key ? t(key) : t('parentError'));
      return;
    }

    if (body.profile) {
      setProfile(body.profile);
    }
    setParentEmail('');
    setModal('parentSent');
  }

  const value: AuthContextValue = {
    configured,
    loading,
    user: session?.user ?? null,
    profile,
    isSaved,
    toggleSaveCareer,
    openAuthGate: () => setModal(session?.user ? 'age' : 'auth')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modal !== 'closed' && (
        <div className="authGateBackdrop" role="presentation">
          <section className="authGatePanel" role="dialog" aria-modal="true" aria-labelledby="auth-gate-title">
            <button className="authGateClose" onClick={() => setModal('closed')} type="button" aria-label={t('close')}>
              ×
            </button>

            {modal === 'auth' && (
              <>
                <p className="authGateEyebrow">{t('authEyebrow')}</p>
                <h2 id="auth-gate-title">{t('authTitle')}</h2>
                <p>{t('authLead')}</p>
                <form className="authGateForm" onSubmit={submitEmail}>
                  <label>
                    <span>{t('emailLabel')}</span>
                    <input
                      autoComplete="email"
                      inputMode="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t('emailPlaceholder')}
                      required
                      type="email"
                      value={email}
                    />
                  </label>
                  <button className="button buttonPrimary" disabled={busy} type="submit">
                    {busy ? t('sending') : t('sendMagicLink')}
                  </button>
                </form>
              </>
            )}

            {modal === 'sent' && (
              <>
                <p className="authGateEyebrow">{t('sentEyebrow')}</p>
                <h2 id="auth-gate-title">{t('sentTitle')}</h2>
                <p>{t('sentLead', {email: sentEmail})}</p>
              </>
            )}

            {modal === 'age' && (
              <>
                <p className="authGateEyebrow">{t('ageEyebrow')}</p>
                <h2 id="auth-gate-title">{t('ageTitle')}</h2>
                <p>{t('ageLead')}</p>
                <div className="authAgeGrid">
                  {(['14-15', '16-17', '18+', 'parent'] as AgeBand[]).map((ageBand) => (
                    <button
                      className="button buttonSecondary"
                      disabled={busy}
                      key={ageBand}
                      onClick={() => submitAge(ageBand)}
                      type="button"
                    >
                      {t(`age.${ageBand}`)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {modal === 'parent' && (
              <>
                <p className="authGateEyebrow">{t('parentEyebrow')}</p>
                <h2 id="auth-gate-title">{t('parentTitle')}</h2>
                <p>{t('parentLead')}</p>
                <form className="authGateForm" onSubmit={submitParentEmail}>
                  <label>
                    <span>{t('parentEmailLabel')}</span>
                    <input
                      autoComplete="email"
                      inputMode="email"
                      onChange={(event) => setParentEmail(event.target.value)}
                      placeholder={t('parentEmailPlaceholder')}
                      required
                      type="email"
                      value={parentEmail}
                    />
                  </label>
                  <button className="button buttonPrimary" disabled={busy} type="submit">
                    {busy ? t('saving') : t('requestParentConsent')}
                  </button>
                </form>
              </>
            )}

            {modal === 'parentSent' && (
              <>
                <p className="authGateEyebrow">{t('parentSentEyebrow')}</p>
                <h2 id="auth-gate-title">{t('parentSentTitle')}</h2>
                <p>{t('parentSentLead')}</p>
              </>
            )}

            {formError ? <p className="authGateError">{formError}</p> : null}
          </section>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuthGate() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthGate must be used inside AuthProvider');
  }
  return context;
}
