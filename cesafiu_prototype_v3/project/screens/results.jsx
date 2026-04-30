// Results screen — career match reveal with sticker explosion
function ResultsScreen({ matches, onPickCareer, onRetake, onProfile, onSaveCareer, savedIds, layout }) {
  if (layout === 'list') return <ResultsList matches={matches} onPickCareer={onPickCareer} onRetake={onRetake} />;
  return <ResultsHero matches={matches} onPickCareer={onPickCareer} onRetake={onRetake} onProfile={onProfile} onSaveCareer={onSaveCareer} savedIds={savedIds || []} />;
}

function ResultsHero({ matches, onPickCareer, onRetake, onProfile, onSaveCareer, savedIds }) {
  const top = matches[0];
  const others = matches.slice(1, 4);
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };
  const PaidHookCard = window.PaidHookCard;
  const isAlreadySaved = top && savedIds && savedIds.includes(top.career.id);
  const [justSaved, setJustSaved] = React.useState(false);

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
        {top.why && (
          <div className="label-sm" style={{ marginTop: 12, opacity: 0.85, fontFamily: 'JetBrains Mono, monospace' }}>
            DE CE: {top.why}
          </div>
        )}

        {/* Honest disclaimer — quick quiz is orientation, not assessment */}
        <div style={{
          marginTop: 16, padding: '8px 12px',
          background: 'rgba(0,0,0,0.15)', border: '2px solid #000',
          fontSize: 11, lineHeight: 1.4, fontWeight: 600,
        }}>
          ⚠ TEST RAPID DE ORIENTARE · 6 întrebări nu pot prezice cariera ta. E un punct de pornire — testele aprofundate (mai jos) îți dau indicii mai solide.
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
