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

function computeMatches(answers, careers) {
  const scores = {};
  careers.forEach((c) => { scores[c.id] = 0; });
  Object.values(answers).forEach((opt) => {
    if (!opt || !opt.traits) return;
    careers.forEach((c) => {
      const overlap = opt.traits.filter((t) => c.traits.includes(t)).length;
      scores[c.id] += overlap;
    });
  });
  const max = Math.max(...Object.values(scores), 1);
  return careers
    .map((c) => ({ career: c, score: Math.round(60 + (scores[c.id] / max) * 38) }))
    .sort((a, b) => b.score - a.score);
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAKS_DEFAULTS);
  const [route, setRoute] = useState({ name: 'welcome' });
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savedIds, setSavedIds] = useState([]);
  const [selectedThisQ, setSelectedThisQ] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [browseSection, setBrowseSection] = useState('careers');
  const [deepScores, setDeepScores] = useState({ personality: null, vocational: null });

  const data = window.QUIZ_DATA;
  const matches = useMemo(() => computeMatches(answers, data.careers), [answers, data.careers]);

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
              onBack={() => goto('welcome')}
              onComplete={(scores) => { setDeepScores((p) => ({ ...p, personality: scores })); goto('deepResults', { kind: 'personality' }); }}
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
              onRetake={() => goto(route.kind)}
              onProfile={() => goto('profile')}
            />
          )}
          {route.name === 'results' && (
            <ResultsScreen matches={matches} onPickCareer={handlePickCareer} onRetake={handleStart} onProfile={() => goto('profile')} layout={tweaks.resultsLayout} />
          )}
          {route.name === 'career' && (
            <CareerDetailScreen
              career={data.careers.find((c) => c.id === route.careerId)}
              onBack={() => goto(matches.length ? 'results' : 'browse')}
              onSave={() => handleSaveCareer(route.careerId)}
              isSaved={savedIds.includes(route.careerId)}
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
          {route.name === 'pathDetail' && <PathDetailScreen pathId={route.pathId} onBack={() => goto('browse')} />}
          {route.name === 'uniDetail' && <UniDetailScreen uniId={route.uniId} onBack={() => goto('browse')} />}
          {route.name === 'profile' && (
            <ProfileScreen savedCareerIds={savedIds} careers={data.careers} onPickCareer={handlePickCareer} onRetake={handleStart} />
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
          <TweakButton label="→ Personality test" onClick={() => goto('personality')} />
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
