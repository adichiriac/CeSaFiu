// Edit Profile screen — authenticated user customizes name, email, avatar, interests
// Interests auto-seed from quiz matches; user can add/remove freely.

const { useState: useEPState, useRef: useEPRef, useEffect: useEPEffect } = React;

// 8 preset avatars — neo-brutalist abstract glyphs with color combos
const PRESET_AVATARS = [
  { id: 'star',    glyph: '★', bg: 'var(--purple)', fg: '#fff' },
  { id: 'spark',   glyph: '✦', bg: 'var(--yellow)', fg: '#000' },
  { id: 'flame',   glyph: '✺', bg: '#FF7A59',       fg: '#000' },
  { id: 'eye',     glyph: '◉', bg: '#000',          fg: 'var(--yellow)' },
  { id: 'heart',   glyph: '♥', bg: 'var(--green)',  fg: '#000' },
  { id: 'lightn',  glyph: '⚡', bg: '#2A6FDB',       fg: '#fff' },
  { id: 'diamond', glyph: '◇', bg: '#fff',          fg: '#000' },
  { id: 'flower',  glyph: '✿', bg: 'var(--purple)', fg: 'var(--yellow)' },
];

// Suggestion pool of interests (used when user opens "+ ADAUGĂ")
const INTEREST_SUGGESTIONS = [
  'Design Interior', 'Arhitectură', 'Psihologie', 'Gaming', 'Sustenabilitate',
  'Marketing Social', 'Programare', 'Inteligență Artificială', 'Fotografie',
  'Muzică', 'Film', 'Antreprenoriat', 'Sport', 'Călătorii', 'Modă',
  'Gătit', 'Limbi străine', 'Voluntariat', 'Robotică', 'Astronomie',
  'Literatură', 'Teatru', 'Dans', 'Biologie', 'Matematică', 'Istorie',
  'Filozofie', 'Economie', 'Drept', 'Medicină', 'Inginerie', 'Educație',
  'Animale', 'Mediu', 'Politică', 'Jurnalism', 'Public Speaking',
];

// Build initial interest seed from user's quiz matches
function seedInterests(matches) {
  if (!matches || matches.length === 0) return ['Design Interior', 'Psihologie', 'Sustenabilitate'];
  const top = matches.slice(0, 4).map((m) => m.career.name);
  // Dedupe + cap to 5
  return Array.from(new Set(top)).slice(0, 5);
}

function AvatarPreview({ user, size = 64 }) {
  if (user.avatarKind === 'upload' && user.avatarUrl) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 0,
        border: '2px solid #000', boxShadow: '3px 3px 0 #000',
        backgroundImage: `url(${user.avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
        flexShrink: 0,
      }}></div>
    );
  }
  const preset = PRESET_AVATARS.find((a) => a.id === user.avatarId) || PRESET_AVATARS[0];
  return (
    <div style={{
      width: size, height: size, background: preset.bg, color: preset.fg,
      border: '2px solid #000', boxShadow: '3px 3px 0 #000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, fontWeight: 900, flexShrink: 0,
    }}>{preset.glyph}</div>
  );
}

function EditProfileScreen({ user, matches, onSave, onBack }) {
  const [name, setName] = useEPState(user.name || '');
  const [email, setEmail] = useEPState(user.email || '');
  const [avatarKind, setAvatarKind] = useEPState(user.avatarKind || 'preset');
  const [avatarId, setAvatarId] = useEPState(user.avatarId || 'star');
  const [avatarUrl, setAvatarUrl] = useEPState(user.avatarUrl || null);
  const [interests, setInterests] = useEPState(
    user.interests && user.interests.length ? user.interests : seedInterests(matches)
  );
  const [addOpen, setAddOpen] = useEPState(false);
  const [customInterest, setCustomInterest] = useEPState('');

  const fileRef = useEPRef(null);

  const currentUser = { name, email, avatarKind, avatarId, avatarUrl, interests };

  const removeInterest = (i) => setInterests(interests.filter((_, idx) => idx !== i));
  const addInterest = (label) => {
    const v = label.trim();
    if (!v) return;
    if (!interests.includes(v)) setInterests([...interests, v]);
    setCustomInterest('');
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target.result);
      setAvatarKind('upload');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onSave({ name, email, avatarKind, avatarId, avatarUrl, interests });
    onBack();
  };

  const suggestionsPool = INTEREST_SUGGESTIONS.filter((s) => !interests.includes(s)).slice(0, 12);

  // Color rotation for chips
  const chipBgs = ['#fff', 'var(--yellow)', '#fff', 'var(--green)', '#fff', 'var(--purple)'];
  const chipFgs = ['#000', '#000', '#000', '#000', '#000', '#fff'];

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'auto', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} className="btn btn-icon" style={{ width: 36, height: 36, fontSize: 16, background: '#fff', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }}>←</button>
        <div style={{ flex: 1 }}>
          <div className="h-md" style={{ lineHeight: 1, marginBottom: 2 }}>Editează profilul</div>
          <div className="body-sm" style={{ color: 'var(--ink-soft)' }}>Personalizează cum te vezi tu și prietenii.</div>
        </div>
      </div>

      <div style={{ padding: '8px 16px 24px' }}>
        {/* AVATAR section */}
        <div style={{
          background: 'var(--paper)', border: '2px solid #000',
          boxShadow: '4px 4px 0 #000', padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--ink-soft)', marginBottom: 12 }}>AVATAR</div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
            <AvatarPreview user={currentUser} size={72} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.1 }}>{name || 'Numele tău'}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{email || 'email@exemplu.ro'}</div>
            </div>
          </div>

          {/* Preset avatars */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
            marginBottom: 10,
          }}>
            {PRESET_AVATARS.map((a) => {
              const active = avatarKind === 'preset' && avatarId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => { setAvatarKind('preset'); setAvatarId(a.id); }}
                  style={{
                    aspectRatio: '1 / 1',
                    background: a.bg, color: a.fg,
                    border: '2px solid #000',
                    boxShadow: active ? '3px 3px 0 var(--purple)' : '2px 2px 0 #000',
                    fontSize: 28, fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    transform: active ? 'translate(-1px, -1px)' : 'none',
                  }}
                >
                  {a.glyph}
                  {active && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 18, height: 18, background: '#000', color: 'var(--green)',
                      border: '2px solid #000', borderRadius: 99,
                      fontSize: 10, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Upload button */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', background: '#000', color: '#fff',
              border: '2px solid #000', padding: '10px',
              fontWeight: 800, fontSize: 11, letterSpacing: 1,
              cursor: 'pointer', boxShadow: '2px 2px 0 var(--yellow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>↑</span>
            ÎNCARCĂ POZĂ DE PE TELEFON
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
        </div>

        {/* NAME + EMAIL */}
        <div style={{
          background: '#fff', border: '2px solid #000',
          boxShadow: '4px 4px 0 #000', padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--ink-soft)', marginBottom: 12 }}>DATELE TALE</div>

          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Nume</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Maria Popescu"
              style={{
                width: '100%', padding: '10px 12px',
                border: '2px solid #000', background: 'var(--paper)',
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.06)',
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'block' }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="maria@exemplu.ro"
              style={{
                width: '100%', padding: '10px 12px',
                border: '2px solid #000', background: 'var(--paper)',
                fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                boxShadow: 'inset 2px 2px 0 rgba(0,0,0,0.06)',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: 10, color: 'var(--ink-soft)', marginTop: 4 }}>
              Te anunțăm aici când apar oportunități pe vibe-ul tău.
            </div>
          </label>
        </div>

        {/* INTERESTS — matches the attached "CE TE ATRAGE?" mockup */}
        <div style={{
          background: 'var(--yellow)', border: '2px solid #000',
          boxShadow: '4px 4px 0 #000', padding: 16, marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>CE TE ATRAGE?</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#000', opacity: 0.6 }}>{interests.length} vibe-uri</div>
          </div>
          <div style={{ height: 2, background: '#000', marginBottom: 14 }}></div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {interests.map((tag, i) => {
              const bg = chipBgs[i % chipBgs.length];
              const fg = chipFgs[i % chipFgs.length];
              return (
                <div key={tag + i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  background: bg, color: fg,
                  border: '2px solid #000',
                  padding: '6px 4px 6px 10px',
                  fontWeight: 800, fontSize: 12,
                  boxShadow: '2px 2px 0 #000',
                }}>
                  <span>{tag}</span>
                  <button
                    onClick={() => removeInterest(i)}
                    aria-label={`Șterge ${tag}`}
                    style={{
                      width: 18, height: 18, border: 'none',
                      background: 'transparent', color: fg,
                      fontSize: 14, fontWeight: 900,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginLeft: 2,
                    }}
                  >×</button>
                </div>
              );
            })}

            <button
              onClick={() => setAddOpen(!addOpen)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#000', color: '#fff',
                border: '2px solid #000',
                padding: '6px 10px',
                fontWeight: 900, fontSize: 12, letterSpacing: 0.5,
                cursor: 'pointer', boxShadow: '2px 2px 0 var(--purple)',
              }}
            >
              {addOpen ? '× ÎNCHIDE' : '+ ADAUGĂ'}
            </button>
          </div>

          {addOpen && (
            <div style={{
              marginTop: 14, paddingTop: 14,
              borderTop: '2px dashed #000',
            }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addInterest(customInterest); }}
                  placeholder="Scrie un vibe..."
                  style={{
                    flex: 1, padding: '8px 10px',
                    border: '2px solid #000', background: '#fff',
                    fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => addInterest(customInterest)}
                  style={{
                    background: 'var(--purple)', color: '#fff',
                    border: '2px solid #000', padding: '8px 14px',
                    fontWeight: 900, fontSize: 12, cursor: 'pointer',
                    boxShadow: '2px 2px 0 #000',
                  }}
                >+</button>
              </div>

              {suggestionsPool.length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: '#000', opacity: 0.6, marginBottom: 6 }}>
                    SAU ALEGE DIN:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {suggestionsPool.map((s) => (
                      <button
                        key={s}
                        onClick={() => addInterest(s)}
                        style={{
                          background: '#fff', color: '#000',
                          border: '2px solid #000',
                          padding: '5px 9px',
                          fontWeight: 700, fontSize: 11,
                          cursor: 'pointer',
                          boxShadow: '1px 1px 0 #000',
                        }}
                      >+ {s}</button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Save row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: '#fff', color: '#000',
              border: '2px solid #000', padding: '14px',
              fontWeight: 900, fontSize: 12, letterSpacing: 1,
              cursor: 'pointer', boxShadow: '3px 3px 0 #000',
            }}
          >RENUNȚĂ</button>
          <button
            onClick={handleSave}
            style={{
              background: 'var(--purple)', color: '#fff',
              border: '2px solid #000', padding: '14px',
              fontWeight: 900, fontSize: 13, letterSpacing: 1.5,
              cursor: 'pointer', boxShadow: '3px 3px 0 #000',
            }}
          >✓ SALVEAZĂ</button>
        </div>

        <div style={{ marginTop: 12, fontSize: 10, color: 'var(--ink-soft)', textAlign: 'center' }}>
          Datele tale sunt salvate doar pe acest dispozitiv.
        </div>
      </div>
    </div>
  );
}

window.EditProfileScreen = EditProfileScreen;
window.AvatarPreview = AvatarPreview;
window.PRESET_AVATARS = PRESET_AVATARS;
