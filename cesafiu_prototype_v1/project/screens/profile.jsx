// Profile screen — saved careers + retake quiz + simple profile
function ProfileScreen({ savedCareerIds, careers, onPickCareer, onRetake }) {
  const saved = careers.filter((c) => savedCareerIds.includes(c.id));
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      {/* header */}
      <div style={{ padding: '8px 20px 24px' }}>
        <div className="h-lg">Vibe-urile tale</div>
        <div className="body-md" style={{ color: 'var(--ink-soft)', marginTop: 4 }}>
          Cariere salvate. Reia quiz-ul oricând vrei.
        </div>
      </div>

      {/* user card */}
      <div style={{ padding: '0 20px 24px' }}>
        <div className="card card-pop" style={{ padding: 20, background: 'var(--purple)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 99,
              background: 'var(--yellow)', border: '2px solid #000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', fontWeight: 900, fontSize: 26, fontFamily: 'Epilogue',
            }}>A</div>
            <div style={{ flex: 1 }}>
              <div className="h-sm" style={{ color: '#fff' }}>Alex, cls. a XI-a</div>
              <div className="body-sm" style={{ opacity: 0.9 }}>București · București</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '2px solid #000', padding: '10px 12px' }}>
              <div className="label-sm" style={{ color: 'var(--yellow)' }}>QUIZ-URI</div>
              <div className="h-sm" style={{ color: '#fff', marginTop: 2 }}>3</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '2px solid #000', padding: '10px 12px' }}>
              <div className="label-sm" style={{ color: 'var(--yellow)' }}>SALVATE</div>
              <div className="h-sm" style={{ color: '#fff', marginTop: 2 }}>{saved.length}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '2px solid #000', padding: '10px 12px' }}>
              <div className="label-sm" style={{ color: 'var(--yellow)' }}>STREAK</div>
              <div className="h-sm" style={{ color: '#fff', marginTop: 2 }}>7d</div>
            </div>
          </div>
        </div>
      </div>

      {/* saved list */}
      <div style={{ padding: '0 20px' }}>
        <div className="h-md" style={{ marginBottom: 12 }}>Salvate</div>
        {saved.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: 'center', background: 'var(--paper-2)' }}>
            <div style={{ fontSize: 40 }}>✦</div>
            <div className="h-sm" style={{ marginTop: 8 }}>Încă nimic salvat</div>
            <div className="body-sm" style={{ marginTop: 6, color: 'var(--ink-soft)' }}>
              Reia quiz-ul și salvează vibe-urile care te prind.
            </div>
            <button onClick={onRetake} className="btn btn-primary" style={{ marginTop: 14 }}>
              REIA QUIZ-UL
            </button>
          </div>
        )}
        {saved.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onPickCareer(c.id)}
            className="card"
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 12,
              background: i === 0 ? 'var(--yellow)' : '#fff', textAlign: 'left',
              font: 'inherit', cursor: 'pointer', width: '100%',
            }}
          >
            <div style={{
              width: 52, height: 52, flexShrink: 0,
              background: colors[c.color], border: '2px solid #000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, color: c.color === 'purple' ? '#fff' : '#000',
            }}>{c.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-sm">{c.name}</div>
              <div className="body-sm" style={{ color: 'var(--ink-soft)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.tagline}</div>
            </div>
            <div style={{ fontSize: 18 }}>→</div>
          </button>
        ))}
      </div>

      {/* retake CTA */}
      <div style={{ padding: 20, marginTop: 12 }}>
        <button onClick={onRetake} className="btn btn-yellow btn-lg" style={{ width: '100%' }}>
          REIA QUIZ-UL ↻
        </button>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
