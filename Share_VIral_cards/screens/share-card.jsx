// Share card screen — viral post-quiz feature
// Generates a personalized 1080×1920 "story card" with archetype, code, top matches.
// Modes: Versiunea ta (full reveal) · Mod ghicește (hidden, friends guess) · Feed (square)

// ─── Archetype lookup ──────────────────────────────────────────────────
// 30 archetypes from top 2 RIASEC letters. Memorable Romanian names, Gen Z tone.
const ARCHETYPES = {
  RI: { name: 'CONSTRUCTORUL', glyph: '⚒', tag: 'Faci. Cu mâinile, cu mintea, cu logica.' },
  RA: { name: 'MEȘTEȘUGARUL', glyph: '✦', tag: 'Faci frumos. Cu mâinile, cu gust.' },
  RS: { name: 'ANTRENORUL', glyph: '⚡', tag: 'Construiești oameni, nu doar lucruri.' },
  RE: { name: 'FONDATORUL', glyph: '✺', tag: 'Vrei să construiești ceva ce încă nu există.' },
  RC: { name: 'INGINERUL', glyph: '⚙', tag: 'Sistemele te liniștesc. Detaliile te plac.' },
  IR: { name: 'EXPLORATORUL', glyph: '◇', tag: 'Întrebi cum și de ce. Apoi încerci.' },
  IA: { name: 'GÂNDITORUL CREATIV', glyph: '◊', tag: 'Idei + estetică = oxigenul tău.' },
  IS: { name: 'PROFESORUL', glyph: '✦', tag: 'Înveți, apoi îi înveți pe alții.' },
  IE: { name: 'INOVATORUL', glyph: '✺', tag: 'Idei mari + curaj să le pui în lume.' },
  IC: { name: 'ANALISTUL', glyph: '∆', tag: 'Datele îți spun adevărul.' },
  AR: { name: 'ARTISTUL TANGIBIL', glyph: '✦', tag: 'Frumosul trebuie să existe fizic.' },
  AI: { name: 'CERCETĂTORUL ARTISTIC', glyph: '◇', tag: 'Întrebi, dar răspunzi în culoare.' },
  AS: { name: 'POVESTITORUL', glyph: '★', tag: 'Spui povești care vindecă oameni.' },
  AE: { name: 'PERFORMERUL', glyph: '✺', tag: 'Vrei să te vadă. Și ai de ce.' },
  AC: { name: 'DESIGNERUL', glyph: '◈', tag: 'Frumos + ordonat = perfect.' },
  SR: { name: 'AJUTORUL', glyph: '♥', tag: 'Lumea funcționează pentru că tu o ții.' },
  SI: { name: 'MENTORUL', glyph: '✦', tag: 'Înveți oamenii cu răbdare și empatie.' },
  SA: { name: 'TERAPEUTUL', glyph: '◊', tag: 'Oamenii pleacă mai bine după ce vorbesc cu tine.' },
  SE: { name: 'LIDERUL EMPATIC', glyph: '⚡', tag: 'Conduci pentru că oamenii te urmează cu drag.' },
  SC: { name: 'ORGANIZATORUL', glyph: '★', tag: 'Pui ordine în haos. Calm. Eficient.' },
  ER: { name: 'ANTREPRENORUL', glyph: '✺', tag: 'Vezi probleme, apoi le rezolvi în lume.' },
  EI: { name: 'STRATEGUL', glyph: '∆', tag: 'Citești terenul înainte să joci.' },
  EA: { name: 'PRODUCĂTORUL', glyph: '★', tag: 'Combini oameni + idei + risc = magic.' },
  ES: { name: 'CONECTORUL', glyph: '✦', tag: 'Cunoști pe toată lumea. Și asta-i puterea ta.' },
  EC: { name: 'MANAGERUL', glyph: '⚡', tag: 'Sistematic. Decisiv. Eficient.' },
  CR: { name: 'TEHNICIANUL', glyph: '⚙', tag: 'Faci ca lucrurile să funcționeze. Precis.' },
  CI: { name: 'AUDITORUL', glyph: '∆', tag: 'Vezi ce alții ratează în date.' },
  CA: { name: 'EDITORUL', glyph: '◈', tag: 'Forma contează la fel ca fondul.' },
  CS: { name: 'CONSILIERUL', glyph: '★', tag: 'Ești punctul fix de care alții se sprijină.' },
  CE: { name: 'OPERATORUL', glyph: '⚡', tag: 'Faci ca afacerile să meargă perfect.' },
};

const DEFAULT_ARCH = { name: 'VOIAJORUL', glyph: '✦', tag: 'Călătoria abia începe.' };

function deriveArchetype(answers) {
  if (!answers || Object.keys(answers).length === 0) {
    return { code: '????', archetype: DEFAULT_ARCH };
  }
  const tally = {};
  Object.values(answers).forEach((opt) => {
    (opt?.riasec || []).forEach((c) => { tally[c] = (tally[c] || 0) + 1; });
  });
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return { code: '????', archetype: DEFAULT_ARCH };
  const top1 = sorted[0][0];
  const top2 = sorted[1] ? sorted[1][0] : top1;
  const key = top1 + top2;
  const archetype = ARCHETYPES[key] || ARCHETYPES[top1 + 'R'] || DEFAULT_ARCH;
  return { code: key, archetype, top1, top2 };
}
window.deriveArchetype = deriveArchetype;

// ─── Card visual (HTML, scaled) ─────────────────────────────────────────
// The card is designed as 1080×1920 conceptually. Inside the phone frame it's scaled to fit.
// `revealed` = full version. `revealed=false` = guess mode for friends.
function CardVisual({ archetype, code, score, top3, revealed = true, name = 'Tu' }) {
  return (
    <div
      id="share-card-visual"
      style={{
        // Phone-frame-relative size; conceptually 9:16
        width: '100%', aspectRatio: '9 / 16',
        background: 'var(--paper)',
        border: '2px solid #000',
        boxShadow: '4px 4px 0 #000',
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        fontFamily: '"Epilogue", sans-serif',
      }}
    >
      {/* Dotted-grid texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
        backgroundSize: '14px 14px',
        pointerEvents: 'none',
      }}></div>

      {/* Top: brand sticker rotated */}
      <div style={{ position: 'relative', padding: '12px 14px 6px', zIndex: 1 }}>
        <div style={{
          display: 'inline-block',
          background: 'var(--yellow)',
          border: '2px solid #000',
          padding: '4px 10px',
          fontWeight: 900, fontSize: 11, letterSpacing: 0.5,
          transform: 'rotate(-3deg)',
          boxShadow: '2px 2px 0 #000',
        }}>CeSăFiu?</div>
      </div>

      {/* Center: archetype */}
      <div style={{
        flex: 1, position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 18px', textAlign: 'left',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          color: 'var(--ink-soft)', marginBottom: 6,
        }}>
          {revealed ? 'EȘTI ↓' : 'GHICEȘTE CE A IEȘIT'}
        </div>

        {revealed ? (
          <>
            <div style={{
              fontSize: archetype.name.length > 16 ? 22 : (archetype.name.length > 12 ? 26 : 32),
              fontWeight: 900, lineHeight: 0.95,
              letterSpacing: -1, color: '#000',
              marginBottom: 8,
              wordBreak: 'break-word',
            }}>
              {archetype.name}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 600, lineHeight: 1.35,
              color: 'var(--ink-soft)',
              marginBottom: 14,
              fontStyle: 'italic',
            }}>
              „{archetype.tag}"
            </div>
          </>
        ) : (
          <>
            <div style={{
              fontSize: 64, fontWeight: 900, lineHeight: 0.9,
              color: 'var(--purple)',
              marginBottom: 8,
              textShadow: '2px 2px 0 #000',
            }}>
              ?????
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, lineHeight: 1.4,
              color: 'var(--ink-soft)',
              marginBottom: 14,
            }}>
              Crezi că știi ce a ieșit la {name}? Dă-i quiz-ul. 90 secunde.
            </div>
          </>
        )}

        {/* Code stamp */}
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          background: '#000', color: 'var(--yellow)',
          border: '2px solid #000',
          padding: '6px 10px',
          fontWeight: 900, fontSize: 14, letterSpacing: 2,
          fontFamily: 'ui-monospace, "SF Mono", monospace',
          boxShadow: '3px 3px 0 var(--purple)',
        }}>
          {revealed ? `${code}·${score}` : `??·??`}
        </div>
      </div>

      {/* Bottom: top 3 careers OR hint */}
      <div style={{ position: 'relative', zIndex: 1, padding: '10px 14px 16px' }}>
        {revealed && top3.length > 0 ? (
          <>
            <div style={{
              fontSize: 9, fontWeight: 800, letterSpacing: 1.5,
              color: 'var(--ink-soft)', marginBottom: 4,
            }}>TOP 3 CARIERE</div>
            {top3.map(({ career, score: s }, i) => (
              <div key={career.id} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 0', fontSize: 11, fontWeight: 700,
              }}>
                <span style={{
                  width: 16, height: 16, background: 'var(--purple)', color: '#fff',
                  border: '1.5px solid #000',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 900, flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{career.name}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, color: 'var(--ink-soft)' }}>{s}%</span>
              </div>
            ))}
          </>
        ) : !revealed ? (
          <div style={{
            background: '#000', color: '#fff', padding: '8px 12px',
            fontSize: 10, fontWeight: 800, letterSpacing: 1,
            textAlign: 'center',
            border: '2px solid #000',
          }}>
            DESCHIDE ↗ DESCOPERĂ
          </div>
        ) : null}
        <div style={{
          marginTop: 8, fontSize: 9, color: 'var(--ink-soft)',
          fontFamily: 'ui-monospace, monospace', letterSpacing: 1,
          borderTop: '1px dashed #000', paddingTop: 6,
        }}>
          cesafiu.ro/u/{code}{revealed ? score : '?'}
        </div>
      </div>
    </div>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────
function ShareCardScreen({ matches, answers, onBack, onCompare }) {
  const { useState } = React;
  const [mode, setMode] = useState('revealed'); // 'revealed' | 'guess'
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { code, archetype } = deriveArchetype(answers);
  const top3 = (matches || []).slice(0, 3);
  const score = top3[0]?.score || 0;
  const shareLink = `cesafiu.ro/u/${code}${score}`;

  const shareText = mode === 'guess'
    ? `Băi, ghicește ce a ieșit la mine la testul ăsta de carieră 👀 ${shareLink}`
    : `Am ieșit ${archetype.name} pe CeSăFiu (${code}·${score}). Dă și tu testul, e doar 90 sec 👀 ${shareLink}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // Fallback for older browsers
      const t = document.createElement('textarea');
      t.value = shareText; document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
      t.remove();
    }
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CeSăFiu', text: shareText, url: 'https://' + shareLink });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const handleDownload = async () => {
    if (!window.htmlToImage) {
      alert('Salvarea ca imagine va fi disponibilă în versiunea live. Pentru acum, screenshot-ează cardul.');
      return;
    }
    setDownloading(true);
    try {
      const el = document.getElementById('share-card-visual');
      const dataUrl = await window.htmlToImage.toPng(el, {
        pixelRatio: 3,
        backgroundColor: '#FAF6EC',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `cesafiu-${code}${score}.png`;
      a.click();
    } catch (e) {
      console.warn('Download failed:', e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: 16, paddingBottom: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button onClick={onBack} className="btn btn-icon" style={{ width: 36, height: 36, fontSize: 16, background: '#fff', border: '2px solid #000', boxShadow: '2px 2px 0 #000' }}>←</button>
        <div>
          <div className="h-md" style={{ lineHeight: 1, marginBottom: 2 }}>Cardul tău</div>
          <div className="body-sm" style={{ color: 'var(--ink-soft)' }}>Share cu colegii. Vezi ce iese la ei.</div>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: '#000', border: '2px solid #000', boxShadow: '3px 3px 0 var(--purple)',
        marginBottom: 14,
      }}>
        {[
          { id: 'revealed', label: 'Versiunea ta', icon: '★' },
          { id: 'guess', label: 'Mod ghicește', icon: '?' },
        ].map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              style={{
                background: active ? 'var(--yellow)' : '#000',
                color: active ? '#000' : '#fff',
                border: 'none', padding: '10px 8px',
                fontWeight: 900, fontSize: 11, letterSpacing: 1,
                textTransform: 'uppercase', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span>{opt.icon}</span>{opt.label}
            </button>
          );
        })}
      </div>

      {/* Card preview */}
      <div style={{ maxWidth: 260, margin: '0 auto', marginBottom: 14 }}>
        <CardVisual
          archetype={archetype}
          code={code}
          score={score}
          top3={top3}
          revealed={mode === 'revealed'}
        />
      </div>

      {/* Hint */}
      <div style={{
        background: mode === 'guess' ? 'var(--purple)' : 'var(--yellow)',
        color: mode === 'guess' ? '#fff' : '#000',
        border: '2px solid #000',
        padding: '10px 14px',
        fontSize: 11, fontWeight: 700, lineHeight: 1.4,
        marginBottom: 16,
        boxShadow: '3px 3px 0 #000',
      }}>
        {mode === 'guess'
          ? '🎯 Colegii intră pe link, ghicesc ce a ieșit la tine, apoi sunt invitați să-și facă propriul test.'
          : '✦ Versiunea publică pe care o vede oricine intră pe linkul tău.'}
      </div>

      {/* Share row */}
      <div style={{ marginBottom: 14 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
          color: 'var(--ink-soft)', textTransform: 'uppercase',
          marginBottom: 8,
        }}>Share unde vrei</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 8 }}>
          <button onClick={handleWhatsApp} style={{
            background: '#25D366', color: '#fff', border: '2px solid #000',
            padding: '12px 10px', fontWeight: 900, fontSize: 12, letterSpacing: 1,
            cursor: 'pointer', boxShadow: '3px 3px 0 #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>✆</span>WhatsApp
          </button>
          <button onClick={handleNativeShare} style={{
            background: '#000', color: '#fff', border: '2px solid #000',
            padding: '12px 10px', fontWeight: 900, fontSize: 12, letterSpacing: 1,
            cursor: 'pointer', boxShadow: '3px 3px 0 var(--yellow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>↗</span>Share
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          <button onClick={handleCopy} style={{
            background: copied ? 'var(--green)' : '#fff', color: '#000',
            border: '2px solid #000',
            padding: '12px 10px', fontWeight: 900, fontSize: 12, letterSpacing: 1,
            cursor: 'pointer', boxShadow: '3px 3px 0 #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>{copied ? '✓' : '⧉'}</span>
            {copied ? 'Copiat!' : 'Copiază link'}
          </button>
          <button onClick={handleDownload} disabled={downloading} style={{
            background: 'var(--yellow)', color: '#000',
            border: '2px solid #000',
            padding: '12px 10px', fontWeight: 900, fontSize: 12, letterSpacing: 1,
            cursor: downloading ? 'wait' : 'pointer', boxShadow: '3px 3px 0 #000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            opacity: downloading ? 0.6 : 1,
          }}>
            <span style={{ fontSize: 16 }}>{downloading ? '◌' : '↓'}</span>
            {downloading ? 'Salvez...' : 'Salvează'}
          </button>
        </div>
      </div>

      {/* Compare / class CTAs */}
      <div style={{
        background: '#fff', border: '2px solid #000', boxShadow: '3px 3px 0 #000',
        padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--ink-soft)', marginBottom: 4 }}>FA MAI MULT</div>
        <div className="h-md" style={{ fontSize: 18, lineHeight: 1.15, marginBottom: 10 }}>Compară cu un prieten</div>
        <div className="body-sm" style={{ color: 'var(--ink-soft)', marginBottom: 12, lineHeight: 1.4 }}>
          Doi prieteni → vezi pe ce vibe-uri vă potriviți și în ce echipă ați funcționa.
        </div>
        <button onClick={onCompare} style={{
          width: '100%',
          background: 'var(--purple)', color: '#fff',
          border: '2px solid #000', padding: '12px',
          fontWeight: 900, fontSize: 12, letterSpacing: 1,
          cursor: 'pointer', boxShadow: '3px 3px 0 #000',
        }}>
          ▶ COMPARĂ CU UN COD
        </button>
      </div>

      {/* Class dashboard tease */}
      <div style={{
        background: '#000', color: '#fff',
        border: '2px solid #000', boxShadow: '3px 3px 0 var(--yellow)',
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--yellow)', marginBottom: 4 }}>CLASA TA</div>
        <div style={{ fontSize: 16, fontWeight: 900, lineHeight: 1.15, marginBottom: 6 }}>5+ colegi → dashboard de clasă</div>
        <div style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.45 }}>
          Vezi top 3 cariere din clasa ta, echipa „perfectă", și un raport pe care îl trimiți dirig-ului.
        </div>
      </div>
    </div>
  );
}

window.ShareCardScreen = ShareCardScreen;
window.CardVisual = CardVisual;
window.ARCHETYPES = ARCHETYPES;
