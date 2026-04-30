// Profile screen — accumulated profile from quizzes + saved careers + entry to explore
function ProfileScreen({ savedCareerIds, careers, userProfile, onPickCareer, onRetake, onExplore, onPickTest }) {
  const saved = careers.filter((c) => savedCareerIds.includes(c.id));
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };

  // Profile signal: any test contribution counts.
  const profileApi = window.cesafiuProfile;
  const hasProfile = profileApi ? profileApi.hasData(userProfile || {}) : false;
  const sources = (userProfile && userProfile.sources) || [];
  const riasecCounts = (userProfile && userProfile.riasec) || {};
  const pathCounts = (userProfile && userProfile.paths) || {};
  const big5 = (userProfile && userProfile.big5) || null;

  // Top RIASEC codes for this user.
  const RIASEC_NAMES = { R: 'Realist', I: 'Investigativ', A: 'Artistic', S: 'Social', E: 'Întreprinzător', C: 'Convențional' };
  const PATH_NAMES = { facultate: 'Facultate', autodidact: 'Autodidact', antreprenor: 'Antreprenor', profesional: 'Profesional', creator: 'Creator', freelance: 'Freelance', mixt: 'Mixt' };
  const topRiasec = Object.entries(riasecCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topPath = Object.entries(pathCounts).sort((a, b) => b[1] - a[1]).slice(0, 1)[0];

  // Top career matches against the profile.
  // Top 3 in carousel; "Explorează toate" leads to the full browse list.
  const topMatches = (hasProfile && profileApi)
    ? profileApi.scoreCareers(userProfile, careers).slice(0, 3)
    : [];

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      {/* header */}
      <div style={{ padding: '8px 20px 24px' }}>
        <div className="h-lg">Vibe-urile tale</div>
        <div className="body-md" style={{ color: 'var(--ink-soft)', marginTop: 4 }}>
          {hasProfile ? 'Profilul tău se construiește din quiz-uri și teste. Cariere care ți se potrivesc, mai jos.' : 'Cariere salvate. Reia quiz-ul oricând vrei.'}
        </div>
      </div>

      {/* profile card — derived from quiz + tests */}
      <div style={{ padding: '0 20px 24px' }}>
        <div className="card card-pop" style={{ padding: 20, background: 'var(--purple)', color: '#fff' }}>
          {!hasProfile ? (
            <>
              <div className="h-sm" style={{ color: '#fff' }}>Profil în formare</div>
              <div className="body-sm" style={{ opacity: 0.92, marginTop: 6 }}>
                Răspunde la un quiz sau un test ca să-ți construim profilul. Apoi îți arătăm cariere care chiar ți se potrivesc.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={onRetake} className="btn" style={{ background: 'var(--yellow)', color: '#000' }}>QUIZ RAPID →</button>
                {onPickTest && (
                  <button onClick={() => onPickTest('ipip-neo')} className="btn" style={{ background: '#000', color: '#fff' }}>IPIP-NEO-60 →</button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="label-bold" style={{ color: 'var(--yellow)', marginBottom: 6 }}>PROFILUL TĂU</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                {topRiasec.map(([code, count], i) => (
                  <span key={code} style={{
                    fontSize: 12, fontWeight: 800, padding: '4px 10px',
                    background: i === 0 ? 'var(--yellow)' : '#fff', color: '#000',
                    border: '2px solid #000', letterSpacing: '.04em',
                  }}>{code} · {RIASEC_NAMES[code]}</span>
                ))}
              </div>
              {topPath && (
                <div className="body-sm" style={{ opacity: 0.92, marginBottom: 6 }}>
                  Drum preferat: <b style={{ background: 'var(--green)', color: '#000', padding: '0 6px' }}>{PATH_NAMES[topPath[0]] || topPath[0]}</b>
                </div>
              )}
              {big5 && userProfile.big5_source && (
                <div className="label-sm" style={{ opacity: 0.85 }}>
                  Big Five: O {big5.O}% · C {big5.C}% · E {big5.E}% · A {big5.A}% · N {big5.N}% · ({userProfile.big5_source === 'ipip-neo-60' ? 'IPIP-NEO-60' : 'test scurt'})
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '2px solid #000', padding: '8px 10px' }}>
                  <div className="label-sm" style={{ color: 'var(--yellow)', fontSize: 10 }}>TESTE FĂCUTE</div>
                  <div className="h-sm" style={{ color: '#fff', marginTop: 2 }}>{sources.length}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '2px solid #000', padding: '8px 10px' }}>
                  <div className="label-sm" style={{ color: 'var(--yellow)', fontSize: 10 }}>SALVATE</div>
                  <div className="h-sm" style={{ color: '#fff', marginTop: 2 }}>{saved.length}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '2px solid #000', padding: '8px 10px' }}>
                  <div className="label-sm" style={{ color: 'var(--yellow)', fontSize: 10 }}>MATCHES</div>
                  <div className="h-sm" style={{ color: '#fff', marginTop: 2 }}>{topMatches.length}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* top matches from profile — top 3 in horizontal carousel + explore-more.
          Saves vertical space vs. the old stacked list. */}
      {hasProfile && topMatches.length > 0 && (
        <div style={{ paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, padding: '0 20px' }}>
            <div className="h-md">Pentru tine</div>
            {onExplore && (
              <button onClick={onExplore} className="label-bold" style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'var(--purple)' }}>
                EXPLOREAZĂ TOATE →
              </button>
            )}
          </div>
          <div
            style={{
              display: 'flex', gap: 12,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollPaddingLeft: 20,
              padding: '4px 20px 8px',
              WebkitOverflowScrolling: 'touch',
              // Hide scrollbar visually (still functional, fingers know).
              scrollbarWidth: 'none',
            }}
          >
            {topMatches.map((m, i) => (
              <button
                key={m.career.id}
                onClick={() => onPickCareer(m.career.id)}
                className="card"
                style={{
                  flex: '0 0 78%',           // each card = ~78% of viewport, peek of next
                  scrollSnapAlign: 'start',
                  display: 'flex', flexDirection: 'column',
                  padding: 16, minHeight: 160,
                  background: i === 0 ? 'var(--yellow)' : '#fff',
                  textAlign: 'left',
                  font: 'inherit', cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, flexShrink: 0,
                    background: colors[m.career.color], border: '2px solid #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: m.career.color === 'purple' ? '#fff' : '#000',
                  }}>{m.career.emoji}</div>
                  <span style={{
                    fontSize: 11, fontWeight: 900, padding: '3px 8px',
                    background: '#000', color: 'var(--green)',
                    fontFamily: 'JetBrains Mono, monospace',
                    marginLeft: 'auto',
                  }}>{m.score}%</span>
                </div>
                <div className="h-sm" style={{ fontSize: 16, marginTop: 12, lineHeight: 1.2 }}>{m.career.name}</div>
                <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.35 }}>{m.career.tagline}</div>
                <div style={{
                  marginTop: 'auto', paddingTop: 12,
                  fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
                  color: 'var(--purple)',
                }}>VEZI MAI MULT →</div>
              </button>
            ))}
            {/* Explore-more end-card — always visible, regardless of count */}
            {onExplore && (
              <button
                onClick={onExplore}
                className="card"
                style={{
                  flex: '0 0 64%',
                  scrollSnapAlign: 'start',
                  display: 'flex', flexDirection: 'column',
                  padding: 16, minHeight: 160,
                  background: 'var(--paper-2)',
                  textAlign: 'left',
                  font: 'inherit', cursor: 'pointer',
                  borderStyle: 'dashed',
                }}
              >
                <div style={{ fontSize: 32 }}>＋</div>
                <div className="h-sm" style={{ fontSize: 16, marginTop: 8, lineHeight: 1.2 }}>Explorează tot</div>
                <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 6, lineHeight: 1.35 }}>
                  Vezi toate cariere în ordinea potrivirii cu profilul tău.
                </div>
                <div style={{
                  marginTop: 'auto', paddingTop: 12,
                  fontSize: 11, fontWeight: 800, letterSpacing: '.04em',
                  color: 'var(--purple)',
                }}>EXPLOREAZĂ →</div>
              </button>
            )}
          </div>
        </div>
      )}

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
