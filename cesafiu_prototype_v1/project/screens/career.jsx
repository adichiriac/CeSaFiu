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

        {tab === 'schools' && (() => {
          // Pull real programs that lead to this career, joined to their institution.
          // Falls back to the legacy career.schools[] strings only if no programs are mapped yet.
          const allPrograms = (window.QUIZ_DATA.programs || []).filter(
            (p) => (p.careerIds || []).includes(career.id)
          );
          const unisById = Object.fromEntries((window.QUIZ_DATA.universities || []).map((u) => [u.id, u]));
          const pathLabel = { facultate: 'FACULTATE', autodidact: 'AUTODIDACT', bootcamp: 'BOOTCAMP', antreprenor: 'ANTREPRENOR', mixt: 'MIXT', profesional: 'PROFESIONAL', postliceala: 'POSTLICEAL', creator: 'CREATOR', freelance: 'FREELANCE' };
          const pathColor = { facultate: 'var(--purple)', autodidact: 'var(--green)', bootcamp: 'var(--green)', antreprenor: 'var(--purple)', profesional: 'var(--yellow)', postliceala: 'var(--yellow)', mixt: '#fff', creator: 'var(--green)', freelance: 'var(--yellow)' };
          const pathTextC = { facultate: '#fff', autodidact: '#000', bootcamp: '#000', antreprenor: '#fff', profesional: '#000', postliceala: '#000', mixt: '#000', creator: '#000', freelance: '#000' };

          const trackProgClick = (pid, name) => {
            try {
              const fn = window.umamiTrack || (window.umami && window.umami.track);
              if (fn) fn('uni_program_click', { id: pid, program: name, source: 'career-detail' });
            } catch (e) {}
          };

          if (allPrograms.length > 0) {
            return (
              <>
                <div className="label-bold" style={{ marginBottom: 12, color: 'var(--purple)' }}>
                  PROGRAME CARE DUC AICI · {allPrograms.length}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {allPrograms.map((p) => {
                    const u = unisById[p.universityId];
                    const url = p.url || (u && u.url) || `https://www.google.com/search?q=${encodeURIComponent((u ? u.name + ' ' : '') + p.name)}`;
                    return (
                      <a
                        key={p.id}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackProgClick(p.id, p.name)}
                        className="card"
                        style={{ padding: 14, background: '#fff', textDecoration: 'none', color: 'inherit', display: 'block' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                          <div style={{ flex: 1 }}>
                            <div className="h-sm" style={{ fontSize: 15 }}>{p.name}</div>
                            <div className="label-sm" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>
                              {u ? u.name : p.universityId} · {u ? u.city : ''}
                            </div>
                          </div>
                          <span style={{ fontSize: 16, color: 'var(--ink-soft)', flexShrink: 0 }}>↗</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 800, padding: '3px 7px',
                            border: '2px solid #000', background: pathColor[p.pathType] || '#fff',
                            color: pathTextC[p.pathType] || '#000', letterSpacing: '.04em',
                          }}>{pathLabel[p.pathType] || p.pathType.toUpperCase()}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '3px 7px',
                            border: '2px solid #000', background: 'var(--paper-2)', color: 'var(--ink-soft)',
                          }}>{p.duration}</span>
                          {(p.language || []).slice(0, 2).map((lng) => (
                            <span key={lng} style={{
                              fontSize: 10, fontWeight: 700, padding: '3px 7px',
                              border: '2px solid #000', background: '#fff', textTransform: 'uppercase',
                            }}>{lng}</span>
                          ))}
                        </div>
                        {p.notes && (
                          <div className="body-sm" style={{ marginTop: 8, color: 'var(--ink)' }}>{p.notes}</div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </>
            );
          }

          // Fallback — legacy career.schools[] strings
          return (
            <div className="card" style={{ padding: 18 }}>
              <div className="label-bold" style={{ marginBottom: 6, color: 'var(--purple)' }}>RECOMANDATE</div>
              <div className="body-sm" style={{ color: 'var(--ink-soft)', marginBottom: 10 }}>
                Programe specifice nu sunt încă în baza noastră — adăugăm pe măsură ce verificăm.
              </div>
              {(career.schools || []).map((s, i) => (
                <div key={s} style={{
                  padding: '12px 0',
                  borderBottom: i < (career.schools || []).length - 1 ? '2px solid #000' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div className="body-md" style={{ fontWeight: 700 }}>{s}</div>
                  <div style={{ fontSize: 18 }}>↗</div>
                </div>
              ))}
            </div>
          );
        })()}
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
