// CeSaFiu — main app shell with extended testing + browse
const { useState, useMemo, useEffect } = React;

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "welcomeLayout": "default",
  "quizLayout": "default",
  "resultsLayout": "hero",
  "primaryColor": "#6B38D4",
  "accentColor": "#FFE170",
  "showStatusBar": true
}/*EDITMODE-END*/;

// ── Quiz → career match scoring ────────────────────────────────────────────
// Multi-axis cosine similarity across three signal sources:
//   1. RIASEC (Holland Code) — strongest validated career-matching framework
//   2. Path-type bias (facultate / autodidact / antreprenor / etc.)
//   3. Traits (legacy 7-bucket: build/tech/analyze/social/lead/create/visual)
// Honest 0-100 mapping — no floor, no compression.
// Top-N is diversified via MMR so the user doesn't see four near-clones of #1.

const RIASEC_KEYS = ['R', 'I', 'A', 'S', 'E', 'C'];
const PATH_KEYS = ['facultate', 'autodidact', 'antreprenor', 'profesional', 'freelance', 'creator', 'mixt'];
const TRAIT_KEYS = ['build', 'tech', 'analyze', 'social', 'lead', 'create', 'visual'];

function vecFromTallyKeys(tally, keys) {
  return keys.map((k) => tally[k] || 0);
}
function l2(v) {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}
function cosine(a, b) {
  const na = l2(a), nb = l2(b);
  if (na === 0 || nb === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot / (na * nb);
}

function buildUserProfile(answers) {
  const riasec = {}; const paths = {}; const traits = {};
  Object.values(answers).forEach((opt) => {
    if (!opt) return;
    (opt.riasec || []).forEach((c) => { riasec[c] = (riasec[c] || 0) + 1; });
    if (opt.path) { paths[opt.path] = (paths[opt.path] || 0) + 1; }
    (opt.traits || []).forEach((t) => { traits[t] = (traits[t] || 0) + 1; });
  });
  return { riasec, paths, traits };
}

function buildCareerProfile(career) {
  const riasec = {}; const paths = {}; const traits = {};
  // RIASEC codes are listed primary→tertiary; weight them 3/2/1.
  (career.riasec || []).forEach((c, i) => { riasec[c] = i < 3 ? (3 - i) : 1; });
  if (career.pathType) { paths[career.pathType] = 1; }
  // 'mixt' careers also resonate with facultate + autodidact paths half-weight
  if (career.pathType === 'mixt') { paths.facultate = 0.5; paths.autodidact = 0.5; }
  (career.traits || []).forEach((t) => { traits[t] = 1; });
  return { riasec, paths, traits };
}

function rawScore(userProfile, careerProfile) {
  // Weights: RIASEC dominates (validated framework), path is direction signal, traits are texture.
  const W = { riasec: 0.55, paths: 0.25, traits: 0.20 };
  const sR = cosine(vecFromTallyKeys(userProfile.riasec, RIASEC_KEYS), vecFromTallyKeys(careerProfile.riasec, RIASEC_KEYS));
  const sP = cosine(vecFromTallyKeys(userProfile.paths, PATH_KEYS),   vecFromTallyKeys(careerProfile.paths, PATH_KEYS));
  const sT = cosine(vecFromTallyKeys(userProfile.traits, TRAIT_KEYS), vecFromTallyKeys(careerProfile.traits, TRAIT_KEYS));
  return W.riasec * sR + W.paths * sP + W.traits * sT;
}

function explainMatch(userProfile, career) {
  const top2riasec = Object.entries(userProfile.riasec).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const topPath = Object.entries(userProfile.paths).sort((a, b) => b[1] - a[1])[0];
  const riasecHit = (career.riasec || []).filter((c) => top2riasec.includes(c));
  const pathHit = topPath && career.pathType === topPath[0];
  const bits = [];
  if (riasecHit.length) bits.push(`RIASEC ${riasecHit.join('+')}`);
  if (pathHit) bits.push(`drum ${topPath[0]}`);
  return bits.length ? bits.join(' · ') : 'profil mixt';
}

function computeMatches(answers, careers) {
  const userProfile = buildUserProfile(answers);
  const noAnswers = Object.keys(userProfile.riasec).length === 0
                 && Object.keys(userProfile.paths).length === 0
                 && Object.keys(userProfile.traits).length === 0;

  // 1. Raw scores per career
  const scored = careers.map((c) => {
    const cp = buildCareerProfile(c);
    const raw = rawScore(userProfile, cp);
    return { career: c, careerProfile: cp, raw, why: explainMatch(userProfile, c) };
  });

  if (noAnswers) {
    return scored.map((s) => ({ career: s.career, score: 0, why: '' }));
  }

  // 2. Calibrate to 0-100 honestly: map [0, maxRaw] → [floor, ceil] where ceil ≤ 92
  //    Floor at 25% so a poor match still shows visible bar; cap at 92% so we never
  //    promise certainty from a 6-question quiz (honesty principle from ROADMAP).
  const maxRaw = Math.max(...scored.map((s) => s.raw), 0.001);
  const FLOOR = 25, CEIL = 92;
  scored.forEach((s) => {
    const norm = s.raw / maxRaw;          // 0..1 within this user's career space
    const pct = FLOOR + norm * (CEIL - FLOOR);
    // Slight power curve so weak matches stay visibly weak and strong matches separate
    const curved = FLOOR + Math.pow(norm, 0.85) * (CEIL - FLOOR);
    s.score = Math.round(curved);
  });

  // 3. Sort by raw, then diversify top-N via MMR (Maximum Marginal Relevance)
  //    so the secondary matches aren't 3 clones of the primary.
  const sorted = scored.slice().sort((a, b) => b.raw - a.raw);
  const picked = [sorted[0]];
  const pool = sorted.slice(1);
  const LAMBDA = 0.7; // 0.7 favors relevance, 0.3 favors diversity
  const TOP_N = 6;

  while (picked.length < TOP_N && pool.length) {
    let bestIdx = 0, bestVal = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
      // similarity to already-picked = max cosine on RIASEC vector (the strongest axis)
      const candVec = vecFromTallyKeys(cand.careerProfile.riasec, RIASEC_KEYS);
      let maxSim = 0;
      picked.forEach((p) => {
        const pv = vecFromTallyKeys(p.careerProfile.riasec, RIASEC_KEYS);
        maxSim = Math.max(maxSim, cosine(candVec, pv));
      });
      const mmr = LAMBDA * cand.raw - (1 - LAMBDA) * maxSim;
      if (mmr > bestVal) { bestVal = mmr; bestIdx = i; }
    }
    picked.push(pool.splice(bestIdx, 1)[0]);
  }

  // Sort the diversified top-N by display score descending so the user sees
  // a clean monotonic ranking. (MMR's diversity benefit is in WHICH careers
  // got picked, not in the order they're displayed.)
  picked.sort((a, b) => b.score - a.score);
  // Tail = whatever's left, in raw order, so the full list still works.
  const tail = pool.sort((a, b) => b.raw - a.raw);
  return [...picked, ...tail].map(({ career, score, why }) => ({ career, score, why }));
}

// localStorage layer: persist user picks across reloads. Without these, every
// refresh wiped saved careers, saved unis, chosen path, and chosen career —
// and the „SALVEAZĂ-MI VIBE-UL" button only navigated, it never persisted.
const SAVED_KEY = 'cesafiu_saved_career_ids_v1';
const SAVED_UNI_KEY = 'cesafiu_saved_uni_ids_v1';
const CHOSEN_PATH_KEY = 'cesafiu_chosen_path_id_v1';
const CHOSEN_CAREER_KEY = 'cesafiu_chosen_career_id_v1';
function lsLoadArr(k) {
  try { const r = localStorage.getItem(k); const p = r ? JSON.parse(r) : []; return Array.isArray(p) ? p : []; }
  catch (e) { return []; }
}
function lsLoadStr(k) {
  try { return localStorage.getItem(k) || null; } catch (e) { return null; }
}
function lsSet(k, v) {
  try {
    if (v === null || v === undefined) localStorage.removeItem(k);
    else if (typeof v === 'string') localStorage.setItem(k, v);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch (e) { /* full or unavailable — fail silent */ }
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAKS_DEFAULTS);
  const [route, setRoute] = useState({ name: 'welcome' });
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  // Hydrate persisted picks so „Vibe-uri" survives reloads.
  const [savedIds, setSavedIds] = useState(() => lsLoadArr(SAVED_KEY));
  const [savedUniIds, setSavedUniIds] = useState(() => lsLoadArr(SAVED_UNI_KEY));
  const [chosenPathId, setChosenPathId] = useState(() => lsLoadStr(CHOSEN_PATH_KEY));
  const [chosenCareerId, setChosenCareerId] = useState(() => lsLoadStr(CHOSEN_CAREER_KEY));
  const [selectedThisQ, setSelectedThisQ] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [browseSection, setBrowseSection] = useState('careers');
  const [deepScores, setDeepScores] = useState({ personality: null, vocational: null, ipipNeo60: null });

  const data = window.QUIZ_DATA;
  const matches = useMemo(() => computeMatches(answers, data.careers), [answers, data.careers]);

  // Persist every user-pick state slice whenever it changes.
  useEffect(() => { lsSet(SAVED_KEY, savedIds); }, [savedIds]);
  useEffect(() => { lsSet(SAVED_UNI_KEY, savedUniIds); }, [savedUniIds]);
  useEffect(() => { lsSet(CHOSEN_PATH_KEY, chosenPathId); }, [chosenPathId]);
  useEffect(() => { lsSet(CHOSEN_CAREER_KEY, chosenCareerId); }, [chosenCareerId]);

  useEffect(() => {
    document.documentElement.style.setProperty('--purple', tweaks.primaryColor);
    document.documentElement.style.setProperty('--yellow', tweaks.accentColor);
  }, [tweaks.primaryColor, tweaks.accentColor]);

  const goto = (name, params) => setRoute({ name, ...params });

  const handleStart = () => {
    setQIndex(0); setAnswers({}); setSelectedThisQ(null);
    goto('quiz');
  };

  const handlePickTest = (kind) => {
    if (kind === 'personality') goto('personality');
    else if (kind === 'ipip-neo') goto('ipip-neo');
    else if (kind === 'vocational') goto('vocational');
  };

  const currentQuestion = data.questions[qIndex];
  const handleSelect = (optId) => setSelectedThisQ(optId);

  const handleNext = () => {
    if (!selectedThisQ) return;
    const opt = currentQuestion.options.find((o) => o.id === selectedThisQ);
    const newAnswers = { ...answers, [currentQuestion.id]: opt };
    setAnswers(newAnswers);
    if (qIndex === data.questions.length - 1) {
      setTransitioning(true);
      setTimeout(() => { goto('results'); setTransitioning(false); }, 600);
    } else {
      setQIndex(qIndex + 1); setSelectedThisQ(null);
    }
  };

  const handleBack = () => {
    if (route.name === 'quiz') {
      if (qIndex === 0) return goto('welcome');
      const prevQ = data.questions[qIndex - 1];
      setQIndex(qIndex - 1);
      setSelectedThisQ(answers[prevQ.id]?.id || null);
    } else {
      goto('welcome');
    }
  };

  const handlePickCareer = (id) => goto('career', { careerId: id });
  const handleSaveCareer = (id) => {
    setSavedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const handleSaveUni = (id) => {
    setSavedUniIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const handleChoosePath = (id) => {
    setChosenPathId((prev) => prev === id ? null : id);
  };
  const handleChooseCareer = (id) => {
    setChosenCareerId((prev) => prev === id ? null : id);
    // Auto-save when choosing as primary
    if (chosenCareerId !== id && !savedIds.includes(id)) {
      setSavedIds((prev) => [...prev, id]);
    }
  };

  const tabBarVisible = ['results', 'career', 'profile', 'browse', 'pathDetail', 'uniDetail', 'deepResults'].includes(route.name);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, background: 'var(--paper-2)' }}>
      <div className="bg-noise" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}></div>

      <div className="phone bg-noise paper-tex" style={{ zIndex: 1 }}>
        {tweaks.showStatusBar && (
          <div className="status-bar">
            <span>9:41</span>
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 110, height: 30, background: '#000', borderRadius: 99 }}></div>
            <div className="status-icons">
              <span style={{ fontSize: 13 }}>●●●●</span>
              <span style={{ fontSize: 13 }}>📶</span>
              <span style={{ width: 26, height: 12, border: '1.5px solid #000', borderRadius: 3, position: 'relative', display: 'inline-block' }}>
                <span style={{ position: 'absolute', inset: 1.5, width: '70%', background: '#000' }}></span>
              </span>
            </div>
          </div>
        )}

        {(route.name === 'welcome' || tabBarVisible) && (
          <div className="nav-bar" style={{ paddingTop: tweaks.showStatusBar ? 4 : 16 }}>
            <div className="brand">
              <span style={{ background: 'var(--purple)', color: '#fff', padding: '2px 8px', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }}>Ce</span>
              <span style={{ marginLeft: 6 }}>să fiu?</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-icon" style={{ background: 'var(--yellow)', width: 36, height: 36, fontSize: 14 }}>?</button>
            </div>
          </div>
        )}

        <div className="phone-stack" style={{ top: tweaks.showStatusBar ? 92 : 60, bottom: tabBarVisible ? 70 : 0 }}>
          {route.name === 'welcome' && (
            <WelcomeScreen onStart={handleStart} onPickTest={handlePickTest} layout={tweaks.welcomeLayout} />
          )}
          {route.name === 'quiz' && !transitioning && (
            <QuizScreen
              question={currentQuestion} qIndex={qIndex} total={data.questions.length}
              selected={selectedThisQ} onSelect={handleSelect} onNext={handleNext} onBack={handleBack}
              layout={tweaks.quizLayout}
            />
          )}
          {route.name === 'quiz' && transitioning && <Computing />}
          {route.name === 'personality' && (
            <PersonalityScreen
              dataKey="personality"
              onBack={() => goto('welcome')}
              onComplete={(scores) => { setDeepScores((p) => ({ ...p, personality: scores })); goto('deepResults', { kind: 'personality' }); }}
            />
          )}
          {route.name === 'ipip-neo' && (
            <PersonalityScreen
              dataKey="ipipNeo60"
              onBack={() => goto('welcome')}
              onComplete={(scores) => { setDeepScores((p) => ({ ...p, ipipNeo60: scores })); goto('deepResults', { kind: 'ipipNeo60' }); }}
            />
          )}
          {route.name === 'vocational' && (
            <VocationalScreen
              onBack={() => goto('welcome')}
              onComplete={(scores) => { setDeepScores((p) => ({ ...p, vocational: scores })); goto('deepResults', { kind: 'vocational' }); }}
            />
          )}
          {route.name === 'deepResults' && (
            <DeepResultsScreen
              kind={route.kind}
              scores={deepScores[route.kind]}
              onBrowse={() => { setBrowseSection('careers'); goto('browse'); }}
              onRetake={() => goto(route.kind === 'ipipNeo60' ? 'ipip-neo' : route.kind)}
              onProfile={() => goto('profile')}
              onIpipNeo={() => goto('ipip-neo')}
            />
          )}
          {route.name === 'results' && (
            <ResultsScreen
              matches={matches}
              onPickCareer={handlePickCareer}
              onRetake={handleStart}
              onProfile={() => goto('profile')}
              onSaveCareer={handleSaveCareer}
              savedIds={savedIds}
              layout={tweaks.resultsLayout}
            />
          )}
          {route.name === 'career' && (
            <CareerDetailScreen
              career={data.careers.find((c) => c.id === route.careerId)}
              onBack={() => goto(matches.length ? 'results' : 'browse')}
              onSave={() => handleSaveCareer(route.careerId)}
              isSaved={savedIds.includes(route.careerId)}
              onChoose={() => handleChooseCareer(route.careerId)}
              isChosen={chosenCareerId === route.careerId}
            />
          )}
          {route.name === 'browse' && (
            <BrowseScreen
              section={browseSection}
              onChangeSection={setBrowseSection}
              onPickCareer={handlePickCareer}
              onPickPath={(id) => goto('pathDetail', { pathId: id })}
              onPickUni={(id) => goto('uniDetail', { uniId: id })}
            />
          )}
          {route.name === 'pathDetail' && (
            <PathDetailScreen
              pathId={route.pathId}
              onBack={() => goto('browse')}
              onChoose={() => handleChoosePath(route.pathId)}
              isChosen={chosenPathId === route.pathId}
            />
          )}
          {route.name === 'uniDetail' && (
            <UniDetailScreen
              uniId={route.uniId}
              onBack={() => goto('browse')}
              onSave={() => handleSaveUni(route.uniId)}
              isSaved={savedUniIds.includes(route.uniId)}
            />
          )}
          {route.name === 'profile' && (
            <ProfileScreen
              savedCareerIds={savedIds}
              savedUniIds={savedUniIds}
              chosenPathId={chosenPathId}
              chosenCareerId={chosenCareerId}
              careers={data.careers}
              paths={data.paths || []}
              matches={matches}
              deepScores={deepScores}
              programs={data.programs || []}
              universities={data.universities || []}
              hasAnswers={Object.keys(answers).length > 0}
              onPickCareer={handlePickCareer}
              onPickPath={(id) => goto('pathDetail', { pathId: id })}
              onPickUni={(id) => goto('uniDetail', { uniId: id })}
              onRemoveSavedCareer={handleSaveCareer}
              onRemoveSavedUni={handleSaveUni}
              onClearChosenPath={() => setChosenPathId(null)}
              onClearChosenCareer={() => setChosenCareerId(null)}
              onRetake={handleStart}
              onPickTest={handlePickTest}
              onBrowseUnis={() => { setBrowseSection('universities'); goto('browse'); }}
              onBrowsePaths={() => { setBrowseSection('paths'); goto('browse'); }}
              onBrowseCareers={() => { setBrowseSection('careers'); goto('browse'); }}
            />
          )}
        </div>

        {tabBarVisible && (
          <div className="tabbar">
            <button className="tab" onClick={() => goto('welcome')}>
              <span style={{ fontSize: 16 }}>✦</span><span>Teste</span>
            </button>
            <button className="tab" onClick={() => { setBrowseSection('careers'); goto('browse'); }} aria-current={['browse', 'pathDetail', 'uniDetail'].includes(route.name)}>
              <span style={{ fontSize: 16 }}>⌕</span><span>Explorează</span>
            </button>
            <button className="tab" onClick={() => goto(matches.length ? 'results' : 'welcome')} aria-current={route.name === 'results' || route.name === 'deepResults'}>
              <span style={{ fontSize: 16 }}>★</span><span>Rezultat</span>
            </button>
            <button className="tab" onClick={() => goto('profile')} aria-current={route.name === 'profile'}>
              <span style={{ fontSize: 16 }}>♥</span><span>Vibe-uri</span>
            </button>
          </div>
        )}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Layouts">
          <TweakRadio label="Welcome" value={tweaks.welcomeLayout} onChange={(v) => setTweak('welcomeLayout', v)}
            options={['default', 'magazine', 'minimal']} />
          <TweakRadio label="Quiz" value={tweaks.quizLayout} onChange={(v) => setTweak('quizLayout', v)}
            options={['default', 'cards', 'split']} />
          <TweakRadio label="Results" value={tweaks.resultsLayout} onChange={(v) => setTweak('resultsLayout', v)}
            options={['hero', 'list']} />
        </TweakSection>
        <TweakSection label="Color">
          <TweakColor label="Primary" value={tweaks.primaryColor} onChange={(v) => setTweak('primaryColor', v)} />
          <TweakColor label="Accent" value={tweaks.accentColor} onChange={(v) => setTweak('accentColor', v)} />
        </TweakSection>
        <TweakSection label="Frame">
          <TweakToggle label="Status bar" value={tweaks.showStatusBar} onChange={(v) => setTweak('showStatusBar', v)} />
        </TweakSection>
        <TweakSection label="Quick jump">
          <TweakButton label="→ Welcome" onClick={() => goto('welcome')} />
          <TweakButton label="→ Quiz rapid" onClick={() => { setQIndex(0); setSelectedThisQ(null); goto('quiz'); }} />
          <TweakButton label="→ Personality test (15 short)" onClick={() => goto('personality')} />
          <TweakButton label="→ IPIP-NEO-60 (validated)" onClick={() => goto('ipip-neo')} />
          <TweakButton label="→ Vocational test" onClick={() => goto('vocational')} />
          <TweakButton label="→ Browse cariere" onClick={() => { setBrowseSection('careers'); goto('browse'); }} />
          <TweakButton label="→ Browse trasee" onClick={() => { setBrowseSection('paths'); goto('browse'); }} />
          <TweakButton label="→ Browse universități" onClick={() => { setBrowseSection('unis'); goto('browse'); }} />
          <TweakButton label="→ Quiz results" onClick={() => { if (Object.keys(answers).length === 0) { setAnswers({ q1: data.questions[0].options[0], q2: data.questions[1].options[0] }); } goto('results'); }} />
          <TweakButton label="→ Profile" onClick={() => goto('profile')} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

function Computing() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="anim-wiggle" style={{ width: 140, height: 140, background: 'var(--purple)', border: '2px solid #000', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--yellow)', fontSize: 60, boxShadow: '6px 6px 0 #000' }}>✦</div>
      <div className="h-lg" style={{ marginTop: 24, textAlign: 'center' }}>Pregătesc<br/>vibe-ul tău...</div>
      <div className="body-md" style={{ color: 'var(--ink-soft)', marginTop: 8 }}>Calculez. Fără bullshit.</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
