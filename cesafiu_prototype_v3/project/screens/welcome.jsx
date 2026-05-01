// Welcome screen — neo-brutal hi-energy entry with test mode picker
function WelcomeScreen({ onStart, onPickTest, onExplore, layout }) {
  if (layout === 'magazine') return <WelcomeMagazine onStart={onStart} onPickTest={onPickTest} onExplore={onExplore} />;
  if (layout === 'minimal') return <WelcomeMinimal onStart={onStart} onPickTest={onPickTest} onExplore={onExplore} />;
  return <WelcomeDefault onStart={onStart} onPickTest={onPickTest} onExplore={onExplore} />;
}

// Secondary CTA — for users who don't want a quiz, just browse the library.
// Visually different from the TestModeRail so it reads as an alternative path.
// Ported from v1 welcome.jsx (was lost when phase1 migrated to v3).
function ExploreShortcut({ onExplore }) {
  if (!onExplore) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '4px 0 12px', color: 'var(--ink-soft)',
      }}>
        <div style={{ flex: 1, height: 2, background: '#000', opacity: 0.15 }}></div>
        <span className="label-sm" style={{ fontWeight: 800, letterSpacing: '.08em' }}>SAU</span>
        <div style={{ flex: 1, height: 2, background: '#000', opacity: 0.15 }}></div>
      </div>
      <button
        onClick={onExplore}
        className="card"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 14,
          background: '#fff', border: '2px solid #000', cursor: 'pointer',
          textAlign: 'left', font: 'inherit',
        }}
      >
        <div style={{
          width: 40, height: 40, background: 'var(--yellow)', border: '2px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>⌕</div>
        <div style={{ flex: 1 }}>
          <div className="h-sm" style={{ fontSize: 15 }}>Explorează direct toate opțiunile</div>
          <div className="label-sm" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>
            Cariere · trasee · universități · fără quiz
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>→</div>
      </button>
    </div>
  );
}

function TestModeRail({ onStart, onPickTest }) {
  // Order = the natural progression each step refines the recommendation:
  // 1. Quick quiz (top of funnel)
  // 2. Vocațional light (12-item Holland, sharpens RIASEC)
  // 3. Personalitate scurt (15-item Big Five, adds a different signal type)
  // 4. Vocațional aprofundat (60-item O*NET, validated; overrides #2)
  // 5. IPIP-NEO-60 (60-item validated Big Five; overrides #3)
  // The two „validated" tiers (deep Holland + IPIP-NEO-60) share black bg
  // so they read as „the deep / scientific layer" visually.
  const tests = [
    { id: 'quick',           label: 'QUIZ rapid',            sub: '6 întrebări · 90s',                            bg: 'var(--purple)', color: '#fff',         onClick: onStart, emoji: '✦' },
    { id: 'vocational',      label: 'Vocațional (scurt)',    sub: 'Cod Holland · 18 itemi · 4 min',               bg: 'var(--yellow)', color: '#000',         onClick: () => onPickTest('vocational'), emoji: '◉' },
    { id: 'personality',     label: 'Personalitate (scurt)', sub: 'Big Five · 15 itemi · 4 min',                  bg: 'var(--green)',  color: '#000',         onClick: () => onPickTest('personality'), emoji: '◆' },
    { id: 'vocational-deep', label: 'Vocațional validat ✓',  sub: 'O*NET (US Dept Labor) · 60 itemi · 8-10 min',  bg: '#000',          color: 'var(--yellow)', onClick: () => onPickTest('vocational-deep'), emoji: '◉' },
    { id: 'ipip-neo',        label: 'IPIP-NEO-60 ✓',         sub: 'Big Five validat științific · 60 itemi · 12 min', bg: '#000',       color: '#fff',         onClick: () => onPickTest('ipip-neo'), emoji: '✓' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
      {tests.map((t, i) => (
        <button
          key={t.id}
          onClick={t.onClick}
          className="card"
          style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: 14, textAlign: 'left',
            background: t.bg, color: t.color, font: 'inherit', cursor: 'pointer',
            transform: i === 0 ? 'rotate(-0.5deg)' : i === 2 ? 'rotate(0.5deg)' : 'none',
          }}
        >
          <div style={{
            width: 48, height: 48, background: '#fff', border: '2px solid #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
            color: '#000', flexShrink: 0,
          }}>{t.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="h-sm" style={{ fontSize: 16, color: 'inherit' }}>{t.label}</div>
            <div className="label-sm" style={{ marginTop: 2, opacity: 0.85 }}>{t.sub}</div>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>→</div>
        </button>
      ))}
    </div>
  );
}

function WelcomeDefault({ onStart, onPickTest, onExplore }) {
  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, padding: '0 20px 24px' }}>
      <div className="sticker tilt-l-3" style={{ position: 'absolute', top: 16, right: 28, background: '#fff', zIndex: 3 }}>
        <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--green-deep)', display: 'inline-block' }}></span>
        FĂRĂ ROBOTI
      </div>
      <div className="sticker sticker-purple tilt-r-3" style={{ position: 'absolute', top: 64, left: 24, zIndex: 3 }}>
        3 TESTE · LA ALEGEREA TA
      </div>

      <div style={{ marginTop: 100, position: 'relative' }}>
        <div className="h-xl" style={{ fontSize: 48, color: 'var(--ink)' }}>
          Ce<br/>
          <span style={{ background: 'var(--yellow)', padding: '0 8px', border: '2px solid #000', boxShadow: '4px 4px 0 #000', display: 'inline-block', transform: 'rotate(-1deg)', margin: '6px 0' }}>să fiu</span>
          <br/>când mă<br/>
          <span style={{ display: 'inline-block', position: 'relative' }}>
            <span style={{ position: 'relative', zIndex: 2 }}>fac mare?</span>
            <span style={{ position: 'absolute', bottom: 4, left: -4, right: -4, height: 14, background: 'var(--green)', zIndex: 1, transform: 'skewX(-12deg)' }}></span>
          </span>
        </div>
      </div>

      <div className="body-md" style={{ marginTop: 20, color: 'var(--ink-soft)', fontWeight: 500 }}>
        Descoperă ce ți se potrivește, fără stres.<br/>
        Quiz-uri rapide + idei reale: facultate, meserii, freelancing.
      </div>

      <TestModeRail onStart={onStart} onPickTest={onPickTest} />

      <ExploreShortcut onExplore={onExplore} />

      <div style={{ marginTop: 18, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex' }}>
          {['#FFE170', '#A9F900', '#8455ef', '#fff'].map((c, i) => (
            <div key={i} style={{ width: 26, height: 26, borderRadius: 99, background: c, border: '2px solid #000', marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i }}></div>
          ))}
        </div>
        <span className="body-sm" style={{ fontWeight: 700 }}>+12.847 elevi</span>
      </div>
    </div>
  );
}

function WelcomeMagazine({ onStart, onPickTest, onExplore }) {
  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0 }}>
      <div style={{ background: 'var(--purple)', borderBottom: '2px solid #000', padding: '20px 24px 32px', position: 'relative' }}>
        <div className="label-bold" style={{ color: 'var(--yellow)', marginBottom: 12 }}>EDIȚIA #001 · ROMÂNIA</div>
        <div className="h-xl" style={{ color: '#fff', fontSize: 50 }}>
          CARE-I<br/>DRUMUL<br/>TĂU<span style={{ color: 'var(--yellow)' }}>?</span>
        </div>
        <div style={{ position: 'absolute', bottom: -16, right: 24, background: 'var(--green)', border: '2px solid #000', boxShadow: '4px 4px 0 #000', padding: '8px 14px', fontWeight: 800, fontSize: 13, transform: 'rotate(-3deg)' }}>NOU · 2026</div>
      </div>
      <div style={{ padding: '24px 24px 24px' }}>
        <div className="body-md" style={{ fontWeight: 600 }}>
          3 teste, o bibliotecă, fără bullshit corporate.
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, border: '2px solid #000', padding: 10, textAlign: 'center', background: '#fff' }}>
            <div className="h-sm">5</div><div className="label-sm">teste</div>
          </div>
          <div style={{ flex: 1, border: '2px solid #000', padding: 10, textAlign: 'center', background: 'var(--yellow)' }}>
            <div className="h-sm">15+</div><div className="label-sm">cariere</div>
          </div>
          <div style={{ flex: 1, border: '2px solid #000', padding: 10, textAlign: 'center', background: 'var(--green)' }}>
            <div className="h-sm">18</div><div className="label-sm">univ.</div>
          </div>
        </div>
        <TestModeRail onStart={onStart} onPickTest={onPickTest} />
        <ExploreShortcut onExplore={onExplore} />
      </div>
    </div>
  );
}

function WelcomeMinimal({ onStart, onPickTest, onExplore }) {
  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, padding: '36px 32px 24px' }}>
      <div className="label-bold" style={{ color: 'var(--purple)' }}>· CESAFIU ·</div>
      <div className="h-xl" style={{ marginTop: 30, fontSize: 42 }}>
        Hei. Stai jos.<br/>
        <span style={{ background: 'var(--green)', padding: '0 6px' }}>Te ascult.</span>
      </div>
      <div className="body-md" style={{ marginTop: 16, color: 'var(--ink-soft)' }}>
        3 teste de profunzimi diferite. Tu alegi cât de adânc vrei să mergi.
      </div>
      <TestModeRail onStart={onStart} onPickTest={onPickTest} />
      <ExploreShortcut onExplore={onExplore} />
    </div>
  );
}

window.WelcomeScreen = WelcomeScreen;
