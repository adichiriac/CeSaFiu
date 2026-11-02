'use client';

import {getSupabaseBrowserClient, isSupabaseConfigured} from '@/lib/supabase/client';
import {
  clearLocalTestResults,
  isTestSlug,
  readStoredResults,
  TEST_SAVED_EVENT,
  TEST_SLUGS,
  useQuizStore,
  writeStoredResult,
  type StoredTestResult
} from '@/stores/quiz-store';
import {useUniStore} from '@/stores/uni-store';
import {canClearLocalAccountData, canPersistAccountData} from '@/lib/account-sync';
import type {AgeBand, ConsentStatus} from '@/lib/consent';
import type {Session, User} from '@supabase/supabase-js';
import {useLocale, useTranslations} from 'next-intl';
import {createContext, type FormEvent, type ReactNode, useContext, useEffect, useMemo, useRef, useState} from 'react';

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

/**
 * Where the student's data lives right now — drives the header account chip
 * and the profile identity card.
 *   local            — not signed in; everything stays on this device
 *   needs_age        — signed in, age band not chosen yet (nothing synced)
 *   pending_consent  — under-16, waiting for parent consent (nothing synced)
 *   synced           — results + saves are mirrored to the account
 */
export type SyncState = 'local' | 'needs_age' | 'pending_consent' | 'needs_sync' | 'synced';

type AuthIntent = 'account' | 'save';

type TestResultRow = {
  slug: string;
  payload: StoredTestResult | null;
  completed_at: string;
};

function resultTime(value: string | undefined | null) {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : 0;
}

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  email: string | null;
  profile: Profile | null;
  syncState: SyncState;
  /** Bumps whenever test results were pulled from the account into localStorage. */
  resultsVersion: number;
  signOut: () => Promise<void>;
  /** Opens the account flow (sign-in, or the next pending step if signed in). */
  openAccount: () => void;
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
  const [authIntent, setAuthIntent] = useState<AuthIntent>('save');
  const [resultsVersion, setResultsVersion] = useState(0);
  const [accountDataSynced, setAccountDataSynced] = useState(false);
  const uniSyncPaused = useRef(false);
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
        setAccountDataSynced(false);
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

  const syncUserId = session?.user?.id ?? null;
  const syncEnabled = canPersistAccountData(profile);

  // Live push: a test finished while signed in → upsert that one result.
  useEffect(() => {
    if (!supabase || !syncUserId || !syncEnabled) return;

    function handleTestSaved(event: Event) {
      const slug = (event as CustomEvent<{slug?: string}>).detail?.slug;
      if (!supabase || !syncUserId || !slug || !isTestSlug(slug)) return;
      const result = readStoredResults()[slug];
      if (!result) return;
      setAccountDataSynced(false);
      void flushLocalAccountData(syncUserId).then(setAccountDataSynced);
    }

    window.addEventListener(TEST_SAVED_EVENT, handleTestSaved);
    return () => window.removeEventListener(TEST_SAVED_EVENT, handleTestSaved);
  }, [supabase, syncUserId, syncEnabled]);

  // Live push: mirror saved-university toggles from any surface.
  useEffect(() => {
    if (!supabase || !syncUserId || !syncEnabled) return;

    return useUniStore.subscribe((state, previous) => {
      if (uniSyncPaused.current) return;
      const added = state.savedUniIds.filter((id) => !previous.savedUniIds.includes(id));
      const removed = previous.savedUniIds.filter((id) => !state.savedUniIds.includes(id));

      if (added.length > 0) {
        setAccountDataSynced(false);
        void supabase
          .from('saved_universities')
          .upsert(
            added.map((institutionId) => ({user_id: syncUserId, institution_id: institutionId})),
            {onConflict: 'user_id,institution_id', ignoreDuplicates: true}
          )
          .then(({error}) => (error ? false : flushLocalAccountData(syncUserId)))
          .then(setAccountDataSynced);
      }
      if (removed.length > 0) {
        setAccountDataSynced(false);
        void supabase
          .from('saved_universities')
          .delete()
          .eq('user_id', syncUserId)
          .in('institution_id', removed)
          .then(({error}) => (error ? false : flushLocalAccountData(syncUserId)))
          .then(setAccountDataSynced);
      }
    });
  }, [supabase, syncUserId, syncEnabled]);

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

    setAccountDataSynced(false);

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

    const accountMergeSucceeded = await syncAccountData(user.id, canPersistRemote);
    const accountFlushSucceeded = canPersistRemote ? await flushLocalAccountData(user.id) : false;
    setAccountDataSynced(accountMergeSucceeded && accountFlushSucceeded);

    if (nextProfile.age_band === 'unknown') {
      setModal('age');
    }
  }

  /**
   * Two-way merge of test results + saved universities.
   * Tests: newest `completedAt` wins per instrument. Universities: union.
   * Pulls always happen (the student may own data from an earlier device);
   * pushes only when the consent gate allows it (RLS enforces the same rule).
   */
  async function syncAccountData(userId: string, persist: boolean) {
    if (!supabase) return false;

    let succeeded = true;

    const {data: resultRows, error: resultsError} = await supabase
      .from('test_results')
      .select('slug, payload, completed_at')
      .eq('user_id', userId);

    if (resultsError) {
      succeeded = false;
    } else {
      const local = readStoredResults();
      const remoteBySlug = new Map(((resultRows ?? []) as TestResultRow[]).map((row) => [row.slug, row]));
      const toPush: {user_id: string; slug: string; payload: StoredTestResult; completed_at: string}[] = [];
      let pulled = false;

      for (const slug of TEST_SLUGS) {
        const localResult = local[slug];
        const remote = remoteBySlug.get(slug);
        const localTime = localResult ? resultTime(localResult.completedAt) : -1;
        const remoteTime = remote?.payload ? resultTime(remote.completed_at) : -1;

        if (remote?.payload && remoteTime > localTime) {
          writeStoredResult(slug, remote.payload);
          pulled = true;
        } else if (localResult && localTime > remoteTime && persist) {
          toPush.push({user_id: userId, slug, payload: localResult, completed_at: localResult.completedAt});
        }
      }

      if (toPush.length > 0) {
        const {error} = await supabase.from('test_results').upsert(toPush, {onConflict: 'user_id,slug'});
        if (error) succeeded = false;
      }
      if (pulled) {
        setResultsVersion((version) => version + 1);
      }
    }

    const {data: uniRows, error: unisError} = await supabase
      .from('saved_universities')
      .select('institution_id')
      .eq('user_id', userId);

    if (unisError) {
      succeeded = false;
    } else {
      const remoteUniIds = (uniRows ?? []).map((row) => row.institution_id as string);
      const localUniIds = useUniStore.getState().savedUniIds;
      const missingRemote = localUniIds.filter((id) => !remoteUniIds.includes(id));

      if (persist && missingRemote.length > 0) {
        const {error} = await supabase.from('saved_universities').upsert(
          missingRemote.map((institutionId) => ({user_id: userId, institution_id: institutionId})),
          {onConflict: 'user_id,institution_id', ignoreDuplicates: true}
        );
        if (error) succeeded = false;
      }

      uniSyncPaused.current = true;
      useUniStore.setState({savedUniIds: Array.from(new Set([...localUniIds, ...remoteUniIds]))});
      uniSyncPaused.current = false;
    }

    return succeeded;
  }

  async function flushLocalAccountData(userId: string) {
    if (!supabase || !userId) return false;

    const resultRows = Object.entries(readStoredResults()).flatMap(([slug, payload]) =>
      payload && isTestSlug(slug)
        ? [{user_id: userId, slug, payload, completed_at: payload.completedAt}]
        : []
    );
    if (resultRows.length > 0) {
      const {error} = await supabase.from('test_results').upsert(resultRows, {onConflict: 'user_id,slug'});
      if (error) return false;
    }

    const universityRows = useUniStore.getState().savedUniIds.map((institutionId) => ({
      user_id: userId,
      institution_id: institutionId
    }));
    if (universityRows.length > 0) {
      const {error} = await supabase
        .from('saved_universities')
        .upsert(universityRows, {onConflict: 'user_id,institution_id', ignoreDuplicates: true});
      if (error) return false;
    }

    if (localSavedIds.length > 0) {
      const {error} = await supabase.from('saved_careers').upsert(
        localSavedIds.map((careerId) => ({user_id: userId, career_id: careerId})),
        {onConflict: 'user_id,career_id', ignoreDuplicates: true}
      );
      if (error) return false;
    }

    if (localSavedPath) {
      const {error} = await supabase.from('saved_paths').upsert(
        {user_id: userId, path_id: localSavedPath.path_id, path_name: localSavedPath.path_name},
        {onConflict: 'user_id'}
      );
      if (error) return false;
    }

    return true;
  }

  async function signOut() {
    if (!supabase) return;

    // On a shared/school computer the next student should not see this
    // student's results. Only wipe the device when the data is safe in the
    // account; otherwise (pending consent) local is the only copy.
    const userId = session?.user.id ?? '';
    const finalMergeConfirmed = canPersistAccountData(profile)
      ? await syncAccountData(userId, true)
      : false;
    const finalSyncConfirmed = finalMergeConfirmed
      ? await flushLocalAccountData(userId)
      : false;
    setAccountDataSynced(finalSyncConfirmed);

    if (canClearLocalAccountData(profile, finalSyncConfirmed)) {
      uniSyncPaused.current = true;
      clearLocalTestResults();
      setLocalSavedCareers([]);
      setLocalSavedPath(null);
      useUniStore.setState({savedUniIds: []});
      setResultsVersion((version) => version + 1);
    }

    await supabase.auth.signOut();
    uniSyncPaused.current = false;
    setModal('closed');
  }

  function openAuth(intent: AuthIntent) {
    setAuthIntent(intent);
    setFormError('');
    setModal('auth');
  }

  function openAccount() {
    if (!session?.user) {
      openAuth('account');
      return;
    }
    if (!profile || profile.age_band === 'unknown') {
      setModal('age');
      return;
    }
    if (profile.consent_status === 'pending_parent') {
      setModal(profile.parent_email_hash ? 'parentSent' : 'parent');
      return;
    }
    if (canPersistAccountData(profile)) {
      setAccountDataSynced(false);
      void syncAccountData(session.user.id, true)
        .then(async (merged) => merged && await flushLocalAccountData(session.user.id))
        .then(setAccountDataSynced);
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
      openAuth('save');
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
    setAccountDataSynced(false);
    const {error} = await supabase.from('saved_careers').insert({user_id: session.user.id, career_id: careerId});
    if (error?.code === '23505') {
      setAccountDataSynced(await flushLocalAccountData(session.user.id));
      return;
    }
    setAccountDataSynced(error ? false : await flushLocalAccountData(session.user.id));
  }

  async function unsaveCareer(careerId: string) {
    unsaveLocalCareer(careerId);
    setRemoteSavedIds((ids) => ids.filter((id) => id !== careerId));

    if (!supabase || !session?.user) {
      return;
    }

    setAccountDataSynced(false);
    const {error} = await supabase
      .from('saved_careers')
      .delete()
      .eq('user_id', session.user.id)
      .eq('career_id', careerId);
    setAccountDataSynced(error ? false : await flushLocalAccountData(session.user.id));
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
      openAuth('save');
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
    setAccountDataSynced(false);
    const {error} = await supabase.from('saved_paths').upsert(
      {
        user_id: session.user.id,
        path_id: path.path_id,
        path_name: path.path_name
      },
      {onConflict: 'user_id'}
    );
    setAccountDataSynced(error ? false : await flushLocalAccountData(session.user.id));
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
    if (canPersistAccountData(body.profile)) {
      setAccountDataSynced(false);
      void syncAccountData(session.user.id, true)
        .then(async (merged) => merged && await flushLocalAccountData(session.user.id))
        .then(setAccountDataSynced);
    }
  }

  async function submitParentEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    if (!supabase || !session) {
      openAuth('save');
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

  const user = session?.user ?? null;
  const syncState: SyncState = !user
    ? 'local'
    : !profile || profile.age_band === 'unknown'
      ? 'needs_age'
      : profile.consent_status === 'pending_parent'
        ? 'pending_consent'
        : canPersistAccountData(profile)
          ? accountDataSynced
            ? 'synced'
            : 'needs_sync'
          : 'local';

  const value: AuthContextValue = {
    configured,
    loading,
    user,
    email: user?.email ?? null,
    profile,
    syncState,
    resultsVersion,
    signOut,
    openAccount,
    savedPath: localSavedPath ?? remoteSavedPath,
    isSaved,
    isPathSaved,
    toggleSaveCareer,
    savePath,
    openAuthGate: () => (session?.user ? setModal('age') : openAuth('save'))
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
                <h2 id="auth-gate-title">{authIntent === 'account' ? t('accountTitle') : t('authTitle')}</h2>
                <p>{authIntent === 'account' ? t('accountLead') : t('authLead')}</p>
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
