// Browse — Cariere / Universități / Trasee with filters
function BrowseScreen({ section, onChangeSection, onPickCareer, onPickPath, onPickUni }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '4px 20px 12px' }}>
        <div className="h-lg">Explorează</div>
        <div className="body-md" style={{ color: 'var(--ink-soft)', marginTop: 4 }}>
          Vezi toate variantele, nu doar cele care îți ies la quiz.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 20px 12px' }}>
        {[
          { id: 'careers', label: 'Cariere' },
          { id: 'paths', label: 'Trasee' },
          { id: 'unis', label: 'Universități' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => onChangeSection(t.id)}
            className="chip"
            aria-selected={section === t.id}
            style={{ flex: 1 }}
          >{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        {section === 'careers' && <BrowseCareers onPick={onPickCareer} />}
        {section === 'paths' && <BrowsePaths onPick={onPickPath} />}
        {section === 'unis' && <BrowseUnis onPick={onPickUni} />}
      </div>
    </div>
  );
}

// ── CAREERS ──
function BrowseCareers({ onPick }) {
  const careers = window.QUIZ_DATA.careers;
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const filters = [
    { id: 'all', label: 'Toate' },
    { id: 'facultate', label: 'Facultate' },
    { id: 'profesional', label: 'Școală profesională' },
    { id: 'autodidact', label: 'Autodidact' },
    { id: 'antreprenor', label: 'Antreprenor' },
    { id: 'mixt', label: 'Mixt' },
  ];

  const filtered = careers.filter((c) => {
    if (filter !== 'all' && c.pathType !== filter) return false;
    if (search && !(c.name + c.tagline + c.description).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };
  const pathLabel = { facultate: 'FAC', autodidact: 'AUTO', antreprenor: 'ENTRE', mixt: 'MIX', bootcamp: 'BOOT', profesional: 'PROF', creator: 'CREATOR', freelance: 'FREE' };
  const pathColor = { facultate: '#fff', autodidact: 'var(--green)', antreprenor: 'var(--purple)', mixt: 'var(--yellow)', bootcamp: 'var(--green)', profesional: 'var(--yellow)', creator: 'var(--green)', freelance: 'var(--yellow)' };
  const pathTextC = { facultate: '#000', autodidact: '#000', antreprenor: '#fff', mixt: '#000', bootcamp: '#000', profesional: '#000', creator: '#000', freelance: '#000' };

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 24 }}>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{ position: 'relative' }}>
          <input
            className="input"
            placeholder="Caută o carieră..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingRight: 40 }}
          />
          <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>⌕</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, padding: '0 20px 16px', overflowX: 'auto' }} className="scroll-y">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="chip"
            aria-selected={filter === f.id}
            style={{ flexShrink: 0 }}
          >{f.label}</button>
        ))}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: 'center', background: 'var(--paper-2)' }}>
            <div className="h-sm">Nimic găsit</div>
            <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 4 }}>
              Schimbă filtrul sau caută altceva.
            </div>
          </div>
        )}
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c.id)}
            className="card"
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14, padding: 14,
              textAlign: 'left', font: 'inherit', cursor: 'pointer',
              background: '#fff', position: 'relative',
            }}
          >
            <div style={{
              width: 56, height: 56, flexShrink: 0,
              background: colors[c.color], border: '2px solid #000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: c.color === 'purple' ? '#fff' : '#000',
            }}>{c.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-sm" style={{ fontSize: 17 }}>{c.name}</div>
              <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 4, textWrap: 'pretty' }}>{c.tagline}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 7px',
                  border: '2px solid #000', background: pathColor[c.pathType],
                  color: pathTextC[c.pathType], letterSpacing: '.04em',
                }}>{pathLabel[c.pathType] || c.pathType.toUpperCase()}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 7px',
                  border: '2px solid #000', background: 'var(--paper-2)',
                  color: 'var(--ink-soft)',
                }}>{c.demand}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PATHS ──
function BrowsePaths({ onPick }) {
  const paths = window.QUIZ_DATA.paths;
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 24 }}>
      <div style={{ padding: '0 20px 16px' }}>
        <div className="card" style={{ padding: 16, background: 'var(--paper-2)' }}>
          <div className="label-bold" style={{ color: 'var(--purple)' }}>{paths.length} DRUMURI · NU UNUL</div>
          <div className="body-md" style={{ marginTop: 6 }}>
            Facultatea nu e singura opțiune. Aici vezi toate variantele cu pro/contra real.
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {paths.map((p, i) => (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            className="card card-pop"
            style={{
              padding: 18, textAlign: 'left', font: 'inherit', cursor: 'pointer',
              background: colors[p.color], color: p.color === 'purple' ? '#fff' : '#000',
              transform: i % 2 ? 'rotate(0.4deg)' : 'rotate(-0.4deg)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 56, height: 56, background: '#fff', border: '2px solid #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: '#000', boxShadow: '3px 3px 0 #000',
              }}>{p.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="label-sm" style={{ opacity: 0.7 }}>{p.duration} · {p.cost}</div>
                <div className="h-md" style={{ marginTop: 2 }}>{p.name}</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>→</div>
            </div>
            <div className="body-md" style={{ marginTop: 12, fontWeight: 600, fontStyle: 'italic' }}>
              „{p.tagline}"
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── UNIVERSITIES ──
function BrowseUnis({ onPick }) {
  const unis = window.QUIZ_DATA.universities;
  const [city, setCity] = React.useState('all');
  const [tag, setTag] = React.useState('all');

  const cities = ['all', ...Array.from(new Set(unis.map((u) => u.city)))];
  const tags = ['all', 'IT', 'medicină', 'business', 'artă', 'umaniste', 'inginerie', 'antreprenoriat', 'profesional', 'autodidact'];

  const filtered = unis.filter((u) => {
    if (city !== 'all' && u.city !== city) return false;
    if (tag !== 'all' && !(u.tags || []).includes(tag)) return false;
    return true;
  });

  const tierColors = {
    TOP: 'var(--green)',
    GOOD: 'var(--yellow)',
    BOOTCAMP: 'var(--purple)',
    PROGRAM: '#000',
    TRADE: 'var(--yellow)',
    POST: '#fff',
  };
  const tierTextColor = {
    TOP: '#000', GOOD: '#000', BOOTCAMP: '#fff', PROGRAM: 'var(--green)', TRADE: '#000', POST: '#000',
  };

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 24 }}>
      <div style={{ padding: '0 20px 12px' }}>
        <div className="label-sm" style={{ color: 'var(--ink-soft)', marginBottom: 6 }}>ORAȘ</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="scroll-y">
          {cities.map((c) => (
            <button key={c} onClick={() => setCity(c)} className="chip" aria-selected={city === c} style={{ flexShrink: 0 }}>
              {c === 'all' ? 'Toate' : c}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 16px' }}>
        <div className="label-sm" style={{ color: 'var(--ink-soft)', marginBottom: 6 }}>DOMENIU</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="scroll-y">
          {tags.map((t) => (
            <button key={t} onClick={() => setTag(t)} className="chip" aria-selected={tag === t} style={{ flexShrink: 0 }}>
              {t === 'all' ? 'Toate' : t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: 'center', background: 'var(--paper-2)' }}>
            <div className="h-sm">Nimic găsit</div>
          </div>
        )}
        {filtered.map((u) => (
          <button
            key={u.id}
            onClick={() => onPick(u.id)}
            className="card"
            style={{
              padding: 14, textAlign: 'left', font: 'inherit', cursor: 'pointer',
              background: '#fff', display: 'flex', flexDirection: 'column', gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div className="h-sm" style={{ fontSize: 16 }}>{u.name}</div>
                <div className="label-sm" style={{ color: 'var(--ink-soft)', marginTop: 2 }}>{u.city} · {u.kind}</div>
              </div>
              <div style={{
                fontSize: 10, fontWeight: 900, padding: '4px 8px',
                background: tierColors[u.tier] || '#fff', color: tierTextColor[u.tier] || '#000',
                border: '2px solid #000', flexShrink: 0,
              }}>{u.tier}</div>
            </div>
            <div className="body-sm" style={{ color: 'var(--ink)', textWrap: 'pretty' }}>{u.notes}</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(u.domains || []).slice(0, 4).map((d) => (
                <span key={d} style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', background: 'var(--paper-2)', border: '2px solid #000' }}>{d}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PATH DETAIL ──
function PathDetailScreen({ pathId, onBack }) {
  const path = window.QUIZ_DATA.paths.find((p) => p.id === pathId);
  if (!path) return null;
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      <div style={{
        background: colors[path.color], color: path.color === 'purple' ? '#fff' : '#000',
        padding: '12px 20px 36px', borderBottom: '2px solid #000', position: 'relative',
      }}>
        <div style={{ marginBottom: 18 }}>
          <button onClick={onBack} className="btn btn-icon" style={{ background: '#fff', color: '#000' }}>←</button>
        </div>
        <div style={{
          width: 80, height: 80, background: '#fff', border: '2px solid #000',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 40, color: '#000', boxShadow: '4px 4px 0 #000',
          transform: 'rotate(-3deg)',
        }}>{path.emoji}</div>
        <div className="h-xl" style={{ fontSize: 40, marginTop: 16 }}>{path.name}</div>
        <div className="body-lg" style={{ marginTop: 10, fontWeight: 600, fontStyle: 'italic' }}>„{path.tagline}"</div>
      </div>

      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div className="card" style={{ padding: 14 }}>
          <div className="label-sm" style={{ color: 'var(--ink-soft)' }}>DURATĂ</div>
          <div className="h-sm" style={{ marginTop: 4, fontSize: 16 }}>{path.duration}</div>
        </div>
        <div className="card" style={{ padding: 14, background: 'var(--yellow)' }}>
          <div className="label-sm">COST</div>
          <div className="h-sm" style={{ marginTop: 4, fontSize: 16 }}>{path.cost}</div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ padding: 16, background: 'var(--green)', marginBottom: 12 }}>
          <div className="label-bold" style={{ marginBottom: 10 }}>↑ PROS</div>
          {path.pros.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ flexShrink: 0, fontWeight: 900 }}>+</div>
              <div className="body-md">{p}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="label-bold" style={{ marginBottom: 10, color: 'var(--error)' }}>↓ CONTRA</div>
          {path.cons.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ flexShrink: 0, fontWeight: 900, color: 'var(--error)' }}>−</div>
              <div className="body-md">{p}</div>
            </div>
          ))}
        </div>

        <div className="h-md" style={{ marginTop: 16, marginBottom: 10 }}>Pentru cine merge</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {path.bestFor.map((b, i) => (
            <div key={i} className="sticker" style={{
              background: i % 2 ? 'var(--yellow)' : '#fff',
              transform: `rotate(${(i % 2 ? 1 : -1) * 1.2}deg)`,
            }}>{b}</div>
          ))}
        </div>

        <div className="h-md" style={{ marginTop: 24, marginBottom: 10 }}>Pașii următori</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {path.next.map((n, i) => (
            <div key={i} className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, flexShrink: 0,
                background: 'var(--purple)', color: '#fff', border: '2px solid #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, fontSize: 13,
              }}>{i + 1}</div>
              <div className="body-md" style={{ flex: 1 }}>{n}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── UNI DETAIL ──
function UniDetailScreen({ uniId, onBack }) {
  const u = window.QUIZ_DATA.universities.find((x) => x.id === uniId);
  if (!u) return null;

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      <div style={{ padding: '12px 20px 24px' }}>
        <button onClick={onBack} className="btn btn-icon" style={{ background: '#fff', marginBottom: 18 }}>←</button>
        <div className="sticker tilt-l" style={{ background: 'var(--green)', marginBottom: 12 }}>{u.tier} · {u.kind}</div>
        <div className="h-xl" style={{ fontSize: 38, lineHeight: 1.0 }}>{u.name}</div>
        <div className="body-lg" style={{ color: 'var(--ink-soft)', marginTop: 6 }}>{u.city}</div>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ padding: 18, background: 'var(--paper-2)', marginBottom: 16 }}>
          <div className="body-md">{u.notes}</div>
        </div>

        <div className="h-md" style={{ marginBottom: 10 }}>Domenii</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {(u.domains || []).map((d, i) => (
            <div key={d} className="sticker" style={{
              background: i % 3 === 0 ? 'var(--yellow)' : i % 3 === 1 ? '#fff' : 'var(--green)',
              transform: `rotate(${(i % 2 ? 1 : -1) * 1.5}deg)`,
            }}>{d}</div>
          ))}
        </div>

        <div className="h-md" style={{ marginBottom: 10 }}>Tags</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(u.tags || []).map((t) => (
            <div key={t} style={{
              fontSize: 12, fontWeight: 700, padding: '6px 12px',
              border: '2px solid #000', background: '#fff',
            }}>#{t}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.BrowseScreen = BrowseScreen;
window.PathDetailScreen = PathDetailScreen;
window.UniDetailScreen = UniDetailScreen;
