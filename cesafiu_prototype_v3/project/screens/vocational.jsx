// Vocational test (RIASEC / Holland · Quick-Sort 20 items · Likert 1-5).
// Replaces the older 12-item forced-choice format on 2026-04-30. Better signal
// per item (intensity, not just preference), no artificial trade-offs between
// codes, clean 1:1 item-to-code mapping.
// Output shape stays compatible: { raw: {R,I,A,S,E,C}, top: [{code, score}] }
// where raw values are sums of 3 Likert ratings per code (range 3..15).
// signalsRaw keeps only above-neutral answers for clearer matching.
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
        const scores = computeRIASEC(next, data);
        setDone(true);
        setTimeout(() => onComplete(scores), 800);
      } else {
        setIdx(idx + 1);
      }
    }, 180);
  };

  const handleBack = () => {
    if (idx === 0) {
      onBack();
      return;
    }
    setIdx(idx - 1);
  };

  if (done) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="anim-wiggle" style={{ width: 120, height: 120, background: 'var(--yellow)', border: '2px solid #000', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, boxShadow: '6px 6px 0 #000' }}>◉</div>
        <div className="h-lg" style={{ marginTop: 24, textAlign: 'center' }}>Calculez codul tău…</div>
        <div className="body-sm" style={{ marginTop: 12, textAlign: 'center', color: 'var(--ink-soft)' }}>Bazat pe 20 răspunsuri.</div>
      </div>
    );
  }

  const labels = ['Foarte PUȚIN', 'Puțin', 'Indiferent', 'Mult', 'Foarte MULT'];
  const cur = responses[item.id];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="btn btn-icon" onClick={handleBack} style={{ background: '#fff' }}>←</button>
        <div className="progress" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
        <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{idx + 1}/{total}</div>
      </div>

      <div className="sticker sticker-green tilt-r" style={{ alignSelf: 'flex-start', marginBottom: 16 }}>
        VOCAȚIONAL · COD HOLLAND
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="label-bold" style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>CÂT DE MULT ȚI-AR PLĂCEA SĂ FACI ASTA?</div>
        <div className="h-md" style={{ marginBottom: 28, textWrap: 'pretty', lineHeight: 1.25 }}>
          „{item.text}"
        </div>

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
        Apasă un număr și treci la următoarea întrebare.
      </div>
    </div>
  );
}

function addItemSignals(tally, signals, weight) {
  if (!Array.isArray(signals) || weight <= 0) return;
  signals.forEach((signal) => {
    tally[signal] = (tally[signal] || 0) + weight;
  });
}

// Sum Likert ratings per RIASEC code → returns { raw, top, signalsRaw }.
// raw[code] = sum of 3 ratings (range 3..15). Default to 3 (neutral) if skipped.
function computeRIASEC(responses, data) {
  const sums = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const signalsRaw = {};
  data.items.forEach((it) => {
    const v = responses[it.id];
    const raw = (typeof v === 'number') ? v : 3;
    sums[it.code] += raw;
    addItemSignals(signalsRaw, it.signals, Math.max(0, raw - 3));
  });
  // top 3 codes
  const sorted = Object.entries(sums).sort((a, b) => b[1] - a[1]);
  return {
    raw: sums,
    code: sorted.slice(0, 3).map((x) => x[0]).join(''),
    top: sorted.slice(0, 3).map(([k, v]) => ({ code: k, score: v })),
    signalsRaw,
  };
}

window.VocationalScreen = VocationalScreen;
window.computeRIASEC = computeRIASEC;
