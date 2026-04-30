// Quiz screen — neo-brutal, tap-to-select, with "stamp" animation on selection
function QuizScreen({ question, qIndex, total, selected, onSelect, onNext, onBack, layout }) {
  if (layout === 'cards') return <QuizCards question={question} qIndex={qIndex} total={total} selected={selected} onSelect={onSelect} onNext={onNext} onBack={onBack} />;
  if (layout === 'split') return <QuizSplit question={question} qIndex={qIndex} total={total} selected={selected} onSelect={onSelect} onNext={onNext} onBack={onBack} />;
  return <QuizDefault question={question} qIndex={qIndex} total={total} selected={selected} onSelect={onSelect} onNext={onNext} onBack={onBack} />;
}

function QuizDefault({ question, qIndex, total, selected, onSelect, onNext, onBack }) {
  const progress = ((qIndex + (selected ? 1 : 0)) / total) * 100;
  const stickerBg = { yellow: 'var(--yellow)', green: 'var(--green)', purple: 'var(--purple)' }[question.stickerColor];
  const stickerColor = question.stickerColor === 'purple' ? '#fff' : '#000';

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
      {/* progress + back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-icon" onClick={onBack} style={{ background: '#fff', flexShrink: 0 }}>←</button>
        <div className="progress" style={{ flex: 1 }}>
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{qIndex + 1}/{total}</div>
      </div>

      <div className="sticker tilt-l" style={{ background: stickerBg, color: stickerColor, alignSelf: 'flex-start', marginBottom: 20 }}>
        Q · {question.sticker}
      </div>

      <div className="h-lg" style={{ marginBottom: 8, textWrap: 'pretty' }}>{question.title}</div>
      <div className="body-md" style={{ color: 'var(--ink-soft)', marginBottom: 24 }}>{question.subtitle}</div>

      {/* flex:1 + minHeight:0 + overflowY:auto so on questions with long titles
          the options container shrinks/scrolls instead of pushing the next
          button below the bottom of the phone frame (where it became invisible
          and unreachable on Q5/Q6). */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {question.options.map((opt, i) => {
          const isSel = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="card"
              style={{
                position: 'relative',
                padding: '16px 16px',
                textAlign: 'left',
                background: isSel ? 'var(--yellow)' : '#fff',
                cursor: 'pointer',
                transform: isSel ? `translate(4px, 4px) rotate(${i % 2 ? -0.5 : 0.5}deg)` : 'none',
                boxShadow: isSel ? '0 0 0 0 #000' : '4px 4px 0 0 #000',
                transition: 'transform .12s, box-shadow .12s, background .12s',
                font: 'inherit',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{
                width: 32, height: 32, flexShrink: 0,
                border: '2px solid #000', borderRadius: 99,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isSel ? 'var(--purple)' : '#fff',
                color: isSel ? '#fff' : '#000',
                fontWeight: 800, fontSize: 14,
              }}>{String.fromCharCode(65 + i)}</div>
              <div style={{ flex: 1 }}>
                <div className="body-md" style={{ fontWeight: 600, lineHeight: 1.35 }}>{opt.label}</div>
                <div className="label-sm" style={{ marginTop: 4, color: 'var(--ink-soft)' }}>#{opt.tag}</div>
              </div>
              {isSel && (
                <div className="anim-stamp" style={{
                  position: 'absolute', top: -10, right: -10, width: 38, height: 38,
                  background: 'var(--green)', border: '2px solid #000', borderRadius: 99,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, fontWeight: 900, transform: 'rotate(8deg)',
                  boxShadow: '2px 2px 0 0 #000',
                }}>✓</div>
              )}
            </button>
          );
        })}
      </div>

      <button
        className="btn btn-primary btn-lg"
        onClick={onNext}
        disabled={!selected}
        style={{
          marginTop: 16, width: '100%',
          flexShrink: 0,
          opacity: selected ? 1 : 0.4,
          cursor: selected ? 'pointer' : 'not-allowed',
        }}
      >
        {qIndex === total - 1 ? 'VEZI REZULTATUL →' : 'CE URMEAZĂ? →'}
      </button>
    </div>
  );
}

function QuizCards({ question, qIndex, total, selected, onSelect, onNext, onBack }) {
  // Tinder-style stack feel — overlapping cards with offsets
  const progress = ((qIndex + (selected ? 1 : 0)) / total) * 100;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '0 20px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-icon" onClick={onBack} style={{ background: '#fff' }}>←</button>
        <div className="progress" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
      </div>
      <div className="h-md" style={{ marginBottom: 4 }}>Întrebarea {qIndex + 1} / {total}</div>
      <div className="h-lg" style={{ marginBottom: 24 }}>{question.title}</div>
      <div style={{ position: 'relative', flex: 1 }}>
        {question.options.map((opt, i) => {
          const isSel = selected === opt.id;
          const rot = [-3, 1.5, -1.5, 3][i];
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="card"
              style={{
                position: 'absolute',
                top: i * 76, left: i % 2 ? 16 : 0, right: i % 2 ? 0 : 16,
                padding: 18,
                background: isSel ? 'var(--green)' : '#fff',
                transform: `rotate(${rot}deg) ${isSel ? 'scale(1.04)' : ''}`,
                zIndex: isSel ? 10 : i,
                textAlign: 'left',
                font: 'inherit',
                cursor: 'pointer',
                transition: 'transform .15s',
              }}
            >
              <div className="label-sm" style={{ color: 'var(--purple)', marginBottom: 4 }}>#{opt.tag}</div>
              <div className="body-md" style={{ fontWeight: 700 }}>{opt.label}</div>
            </button>
          );
        })}
      </div>
      <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!selected} style={{ width: '100%', marginTop: 12, opacity: selected ? 1 : 0.4 }}>
        CE URMEAZĂ? →
      </button>
    </div>
  );
}

function QuizSplit({ question, qIndex, total, selected, onSelect, onNext, onBack }) {
  const progress = ((qIndex + (selected ? 1 : 0)) / total) * 100;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* top half = question, bottom = options grid */}
      <div style={{ background: 'var(--purple)', color: '#fff', padding: '20px 20px 32px', borderBottom: '2px solid #000' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <button onClick={onBack} className="btn btn-icon" style={{ background: '#fff' }}>←</button>
          <div className="progress" style={{ flex: 1, background: 'var(--purple-light)' }}>
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="label-bold" style={{ color: 'var(--yellow)' }}>{question.sticker}</div>
        <div className="h-lg" style={{ color: '#fff', marginTop: 12 }}>{question.title}</div>
      </div>
      <div style={{ flex: 1, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {question.options.map((opt) => {
          const isSel = selected === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className="card"
              style={{
                padding: 14, textAlign: 'left',
                background: isSel ? 'var(--yellow)' : '#fff',
                font: 'inherit', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: 130,
                transform: isSel ? 'translate(2px, 2px)' : 'none',
                boxShadow: isSel ? '2px 2px 0 #000' : '4px 4px 0 #000',
              }}
            >
              <div className="body-sm" style={{ fontWeight: 700, lineHeight: 1.3 }}>{opt.label}</div>
              <div className="label-sm" style={{ color: 'var(--purple)', marginTop: 8 }}>#{opt.tag}</div>
            </button>
          );
        })}
      </div>
      <div style={{ padding: 20 }}>
        <button className="btn btn-primary btn-lg" onClick={onNext} disabled={!selected} style={{ width: '100%', opacity: selected ? 1 : 0.4 }}>
          CE URMEAZĂ? →
        </button>
      </div>
    </div>
  );
}

window.QuizScreen = QuizScreen;
