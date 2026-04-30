// Vocational Deep — O*NET Interest Profiler · 60 itemi · validat US Dept of Labor.
// Likert 1-5 ("Foarte mult NU" → "Foarte mult DA"). Each item maps to one
// of R/I/A/S/E/C. Output: { raw: {R, I, A, S, E, C} } where each is the
// average rating for that code (1.0 - 5.0). The matching algorithm in
// app.jsx treats this as overriding the light 12-item vocational test
// when both are taken.
function VocationalDeepScreen({ onComplete, onBack }) {
  const data = window.QUIZ_DATA && window.QUIZ_DATA.vocationalDeep;
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
        const scores = computeVocationalDeep(next, data);
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
        <div className="anim-wiggle" style={{ width: 120, height: 120, background: 'var(--green)', border: '2px solid #000', borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56, boxShadow: '6px 6px 0 #000' }}>◉</div>
        <div className="h-lg" style={{ marginTop: 24, textAlign: 'center' }}>Calculez codul Holland validat…</div>
        <div className="body-sm" style={{ marginTop: 12, textAlign: 'center', color: 'var(--ink-soft)' }}>Bazat pe 60 de răspunsuri.</div>
      </div>
    );
  }

  const labels = ['Foarte PUȚIN', 'Puțin', 'Indiferent', 'Mult', 'Foarte MULT'];
  const cur = responses[item.id];

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <button className="btn btn-icon" onClick={onBack} style={{ background: '#fff' }}>←</button>
        <div className="progress" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
        <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{idx + 1}/{total}</div>
      </div>

      <div className="sticker sticker-purple tilt-l" style={{ alignSelf: 'flex-start', marginBottom: 16, background: '#000', color: 'var(--green)' }}>
        O*NET · VOCAȚIONAL APROFUNDAT
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="label-bold" style={{ color: 'var(--ink-soft)', marginBottom: 12 }}>CÂT DE MULT ȚI-AR PLĂCEA SĂ FACI ASTA?</div>
        <div className="h-md" style={{ marginBottom: 28, textWrap: 'pretty', lineHeight: 1.2 }}>
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
        Atinge un număr. Următoarea apare automat.
      </div>
    </div>
  );
}

// Compute average rating per RIASEC code → returns { raw: {R, I, A, S, E, C} }
// where each value is in [1.0, 5.0]. The matching algorithm reads this as
// the "validated" RIASEC profile and gives it higher weight than the
// light 12-item forced-choice test.
function computeVocationalDeep(responses, data) {
  const sums = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  data.items.forEach((it) => {
    const raw = responses[it.id] || 3;  // default to neutral if skipped
    sums[it.code] += raw;
    counts[it.code]++;
  });
  const raw = {};
  Object.keys(sums).forEach((k) => {
    raw[k] = counts[k] > 0 ? (sums[k] / counts[k]) : 3;
  });
  return { raw };
}

window.VocationalDeepScreen = VocationalDeepScreen;
window.computeVocationalDeep = computeVocationalDeep;
