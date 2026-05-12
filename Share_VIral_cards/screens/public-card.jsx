// Public card screen — simulates what a colleague sees when they open /u/CODE
// This is the VIRAL LOOP: friend opens link → tries to guess → must take quiz to see answer
const { useState: usePCState } = React;

function PublicCardScreen({ matches, answers, onBack, onStartQuiz }) {
  const { code, archetype } = window.deriveArchetype(answers);
  const top3 = (matches || []).slice(0, 3);
  const score = top3[0]?.score || 0;
  const CardVisual = window.CardVisual;

  const [step, setStep] = usePCState('intro'); // intro | guess | reveal
  const [guess, setGuess] = usePCState(null);

  // Build 4 guess options: real + 3 plausible distractors from the archetype pool
  const guessOptions = useMemoOnce(() => {
    const all = Object.values(ARCHETYPES_LOOKUP);
    const real = archetype;
    const distractors = all.filter((a) => a.name !== real.name).sort(() => Math.random() - 0.5).slice(0, 3);
    return [real, ...distractors].sort(() => Math.random() - 0.5);
  }, [archetype.name]);

  const correct = guess && guess.name === archetype.name;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', background: 'var(--paper)' }}>
      {/* Browser-like URL bar to sell "this is the public link" */}
      <div style={{
        background: '#000', color: '#fff',
        padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: 'ui-monospace, monospace', fontSize: 10, fontWeight: 700,
        borderBottom: '2px solid #000',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14 }}>←</button>
        <span style={{ opacity: 0.5 }}>cesafiu.ro/u/</span>
        <span style={{ color: 'var(--yellow)' }}>{code}{score}</span>
        <span style={{ marginLeft: 'auto', opacity: 0.5 }}>● PUBLIC</span>
      </div>

      <div style={{ padding: 16 }}>
        {step === 'intro' && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
              color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 4,
            }}>UN COLEG ȚI-A TRIMIS ASTA</div>
            <div className="h-md" style={{ fontSize: 22, lineHeight: 1.1, marginBottom: 12 }}>
              Ghicești ce a ieșit la el?
            </div>

            <div style={{ maxWidth: 220, margin: '0 auto 16px' }}>
              <CardVisual archetype={archetype} code={code} score={score} top3={top3} revealed={false} />
            </div>

            <div style={{
              background: 'var(--yellow)', border: '2px solid #000', padding: '12px 14px',
              fontSize: 11, fontWeight: 700, lineHeight: 1.4, marginBottom: 14,
              boxShadow: '3px 3px 0 #000',
            }}>
              🎯 Ghicești corect din 4 variante? Vezi rezultatul real al colegului tău.
            </div>

            <button onClick={() => setStep('guess')} style={{
              width: '100%', background: 'var(--purple)', color: '#fff',
              border: '2px solid #000', padding: '14px',
              fontWeight: 900, fontSize: 13, letterSpacing: 1.5,
              cursor: 'pointer', boxShadow: '4px 4px 0 #000',
            }}>
              ▶ ÎNCEPE
            </button>
          </>
        )}

        {step === 'guess' && (
          <>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
              color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 4,
            }}>ALEGE</div>
            <div className="h-md" style={{ fontSize: 20, lineHeight: 1.1, marginBottom: 14 }}>
              Care arhetip crezi că a ieșit?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {guessOptions.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => { setGuess(opt); setStep('reveal'); }}
                  style={{
                    background: '#fff', color: '#000',
                    border: '2px solid #000', padding: '14px',
                    textAlign: 'left', cursor: 'pointer',
                    boxShadow: '3px 3px 0 #000',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <span style={{
                    width: 32, height: 32, background: 'var(--purple)', color: '#fff',
                    border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 900, flexShrink: 0,
                  }}>{opt.glyph}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 900, lineHeight: 1.1 }}>{opt.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 2, lineHeight: 1.3 }}>{opt.tag}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'reveal' && (
          <>
            <div style={{
              background: correct ? 'var(--green)' : '#000',
              color: correct ? '#000' : '#fff',
              border: '2px solid #000', padding: '14px',
              boxShadow: '3px 3px 0 var(--purple)',
              marginBottom: 14,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, opacity: 0.7, marginBottom: 4 }}>
                {correct ? '✓ CORECT' : '✗ GREȘIT'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>
                {correct ? 'Îți cunoști colegul bine!' : `A ieșit ${archetype.name}.`}
              </div>
            </div>

            <div style={{ maxWidth: 220, margin: '0 auto 14px' }}>
              <CardVisual archetype={archetype} code={code} score={score} top3={top3} revealed={true} />
            </div>

            <div style={{
              background: 'var(--purple)', color: '#fff',
              border: '2px solid #000', padding: '14px',
              boxShadow: '3px 3px 0 #000', marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, opacity: 0.85, marginBottom: 4 }}>ACUM RÂNDUL TĂU</div>
              <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.15, marginBottom: 8 }}>
                Curios ce iese la tine?
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.4, opacity: 0.9, marginBottom: 12 }}>
                90 de secunde. Gratis. Fără cont.
              </div>
              <button onClick={onStartQuiz} style={{
                width: '100%', background: 'var(--yellow)', color: '#000',
                border: '2px solid #000', padding: '12px',
                fontWeight: 900, fontSize: 13, letterSpacing: 1.5,
                cursor: 'pointer', boxShadow: '3px 3px 0 #000',
              }}>
                ▶ FĂ-MI QUIZ-UL
              </button>
            </div>

            <button onClick={() => { setStep('intro'); setGuess(null); }} style={{
              width: '100%', background: 'none', border: 'none',
              color: 'var(--ink-soft)', fontSize: 11, fontWeight: 700,
              textDecoration: 'underline', cursor: 'pointer', padding: 8,
            }}>
              ← încearcă din nou
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Helpers — keep here so the file is self-contained
function useMemoOnce(fn, deps) {
  return React.useMemo(fn, deps);
}

// Mirror of the archetype lookup from share-card.jsx (needed for distractor pool).
// Read from the module-level ARCHETYPES constant defined there at runtime.
const ARCHETYPES_LOOKUP = (typeof window !== 'undefined' && window.ARCHETYPES) ? window.ARCHETYPES : {
  RI: { name: 'CONSTRUCTORUL', glyph: '⚒', tag: 'Faci. Cu mâinile, cu mintea, cu logica.' },
  IA: { name: 'GÂNDITORUL CREATIV', glyph: '◊', tag: 'Idei + estetică = oxigenul tău.' },
  AS: { name: 'POVESTITORUL', glyph: '★', tag: 'Spui povești care vindecă oameni.' },
  SE: { name: 'LIDERUL EMPATIC', glyph: '⚡', tag: 'Conduci pentru că oamenii te urmează cu drag.' },
  EI: { name: 'STRATEGUL', glyph: '∆', tag: 'Citești terenul înainte să joci.' },
  IC: { name: 'ANALISTUL', glyph: '∆', tag: 'Datele îți spun adevărul.' },
};

window.PublicCardScreen = PublicCardScreen;
