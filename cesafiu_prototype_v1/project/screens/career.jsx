// Career detail screen — deep dive into a career
function CareerDetailScreen({ career, onBack, onSave, isSaved }) {
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };
  const [tab, setTab] = React.useState('day');

  const tabs = [
    { id: 'day', label: 'O ZI' },
    { id: 'skills', label: 'SKILLS' },
    { id: 'paths', label: 'TRASEU' },
    { id: 'schools', label: 'ȘCOLI' },
  ];

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      {/* hero */}
      <div style={{
        background: colors[career.color], color: career.color === 'purple' ? '#fff' : '#000',
        padding: '12px 20px 40px', borderBottom: '2px solid #000', position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <button onClick={onBack} className="btn btn-icon" style={{ background: '#fff', color: '#000' }}>←</button>
          <button onClick={onSave} className="btn btn-icon" style={{ background: isSaved ? '#000' : '#fff', color: isSaved ? 'var(--green)' : '#000' }}>
            {isSaved ? '★' : '☆'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 72, height: 72, flexShrink: 0,
            background: '#fff', border: '2px solid #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, color: '#000',
            boxShadow: '4px 4px 0 #000',
            transform: 'rotate(-4deg)',
          }}>{career.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="h-lg" style={{ fontSize: 30 }}>{career.name}</div>
            <div className="body-md" style={{ marginTop: 6, fontWeight: 600, fontStyle: 'italic' }}>„{career.tagline}"</div>
          </div>
        </div>
      </div>

      {/* meta cards */}
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="label-sm" style={{ color: 'var(--ink-soft)' }}>SALARIU LUNAR</div>
          <div className="h-sm" style={{ marginTop: 4 }}>{career.salary}</div>
        </div>
        <div className="card" style={{ padding: 14, background: 'var(--green)' }}>
          <div className="label-sm">CERERE PIAȚĂ</div>
          <div className="h-sm" style={{ marginTop: 4 }}>{career.demand}</div>
        </div>
      </div>

      {/* description */}
      <div style={{ padding: '0 20px' }}>
        <div className="body-lg" style={{ lineHeight: 1.5 }}>{career.description}</div>
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 8, padding: '24px 20px 12px', overflowX: 'auto' }} className="scroll-y">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="chip"
            aria-selected={tab === t.id}
            style={{ flexShrink: 0 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px' }}>
        {tab === 'day' && (
          <div className="card" style={{ padding: 18, background: 'var(--paper-2)' }}>
            <div className="label-bold" style={{ marginBottom: 12, color: 'var(--purple)' }}>O ZI DIN VIAȚA TA</div>
            {career.day.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 24, height: 24, background: 'var(--yellow)', border: '2px solid #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 12, flexShrink: 0,
                }}>{String(i + 1).padStart(2, '0')}</div>
                <div className="body-md" style={{ flex: 1 }}>{item}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'skills' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {career.skills.map((s, i) => (
              <div key={s} className="sticker" style={{
                background: i % 2 === 0 ? 'var(--yellow)' : '#fff',
                fontSize: 14, padding: '10px 16px',
                transform: `rotate(${(i % 2 ? 1 : -1) * 1.5}deg)`,
              }}>{s}</div>
            ))}
          </div>
        )}

        {tab === 'paths' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {career.paths.map((p, i) => (
              <div key={p} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 99, background: 'var(--purple)', color: '#fff',
                  border: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13,
                }}>→</div>
                <div className="body-md" style={{ fontWeight: 700 }}>{p}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'schools' && (
          <div className="card" style={{ padding: 18 }}>
            <div className="label-bold" style={{ marginBottom: 12, color: 'var(--purple)' }}>ROMÂNIA · TOP 3</div>
            {career.schools.map((s, i) => (
              <div key={s} style={{
                padding: '12px 0',
                borderBottom: i < career.schools.length - 1 ? '2px solid #000' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div className="body-md" style={{ fontWeight: 700 }}>{s}</div>
                <div style={{ fontSize: 18 }}>↗</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 20, marginTop: 8 }}>
        <button onClick={onSave} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
          {isSaved ? '★ SALVAT' : 'SALVEAZĂ ÎN VIBE-URI'}
        </button>
      </div>
    </div>
  );
}

window.CareerDetailScreen = CareerDetailScreen;
