// Vocational test (RIASEC / Holland) — forced-choice between two activities
function VocationalScreen({ onComplete, onBack }) {
  const data = window.QUIZ_DATA && window.QUIZ_DATA.vocational;
  if (!data) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="h-sm">Încarc datele…</div>
          <button onClick={onBack} className="btn" style={{ marginTop: 12 }}>← Înapoi</button>
        </div>
      </div>
    );
  }
  const [idx, setIdx] = React.useState(0);
  const [picks, setPicks] = React.useState({});
  const [done, setDone] = React.useState(false);

  const item = data.items[idx];
  const total = data.items.length;
  const progress = ((idx + (picks[item?.id] ? 1 : 0)) / total) * 100;

  const choose = (side) => {
    const next = { ...picks, [item.id]: side };
    setPicks(next);
    setTimeout(() => {
      if (idx === total - 1) {
        const scores = computeRIASEC(next, data);
        setDone(true);
        setTimeout(() => onComplete(scores), 800);
      } else {
        setIdx(idx + 1);
      }
    }, 220);
  };

  if (done) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="anim-wiggle" style={{ width: 120, height: 120, background: 'var(--yellow)', border: '2px solid #000', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, boxShadow: '6px 6px 0 #000' }}>◉</div>
        <div className="h-lg" style={{ marginTop: 24, textAlign: 'center' }}>Calculez codul tău…</div>
      </div>
    );
  }

  const cur = picks[item.id];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="btn btn-icon" onClick={onBack} style={{ background: '#fff' }}>←</button>
        <div className="progress" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
        <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{idx + 1}/{total}</div>
      </div>

      <div className="sticker sticker-green tilt-r" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
        VOCAȚIONAL · HOLLAND
      </div>

      <div className="h-md" style={{ marginBottom: 6 }}>Care îți sună mai distractiv?</div>
      <div className="body-md" style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>
        Nu „care e mai potrivită". Care te-ar atrage primul.
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
        {[
          { side: 'a', opt: item.a },
          { side: 'b', opt: item.b },
        ].map(({ side, opt }) => {
          const isSel = cur === side;
          return (
            <button
              key={side}
              onClick={() => choose(side)}
              className="card"
              style={{
                padding: '24px 18px', textAlign: 'left',
                background: isSel ? 'var(--yellow)' : '#fff',
                font: 'inherit', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 16,
                transform: isSel ? 'translate(3px, 3px)' : 'none',
                boxShadow: isSel ? '0 0 0 #000' : '4px 4px 0 #000',
                transition: 'all .15s',
              }}
            >
              <div style={{
                width: 48, height: 48, flexShrink: 0,
                border: '2px solid #000', borderRadius: 99,
                background: isSel ? 'var(--purple)' : 'var(--paper-2)',
                color: isSel ? '#fff' : '#000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 20, fontFamily: 'Epilogue',
              }}>{side.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div className="body-md" style={{ fontWeight: 700, lineHeight: 1.3 }}>{opt.text}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="body-sm" style={{ textAlign: 'center', color: 'var(--ink-soft)', marginTop: 8 }}>
        Prima reacție. Fără gândit prea mult.
      </div>
    </div>
  );
}

function computeRIASEC(picks, data) {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  data.items.forEach((it) => {
    const side = picks[it.id];
    if (!side) return;
    const code = it[side].code;
    scores[code]++;
  });
  // top 3 codes
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return {
    raw: scores,
    code: sorted.slice(0, 3).map((x) => x[0]).join(''),
    top: sorted.slice(0, 3).map(([k, v]) => ({ code: k, score: v })),
  };
}

window.VocationalScreen = VocationalScreen;
window.computeRIASEC = computeRIASEC;
