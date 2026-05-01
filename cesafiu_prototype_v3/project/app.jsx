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

// Big Five axis added in Phase A (2026-04-30). Career anchors stored as
// shorthand letter array (e.g., big5: ['O','C']); user big5 stored as
// percentages {O:75, C:60, ...} from personality / IPIP-NEO-60 tests.
const BIG5_KEYS = ['O', 'C', 'E', 'A', 'N'];

// Vocational (Holland) test weight relative to a single quick-quiz answer.
// New format (2026-04-30): 18-item Likert Quick-Sort. 3 items per RIASEC code,
// each rated 1-5. Per-code raw is the SUM (range 3..15). Center on 9 (neutral)
// and scale the above-neutral part — same shape as the deep test, just thinner.
const VOCATIONAL_LIGHT_CENTER = 9;       // neutral sum: 3 items × neutral 3
const VOCATIONAL_LIGHT_SCALE = 1.5;      // multiplier on above-neutral; tuned to match deep magnitude

function buildUserProfile(answers, deepScores) {
  const riasec = {}; const paths = {}; const traits = {}; const big5 = {};
  // 1. Quick-quiz answers (each option carries riasec / path / traits).
  Object.values(answers || {}).forEach((opt) => {
    if (!opt) return;
    (opt.riasec || []).forEach((c) => { riasec[c] = (riasec[c] || 0) + 1; });
    if (opt.path) { paths[opt.path] = (paths[opt.path] || 0) + 1; }
    (opt.traits || []).forEach((t) => { traits[t] = (traits[t] || 0) + 1; });
  });

  // 2. Vocational (Holland) test → fold raw RIASEC into the same tally.
  //    DEEP overrides LIGHT (60-item O*NET wins over 12-item forced-choice),
  //    same pattern as ipip-neo-60 over personality-15. Deep raw is mean
  //    Likert per code (1-5), light raw is count of choices per code (0-12).
  //    Both normalized to roughly comparable scales before adding weight.
  const vocDeep = deepScores && deepScores.vocationalDeep;
  const vocLight = deepScores && deepScores.vocational;
  if (vocDeep && vocDeep.raw) {
    // Deep: each code's raw is mean Likert (1-5). Center on 3 (neutral)
    // and scale to give heavy weight: (mean - 3) * 6 → range -12..+12.
    // Floor at 0 so neutral/dislike doesn't penalize, only like contributes.
    Object.entries(vocDeep.raw).forEach(([code, val]) => {
      const contribution = Math.max(0, (val - 3) * 6);
      riasec[code] = (riasec[code] || 0) + contribution;
    });
  } else if (vocLight && vocLight.raw) {
    // Light test (18-item Quick-Sort Likert): each code's raw is the SUM of
    // 3 Likert ratings (3..15). Center on 9 (3 items × neutral 3) and scale
    // the above-neutral part: max(0, (val - 9) × 1.5) → range 0..9 per code.
    // This keeps the contribution magnitude similar to the deep test (0..12)
    // and prevents the light test from dominating the quick quiz tally.
    Object.entries(vocLight.raw).forEach(([code, val]) => {
      const contribution = Math.max(0, (val - VOCATIONAL_LIGHT_CENTER) * VOCATIONAL_LIGHT_SCALE);
      riasec[code] = (riasec[code] || 0) + contribution;
    });
  }

  // 3. Big Five → store as percentages (0-100). IPIP-NEO-60 wins over short
  //    test if both taken (more validated). Previously collected but unused.
  const big5Source = deepScores && (deepScores.ipipNeo60 || deepScores.personality);
  if (big5Source) {
    BIG5_KEYS.forEach((k) => {
      if (typeof big5Source[k] === 'number') big5[k] = big5Source[k];
    });
  }

  // 4. Track which sources contributed — drives confidence + adaptive weights.
  //    Deep Holland counts as a higher-tier source than light.
  const sources = [];
  if (Object.keys(answers || {}).length > 0) sources.push('quick');
  if (vocDeep && vocDeep.raw) sources.push('vocational-deep');
  else if (vocLight && vocLight.raw) sources.push('vocational');
  if (deepScores && deepScores.ipipNeo60) sources.push('ipip-neo-60');
  else if (deepScores && deepScores.personality) sources.push('personality-15');

  return { riasec, paths, traits, big5, sources };
}

function buildCareerProfile(career) {
  const riasec = {}; const paths = {}; const traits = {}; const big5 = {};
  // RIASEC codes listed primary→tertiary; weight 3/2/1.
  (career.riasec || []).forEach((c, i) => { riasec[c] = i < 3 ? (3 - i) : 1; });
  if (career.pathType) { paths[career.pathType] = 1; }
  // 'mixt' careers also resonate with facultate + autodidact half-weight.
  if (career.pathType === 'mixt') { paths.facultate = 0.5; paths.autodidact = 0.5; }
  (career.traits || []).forEach((t) => { traits[t] = 1; });
  // Big Five anchors: each declared letter = full weight (1.0). Filter
  // unknown chars (one career has 'I' = legacy data typo). Anchors mean
  // "high preferred" — non-anchors are neutral, not penalized.
  (career.big5 || []).forEach((k) => { if (BIG5_KEYS.includes(k)) big5[k] = 1; });
  return { riasec, paths, traits, big5 };
}

// Sample-size-aware weights. When the user has more test sources, RIASEC's
// share comes down (because the data is denser everywhere) and Big Five
// joins the calculation. With only the quick quiz, RIASEC carries everything
// because it's the only axis with enough signal.
function getWeights(userProfile) {
  const sources = userProfile.sources || [];
  const hasBig5 = Object.keys(userProfile.big5 || {}).length > 0;
  const hasVocDeep = sources.includes('vocational-deep');
  const hasVocLight = sources.includes('vocational') || hasVocDeep;
  // Deep Holland gets even higher RIASEC trust than light (more items, validated).
  if (hasBig5 && hasVocDeep)  return { riasec: 0.50, paths: 0.10, traits: 0.10, big5: 0.30 };
  if (hasBig5 && hasVocLight) return { riasec: 0.45, paths: 0.15, traits: 0.10, big5: 0.30 };
  if (hasBig5)                return { riasec: 0.45, paths: 0.20, traits: 0.10, big5: 0.25 };
  if (hasVocDeep)             return { riasec: 0.70, paths: 0.15, traits: 0.15, big5: 0.00 };
  if (hasVocLight)            return { riasec: 0.65, paths: 0.20, traits: 0.15, big5: 0.00 };
  return { riasec: 0.60, paths: 0.25, traits: 0.15, big5: 0.00 };
}

function big5Cosine(userBig5, careerBig5) {
  // Convert user percentages 0-100 → 0-1 normalized.
  // Subtract 0.5 (centered) so "high O" matches "career needs high O" better
  // than "average O" matches it. Without centering, average users would
  // appear to match every career's anchor pattern roughly equally.
  const userVec = BIG5_KEYS.map((k) => {
    const v = userBig5[k];
    if (typeof v !== 'number') return 0;
    return Math.max(0, (v / 100) - 0.5);  // only the "above average" part counts
  });
  const careerVec = BIG5_KEYS.map((k) => careerBig5[k] || 0);
  return cosine(userVec, careerVec);
}

function rawScore(userProfile, careerProfile, weights) {
  const sR = cosine(vecFromTallyKeys(userProfile.riasec, RIASEC_KEYS), vecFromTallyKeys(careerProfile.riasec, RIASEC_KEYS));
  const sP = cosine(vecFromTallyKeys(userProfile.paths, PATH_KEYS),   vecFromTallyKeys(careerProfile.paths, PATH_KEYS));
  const sT = cosine(vecFromTallyKeys(userProfile.traits, TRAIT_KEYS), vecFromTallyKeys(careerProfile.traits, TRAIT_KEYS));
  let sB = 0;
  if (weights.big5 > 0 && Object.keys(careerProfile.big5 || {}).length > 0) {
    sB = big5Cosine(userProfile.big5, careerProfile.big5);
  }
  return weights.riasec * sR + weights.paths * sP + weights.traits * sT + weights.big5 * sB;
}

function explainMatch(userProfile, career, careerProfile, weights) {
  const top2riasec = Object.entries(userProfile.riasec || {}).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const topPath = Object.entries(userProfile.paths || {}).sort((a, b) => b[1] - a[1])[0];
  const riasecHit = (career.riasec || []).filter((c) => top2riasec.includes(c));
  const pathHit = topPath && career.pathType === topPath[0];
  // Per-axis sub-scores so the UI can show "RIASEC strong / paths weak / Big Five solid".
  const sR = cosine(vecFromTallyKeys(userProfile.riasec, RIASEC_KEYS), vecFromTallyKeys(careerProfile.riasec, RIASEC_KEYS));
  const sP = cosine(vecFromTallyKeys(userProfile.paths, PATH_KEYS),   vecFromTallyKeys(careerProfile.paths, PATH_KEYS));
  const sT = cosine(vecFromTallyKeys(userProfile.traits, TRAIT_KEYS), vecFromTallyKeys(careerProfile.traits, TRAIT_KEYS));
  const sB = (weights.big5 > 0 && Object.keys(careerProfile.big5 || {}).length > 0)
    ? big5Cosine(userProfile.big5, careerProfile.big5) : null;
  // Short text version for results screen tagline.
  const bits = [];
  if (riasecHit.length) bits.push(`RIASEC ${riasecHit.join('+')}`);
  if (pathHit) bits.push(`drum ${topPath[0]}`);
  if (sB !== null && sB > 0.4) bits.push(`Big Five aliniate`);
  return {
    text: bits.length ? bits.join(' · ') : 'profil mixt',
    axes: { riasec: sR, paths: sP, traits: sT, big5: sB },
    riasecHit, pathHit,
  };
}

function computeMatches(answers, careers, deepScores) {
  const userProfile = buildUserProfile(answers, deepScores);
  const noAnswers = Object.keys(userProfile.riasec).length === 0
                 && Object.keys(userProfile.paths).length === 0
                 && Object.keys(userProfile.traits).length === 0
                 && Object.keys(userProfile.big5).length === 0;
  const weights = getWeights(userProfile);

  // 1. Raw scores per career
  const scored = careers.map((c) => {
    const cp = buildCareerProfile(c);
    const raw = rawScore(userProfile, cp, weights);
    const why = explainMatch(userProfile, c, cp, weights);
    return { career: c, careerProfile: cp, raw, why };
  });

  if (noAnswers) {
    return Object.assign(scored.map((s) => ({ career: s.career, score: 0, why: '' })), { confidence: 0, sources: [] });
  }

  // 2. Calibrate to 0-100. Cap raised dynamically based on test breadth:
  //    quick-only caps at 80% (don't oversell 6 Q's),
  //    +vocational caps at 88%, +Big Five caps at 95%.
  const maxRaw = Math.max(...scored.map((s) => s.raw), 0.001);
  const breadth = userProfile.sources.length;
  const FLOOR = 25;
  const CEIL = breadth >= 3 ? 95 : breadth === 2 ? 88 : 80;
  scored.forEach((s) => {
    const norm = s.raw / maxRaw;
    const curved = FLOOR + Math.pow(norm, 0.85) * (CEIL - FLOOR);
    s.score = Math.round(curved);
  });

  // 3. Sort by raw, diversify top-N via MMR.
  const sorted = scored.slice().sort((a, b) => b.raw - a.raw);
  const picked = [sorted[0]];
  const pool = sorted.slice(1);
  const LAMBDA = 0.7;
  const TOP_N = 6;

  while (picked.length < TOP_N && pool.length) {
    let bestIdx = 0, bestVal = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];
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
  picked.sort((a, b) => b.score - a.score);
  const tail = pool.sort((a, b) => b.raw - a.raw);
  const result = [...picked, ...tail].map(({ career, score, why }) => ({ career, score, why }));

  // 4. Confidence: dominated by test breadth (more sources = more confident),
  //    with spread between top-1 and top-3 as a secondary signal.
  //    Quick-only: ~0.10-0.35 (low). +Vocational: ~0.40-0.70 (medium).
  //    +Big Five: ~0.70-1.00 (high). Normalized 0-1.
  const top1 = picked[0] ? picked[0].raw : 0;
  const top3 = picked[2] ? picked[2].raw : 0;
  const spread = top1 > 0 ? (top1 - top3) / top1 : 0;
  // breadth-driven base: 0.10 / 0.40 / 0.70 for 1 / 2 / 3 sources
  const breadthBase = breadth >= 3 ? 0.70 : breadth === 2 ? 0.40 : 0.10;
  // spread bonus: max 0.30 when sources fully separate the top
  const spreadBonus = Math.min(0.30, spread * 1.5);
  const confidence = Math.min(1, breadthBase + spreadBonus);

  result.confidence = confidence;
  result.sources = userProfile.sources;
  result.weights = weights;
  result.nextTest = recommendNextTest(userProfile);
  // Expose the user's tallies so the UI can show plain-language "your style"
  // (top RIASEC codes), top Big Five trait, etc. — without re-deriving them.
  result.userProfile = userProfile;
  return result;
}

// Diagnose what test the user should take next to refine their profile most.
// Chain order (priority): quick → light Holland → personality short → deep
// Holland (O*NET, 60 items) → IPIP-NEO-60. Each step adds meaningful signal.
// Returns null if the user has done all the steps that would help.
function recommendNextTest(userProfile) {
  const sources = userProfile.sources || [];
  const hasQuick = sources.includes('quick');
  const hasVocLight = sources.includes('vocational') || sources.includes('vocational-deep');
  const hasVocDeep = sources.includes('vocational-deep');
  const hasBig5Light = sources.includes('personality-15') || sources.includes('ipip-neo-60');
  const hasBig5Full = sources.includes('ipip-neo-60');

  // Reason copy is calibrated for students: imperative voice, no jargon
  // (Holland / RIASEC / matching / Big Five only when they're proper names),
  // benefit in plain language ("ca să afli mai precis ce ți se potrivește").
  if (!hasQuick) return { kind: 'quick', reason: 'Începe cu quiz-ul rapid — 6 întrebări, 90s.' };
  if (!hasVocLight) {
    return { kind: 'vocational', reason: 'Continuă cu testul vocațional scurt (18 itemi, 4 min) ca să afli mai precis ce ți se potrivește.' };
  }
  // After light Holland, prioritize Big Five (different signal type) before deep Holland (same signal, refining).
  if (!hasBig5Light) {
    return { kind: 'personality', reason: 'Continuă cu testul de personalitate scurt (15 itemi, 4 min) ca să vedem și ce te motivează cu adevărat.' };
  }
  if (!hasVocDeep) {
    return { kind: 'vocational-deep', reason: 'Continuă cu testul vocațional aprofundat (60 itemi, 8-10 min). E cel folosit oficial în SUA — îți dă o predicție mult mai precisă decât testul scurt.' };
  }
  if (!hasBig5Full) {
    return { kind: 'ipip-neo', reason: 'Continuă cu testul de personalitate validat (60 itemi, 12 min). E versiunea științifică a celui scurt — cea mai precisă predicție a profilului tău.' };
  }
  return null;
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
  const [deepScores, setDeepScores] = useState({ personality: null, vocational: null, vocationalDeep: null, ipipNeo60: null });

  const data = window.QUIZ_DATA;
  // Phase A: deepScores now flows into matching. Vocational test (Holland)
  // doubles the RIASEC vote weight; personality / IPIP-NEO-60 unlocks the
  // Big Five axis. Without this dependency, taking the personality or
  // vocational test would NOT change the recommendation.
  const matches = useMemo(() => computeMatches(answers, data.careers, deepScores), [answers, data.careers, deepScores]);

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
    else if (kind === 'vocational-deep') goto('vocational-deep');
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
            <WelcomeScreen
              onStart={handleStart}
              onPickTest={handlePickTest}
              onExplore={() => { setBrowseSection('careers'); goto('browse'); }}
              layout={tweaks.welcomeLayout}
            />
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
          {route.name === 'vocational-deep' && window.VocationalDeepScreen && (
            <VocationalDeepScreen
              onBack={() => goto('welcome')}
              onComplete={(scores) => { setDeepScores((p) => ({ ...p, vocationalDeep: scores })); goto('deepResults', { kind: 'vocationalDeep' }); }}
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
              onDeepVoc={route.kind === 'vocational' ? () => goto('vocational-deep') : undefined}
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
              onPickTest={handlePickTest}
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
