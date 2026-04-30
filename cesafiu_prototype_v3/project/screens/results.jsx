// Results screen — career match reveal with sticker explosion
function ResultsScreen({ matches, onPickCareer, onRetake, onProfile, onSaveCareer, savedIds, onPickTest, layout }) {
  if (layout === 'list') return <ResultsList matches={matches} onPickCareer={onPickCareer} onRetake={onRetake} />;
  return <ResultsHero matches={matches} onPickCareer={onPickCareer} onRetake={onRetake} onProfile={onProfile} onSaveCareer={onSaveCareer} savedIds={savedIds || []} onPickTest={onPickTest} />;
}

function ResultsHero({ matches, onPickCareer, onRetake, onProfile, onSaveCareer, savedIds, onPickTest }) {
  const top = matches[0];
  const others = matches.slice(1, 4);
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };
  const PaidHookCard = window.PaidHookCard;
  const isAlreadySaved = top && savedIds && savedIds.includes(top.career.id);
  const [justSaved, setJustSaved] = React.useState(false);

  // Phase A: matches now carries confidence + sources + nextTest. Confidence
  // is 0..1; sources lists test types that fed the algorithm; nextTest is
  // an adaptive recommendation { kind, reason } or null when nothing helpful.
  const confidence = (typeof matches.confidence === 'number') ? matches.confidence : 0;
  const sources = matches.sources || [];
  const nextTest = matches.nextTest || null;
  const sourceLabels = {
    'quick': 'Quiz rapid',
    'vocational': 'Holland (vocațional)',
    'personality-15': 'Big Five (15 itemi)',
    'ipip-neo-60': 'Big Five (IPIP-NEO-60)',
  };
  // Aligned with the new breadth-driven confidence scale (Phase A):
  // <0.30 (quick-only typical) = Scăzută
  // 0.30-0.60 (+vocational typical) = Medie
  // >0.60 (+Big Five typical) = Solidă
  const confLabel = confidence < 0.30 ? 'Scăzută' : confidence < 0.60 ? 'Medie' : 'Solidă';
  const confColor = confidence < 0.30 ? 'var(--yellow)' : confidence < 0.60 ? 'var(--green)' : 'var(--purple)';

  // top.why is now an object: { text, axes: { riasec, paths, traits, big5 }, riasecHit, pathHit }
  const whyText = top && top.why && (typeof top.why === 'object' ? top.why.text : top.why);
  const whyAxes = top && top.why && top.why.axes;

  const handleSaveAndGo = () => {
    if (top && onSaveCareer && !isAlreadySaved) onSaveCareer(top.career.id);
    setJustSaved(true);
    setTimeout(() => { setJustSaved(false); if (onProfile) onProfile(); }, 600);
  };

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      {/* hero */}
      <div style={{
        background: colors[top.career.color], color: top.career.color === 'purple' ? '#fff' : '#000',
        padding: '24px 20px 48px', borderBottom: '2px solid #000', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="sticker sticker-white tilt-l">VIBE-UL TĂU</div>
          <button onClick={onRetake} className="label-bold" style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
            REIA ↻
          </button>
        </div>
        <div className="label-bold" style={{ marginTop: 28, opacity: 0.7 }}>POTRIVIT PENTRU TINE:</div>
        <div className="h-xl anim-pop" style={{ fontSize: 52, marginTop: 8, lineHeight: 0.95 }}>
          {top.career.name.split(' ').map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
        <div className="body-lg" style={{ marginTop: 16, fontWeight: 600, fontStyle: 'italic' }}>
          „{top.career.tagline}."
        </div>
        {whyText && (
          <div className="label-sm" style={{ marginTop: 12, opacity: 0.85, fontFamily: 'JetBrains Mono, monospace' }}>
            DE CE: {whyText}
          </div>
        )}

        {/* Confidence + sources strip — replaces the static disclaimer.
            Honest about what the algorithm has to work with. */}
        <div style={{
          marginTop: 16, padding: '10px 12px',
          background: 'rgba(0,0,0,0.15)', border: '2px solid #000',
          fontSize: 11, lineHeight: 1.45, fontWeight: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: confColor, color: '#000', padding: '2px 8px', border: '2px solid #000', fontWeight: 800 }}>
              ÎNCREDERE: {confLabel}
            </span>
            <span style={{ opacity: 0.85 }}>
              Bazat pe: {(sources.length ? sources.map(s => sourceLabels[s] || s).join(' + ') : 'fără date')}
            </span>
          </div>
          {confidence < 0.60 && nextTest && (
            <div style={{ marginTop: 6, opacity: 0.9 }}>
              Mai multe teste = matches mai precise. {nextTest.reason}
            </div>
          )}
        </div>

        {/* big abstract emoji-ish */}
        <div style={{
          position: 'absolute', top: 24, right: -20, width: 120, height: 120,
          background: 'rgba(255,255,255,0.2)', border: '2px solid #000',
          borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 64, transform: 'rotate(15deg)',
        }}>{top.career.emoji}</div>

        {/* match score sticker */}
        <div className="sticker sticker-purple anim-stamp" style={{
          position: 'absolute', bottom: -16, right: 24, fontSize: 14, padding: '10px 16px',
          background: '#000', color: '#fff', transform: 'rotate(-4deg)', boxShadow: '4px 4px 0 #fff, 4px 4px 0 2px #000',
        }}>
          <span style={{ color: 'var(--green)' }}>★</span> MATCH {top.score}%
        </div>
      </div>

      {/* meta strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '2px solid #000' }}>
        {[
          { label: 'SALARIU', value: top.career.salary.split('—')[1]?.trim() || top.career.salary, bg: '#fff' },
          { label: 'CERERE', value: top.career.demand, bg: 'var(--paper-2)' },
          { label: 'VIBE', value: top.career.vibe, bg: '#fff' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '14px 12px', background: m.bg, borderRight: i < 2 ? '2px solid #000' : 'none', textAlign: 'center' }}>
            <div className="label-sm" style={{ color: 'var(--ink-soft)' }}>{m.label}</div>
            <div className="body-sm" style={{ fontWeight: 800, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div className="body-md" style={{ lineHeight: 1.5 }}>
          {top.career.description}
        </div>

        <button
          onClick={() => onPickCareer(top.career.id)}
          className="btn btn-primary btn-lg"
          style={{ marginTop: 24, width: '100%' }}
        >
          VEZI TOT DESPRE ASTA →
        </button>

        {/* Per-axis breakdown — explains the match honestly. Phase A.
            Each bar = sub-score on one of: RIASEC, drum (path), traits, Big Five.
            Big Five only shown when user has personality data. */}
        {whyAxes && (
          <div style={{ marginTop: 24, padding: 14, background: 'var(--paper-2)', border: '2px solid #000' }}>
            <div className="label-bold" style={{ marginBottom: 10 }}>DE CE — pe axe</div>
            {[
              { key: 'riasec', label: 'RIASEC (Holland)', help: 'Tipul tău dominant + codul carierei' },
              { key: 'paths',  label: 'Drum educațional',  help: 'Facultate / autodidact / antreprenor / etc.' },
              { key: 'traits', label: 'Trăsături',         help: 'Build, analyze, social, create…' },
              { key: 'big5',   label: 'Big Five',          help: 'Profil de personalitate (necesar test)' },
            ].map((row) => {
              const v = whyAxes[row.key];
              const has = (typeof v === 'number');
              const pct = has ? Math.round(v * 100) : 0;
              return (
                <div key={row.key} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    <span>{row.label}</span>
                    <span style={{ color: has ? 'var(--ink)' : 'var(--ink-soft)' }}>
                      {has ? `${pct}%` : 'fără date'}
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#fff', border: '2px solid #000', overflow: 'hidden' }}>
                    {has && (
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: pct > 60 ? 'var(--green)' : pct > 30 ? 'var(--yellow)' : 'var(--purple)',
                      }}></div>
                    )}
                  </div>
                  {!has && (
                    <div className="label-sm" style={{ color: 'var(--ink-soft)', marginTop: 3, fontSize: 11 }}>
                      {row.help}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Adaptive next-test CTA — shows the most useful next test based on
            what the user has done so far. Phase A. */}
        {nextTest && nextTest.kind !== 'quick' && (
          <div style={{
            marginTop: 16, padding: 16, background: 'var(--purple)', color: '#fff',
            border: '2px solid #000', boxShadow: '4px 4px 0 #000',
          }}>
            <div className="label-bold" style={{ color: 'var(--yellow)', marginBottom: 6 }}>
              PASUL URMĂTOR · MAI MULT DETALIU
            </div>
            <div className="body-md" style={{ marginBottom: 10, fontWeight: 600 }}>
              {nextTest.reason}
            </div>
            {onPickTest && (
              <button
                onClick={() => onPickTest(nextTest.kind === 'ipip-neo' ? 'ipip-neo' : nextTest.kind)}
                className="btn"
                style={{ background: 'var(--yellow)', color: '#000', fontWeight: 800 }}
              >
                {nextTest.kind === 'vocational' ? 'TESTUL VOCAȚIONAL →' : nextTest.kind === 'ipip-neo' ? 'BIG FIVE (12 MIN) →' : 'PERSONALITATE (4 MIN) →'}
              </button>
            )}
          </div>
        )}

        {/* other matches */}
        <div className="h-md" style={{ marginTop: 36, marginBottom: 12 }}>
          Și încă <span style={{ background: 'var(--yellow)', padding: '0 6px', border: '2px solid #000' }}>3 vibe-uri</span> care îți merg
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {others.map((m, i) => (
            <button
              key={m.career.id}
              onClick={() => onPickCareer(m.career.id)}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 14, background: '#fff', textAlign: 'left',
                font: 'inherit', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 56, height: 56, flexShrink: 0,
                background: colors[m.career.color], border: '2px solid #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: m.career.color === 'purple' ? '#fff' : '#000',
              }}>{m.career.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-sm">{m.career.name}</div>
                <div className="body-sm" style={{ color: 'var(--ink-soft)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.career.tagline}</div>
              </div>
              <div style={{
                background: '#000', color: 'var(--green)',
                padding: '6px 10px', fontWeight: 800, fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
              }}>{m.score}%</div>
            </button>
          ))}
        </div>

        {/* Save vibe — actually persists the top career via onSaveCareer + nav.
            Previously this button only navigated to /profile; nothing was saved. */}
        <div className="card" style={{ marginTop: 32, padding: 20, background: 'var(--green)' }}>
          <div className="h-sm">{isAlreadySaved ? 'Vibe-ul tău e salvat' : 'Salvează rezultatul'}</div>
          <div className="body-sm" style={{ marginTop: 6 }}>
            {isAlreadySaved
              ? 'Îl găsești în Vibe-uri oricând. Apasă mai jos să-l deschizi.'
              : 'Îl găsești în profilul tău. Toate datele rămân pe device-ul tău.'}
          </div>
          <button
            onClick={handleSaveAndGo}
            disabled={justSaved}
            className="btn"
            style={{
              marginTop: 14, width: '100%',
              background: justSaved ? 'var(--purple)' : '#000',
              color: '#fff',
              transition: 'background .15s',
            }}
          >
            {justSaved
              ? '✓ SALVAT — DESCHID PROFILUL'
              : isAlreadySaved
                ? 'DESCHIDE PROFILUL →'
                : 'SALVEAZĂ-MI VIBE-UL →'}
          </button>
        </div>

        {/* Paid in-depth report hook — Phase 1 willingness-to-pay validator */}
        {PaidHookCard && (
          <PaidHookCard
            context="quick-quiz"
            summary={`Quick quiz top match: ${top.career.name} (${top.score}%)`}
          />
        )}

        <div style={{ height: 24 }}></div>
      </div>
    </div>
  );
}

function ResultsList({ matches, onPickCareer, onRetake }) {
  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100, padding: '0 20px 100px' }}>
      <div style={{ paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="h-lg">Top 6 pentru tine</div>
        <button onClick={onRetake} className="btn btn-icon" style={{ background: '#fff' }}>↻</button>
      </div>
      <div className="body-md" style={{ color: 'var(--ink-soft)', marginTop: 4, marginBottom: 20 }}>
        Sortate după cât de mult te potrivești.
      </div>
      {matches.map((m, i) => (
        <button
          key={m.career.id}
          onClick={() => onPickCareer(m.career.id)}
          className="card"
          style={{
            display: 'block', width: '100%', marginBottom: 12, padding: 16,
            background: i === 0 ? 'var(--yellow)' : '#fff', textAlign: 'left',
            font: 'inherit', cursor: 'pointer', position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="h-sm">{i + 1}. {m.career.name}</div>
            <div className="mono" style={{ fontWeight: 800 }}>{m.score}%</div>
          </div>
          <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 4 }}>{m.career.tagline}</div>
          <div className="progress" style={{ marginTop: 10, height: 10 }}>
            <div className="progress-fill" style={{ width: `${m.score}%` }}></div>
          </div>
        </button>
      ))}
    </div>
  );
}

window.ResultsScreen = ResultsScreen;
