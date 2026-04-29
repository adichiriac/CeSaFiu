// Personality test (Big Five-inspired) — sliding scale, 15 statements
function PersonalityScreen({ onComplete, onBack }) {
  const data = window.QUIZ_DATA && window.QUIZ_DATA.personality;
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
  const [responses, setResponses] = React.useState({});
  const [done, setDone] = React.useState(false);

  const item = data.items[idx];
  const total = data.items.length;
  const progress = ((idx + (responses[item?.id] !== undefined ? 1 : 0)) / total) * 100;

  const submit = (val) => {
    const next = { ...responses, [item.id]: val };
    setResponses(next);
    setTimeout(() => {
      if (idx === total - 1) {
        const scores = computeBig5(next, data);
        setDone(true);
        setTimeout(() => onComplete(scores), 800);
      } else {
        setIdx(idx + 1);
      }
    }, 180);
  };

  if (done) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="anim-wiggle" style={{ width: 120, height: 120, background: 'var(--green)', border: '2px solid #000', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, boxShadow: '6px 6px 0 #000' }}>◆</div>
        <div className="h-lg" style={{ marginTop: 24, textAlign: 'center' }}>Calculez profilul…</div>
      </div>
    );
  }

  const labels = ['Total fals', 'Cam fals', 'Neutru', 'Cam adevărat', 'Total adevărat'];
  const cur = responses[item.id];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="btn btn-icon" onClick={onBack} style={{ background: '#fff' }}>←</button>
        <div className="progress" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
        <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{idx + 1}/{total}</div>
      </div>

      <div className="sticker sticker-purple tilt-l" style={{ alignSelf: 'flex-start', marginBottom: 16, background: '#000', color: 'var(--green)' }}>
        TEST PERSONALITATE
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="label-bold" style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>CÂT DE ADEVĂRAT E PENTRU TINE?</div>
        <div className="h-md" style={{ marginBottom: 28, textWrap: 'pretty', lineHeight: 1.2 }}>
          „{item.text}"
        </div>

        {/* slider visual + 5 dot buttons */}
        <div style={{ position: 'relative', padding: '0 4px' }}>
          <div style={{ position: 'absolute', top: 22, left: 26, right: 26, height: 4, background: '#000' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {[1, 2, 3, 4, 5].map((v) => {
              const active = cur === v;
              const size = v === 3 ? 36 : 44;
              return (
                <button
                  key={v}
                  onClick={() => submit(v)}
                  style={{
                    width: size, height: size, borderRadius: 99, border: '2px solid #000',
                    background: active ? 'var(--purple)' : '#fff',
                    color: active ? '#fff' : '#000',
                    boxShadow: active ? '0 0 0 #000' : '3px 3px 0 #000',
                    transform: active ? 'translate(2px, 2px)' : 'none',
                    fontWeight: 900, fontSize: 14, cursor: 'pointer',
                    transition: 'all .15s',
                    position: 'relative', zIndex: 1,
                  }}
                >{v}</button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <div className="label-sm" style={{ color: 'var(--ink-soft)' }}>{labels[0]}</div>
            <div className="label-sm" style={{ color: 'var(--ink-soft)' }}>{labels[4]}</div>
          </div>
        </div>
      </div>

      <div className="body-sm" style={{ textAlign: 'center', color: 'var(--ink-soft)' }}>
        Tap-uiește un număr. Următoarea apare automat.
      </div>
    </div>
  );
}

function computeBig5(responses, data) {
  const sums = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  const counts = { O: 0, C: 0, E: 0, A: 0, N: 0 };
  data.items.forEach((it) => {
    const raw = responses[it.id] || 3;
    const val = it.r ? 6 - raw : raw; // reverse if needed
    sums[it.dim] += val;
    counts[it.dim]++;
  });
  const scores = {};
  Object.keys(sums).forEach((k) => {
    scores[k] = Math.round((sums[k] / (counts[k] * 5)) * 100); // 0-100
  });
  return scores;
}

window.PersonalityScreen = PersonalityScreen;
window.computeBig5 = computeBig5;
