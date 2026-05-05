'use client';

import {getSupabaseBrowserClient, isSupabaseConfigured} from '@/lib/supabase/client';
import {useQuizStore} from '@/stores/quiz-store';
import type {AgeBand, ConsentStatus} from '@/lib/consent';
import type {Session, User} from '@supabase/supabase-js';
import {useLocale, useTranslations} from 'next-intl';
import {createContext, type FormEvent, type ReactNode, useContext, useEffect, useMemo, useState} from 'react';

type Profile = {
  user_id: string;
  display_name: string | null;
  age_band: AgeBand;
  consent_status: ConsentStatus;
  parent_email_hash: string | null;
};

type SavedPath = {
  path_id: string;
  path_name: string | null;
};

const PARENT_ERROR_KEYS: Record<string, string> = {
  consent_record_failed: 'parentError',
  consent_request_failed: 'parentError',
  invalid_parent_email: 'parentInvalidEmail',
  invalid_request: 'parentError',
  invalid_session: 'parentInvalidSession',
  invalid_state: 'parentInvalidState',
  missing_session: 'parentMissingSession',
  not_configured: 'notConfigured',
  profile_read_failed: 'profileError',
  profile_update_failed: 'profileError',
  rate_limited: 'parentRateLimited'
};

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  profile: Profile | null;
  savedPath: SavedPath | null;
  isSaved: (careerId: string) => boolean;
  isPathSaved: (pathId: string) => boolean;
  toggleSaveCareer: (careerId: string) => Promise<void>;
  savePath: (path: SavedPath) => Promise<void>;
  openAuthGate: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const localSavedIds = useQuizStore((state) => state.savedCareerIds);
  const localSavedPath = useQuizStore((state) => state.savedPath);
  const saveLocalCareer = useQuizStore((state) => state.saveCareer);
  const unsaveLocalCareer = useQuizStore((state) => state.unsaveCareer);
  const setLocalSavedCareers = useQuizStore((state) => state.setSavedCareers);
  const setLocalSavedPath = useQuizStore((state) => state.setSavedPath);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [remoteSavedIds, setRemoteSavedIds] = useState<string[]>([]);
  const [remoteSavedPath, setRemoteSavedPath] = useState<SavedPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'closed' | 'auth' | 'age' | 'parent' | 'parentSent' | 'sent'>('closed');
  const [pendingCareerId, setPendingCareerId] = useState<string | null>(null);
  const [pendingPath, setPendingPath] = useState<SavedPath | null>(null);
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
        setRemoteSavedPath(null);
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

  useEffect(() => {
    if (!session?.user || !profile || !pendingPath) {
      return;
    }

    if (profile.age_band === 'unknown') {
      setModal('age');
      return;
    }

    if (profile.consent_status === 'pending_parent') {
      setPendingPath(null);
      setModal(profile.parent_email_hash ? 'parentSent' : 'parent');
      return;
    }

    const path = pendingPath;
    setPendingPath(null);
    void savePath(path);
  }, [pendingPath, profile, session]);

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
    const canPersistRemote =
      nextProfile.age_band !== 'unknown' &&
      (nextProfile.consent_status === 'self' || nextProfile.consent_status === 'parent_confirmed');

    if (localSavedIds.length > 0 && canPersistRemote) {
      const missingLocalIds = localSavedIds.filter((careerId) => !remoteIds.includes(careerId));
      if (missingLocalIds.length > 0) {
        await supabase.from('saved_careers').insert(
          missingLocalIds.map((careerId) => ({user_id: user.id, career_id: careerId}))
        );
      }
    }

    const {data: savedPathRow} = await supabase
      .from('saved_paths')
      .select('path_id, path_name')
      .eq('user_id', user.id)
      .maybeSingle<SavedPath>();

    let mergedPath = savedPathRow ?? localSavedPath;
    if (localSavedPath && canPersistRemote) {
      await supabase.from('saved_paths').upsert(
        {
          user_id: user.id,
          path_id: localSavedPath.path_id,
          path_name: localSavedPath.path_name
        },
        {onConflict: 'user_id'}
      );
      mergedPath = localSavedPath;
    }

    setRemoteSavedIds(mergedIds);
    setLocalSavedCareers(mergedIds);
    setRemoteSavedPath(mergedPath ?? null);
    setLocalSavedPath(mergedPath ?? null);

    if (nextProfile.age_band === 'unknown') {
      setModal('age');
    }
  }

  function isSaved(careerId: string) {
    return localSavedIds.includes(careerId) || remoteSavedIds.includes(careerId);
  }

  function isPathSaved(pathId: string) {
    const savedPath = localSavedPath ?? remoteSavedPath;
    return savedPath?.path_id === pathId;
  }

  async function saveCareer(careerId: string) {
    if (!supabase || !session?.user) {
      saveLocalCareer(careerId);
      setPendingCareerId(careerId);
      setModal('auth');
      return;
    }

    if (!profile || profile.age_band === 'unknown') {
      saveLocalCareer(careerId);
      setPendingCareerId(careerId);
      setModal('age');
      return;
    }

    if (profile?.consent_status === 'pending_parent') {
      saveLocalCareer(careerId);
      setModal(profile.parent_email_hash ? 'parentSent' : 'parent');
      return;
    }

    saveLocalCareer(careerId);
    setRemoteSavedIds((ids) => Array.from(new Set([...ids, careerId])));
    const {error} = await supabase.from('saved_careers').insert({user_id: session.user.id, career_id: careerId});
    if (error?.code === '23505') {
      return;
    }
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

  async function savePath(path: SavedPath) {
    setLocalSavedPath(path);

    if (!supabase || !session?.user) {
      setPendingPath(path);
      setModal('auth');
      return;
    }

    if (!profile || profile.age_band === 'unknown') {
      setPendingPath(path);
      setModal('age');
      return;
    }

    if (profile.consent_status === 'pending_parent') {
      setModal(profile.parent_email_hash ? 'parentSent' : 'parent');
      return;
    }

    setRemoteSavedPath(path);
    await supabase.from('saved_paths').upsert(
      {
        user_id: session.user.id,
        path_id: path.path_id,
        path_name: path.path_name
      },
      {onConflict: 'user_id'}
    );
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
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const {error} = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(currentPath)}`
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
    const {data} = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const response = await fetch('/api/consent/age-band', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ageBand})
    });
    const body = (await response.json()) as {error?: string; profile?: Profile};
    setBusy(false);

    if (!response.ok || body.error || !body.profile) {
      setFormError(t('profileError'));
      return;
    }

    setProfile(body.profile);
    setModal(body.profile.consent_status === 'pending_parent' ? 'parent' : 'closed');
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
    savedPath: localSavedPath ?? remoteSavedPath,
    isSaved,
    isPathSaved,
    toggleSaveCareer,
    savePath,
    openAuthGate: () => setModal(session?.user ? 'age' : 'auth')
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {modal !== 'closed' && (
        <div className="authGateBackdrop" data-rrweb-mask data-umami-ignore role="presentation">
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
                  {(['10-12', '13-15', '16-17', '18+', 'parent'] as AgeBand[]).map((ageBand) => (
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
