// Results screen — career match reveal with sticker explosion
function ResultsScreen({ matches, onPickCareer, onRetake, onProfile, onSaveCareer, savedIds, onPickTest, layout }) {
  if (layout === 'list') return <ResultsList matches={matches} onPickCareer={onPickCareer} onRetake={onRetake} />;
  return <ResultsHero matches={matches} onPickCareer={onPickCareer} onRetake={onRetake} onProfile={onProfile} onSaveCareer={onSaveCareer} savedIds={savedIds || []} onPickTest={onPickTest} />;
}

// Student-language translations of the algorithm's signals.
// Verbs over nouns, no jargon, no scholarly Romanian terms.
const RIASEC_PLAIN = {
  R: { verb: 'Faci',         tag: 'Mâini active',   desc: 'Construiești, repari, sport, lucruri tangibile.' },
  I: { verb: 'Înțelegi',     tag: 'Curios + analitic', desc: 'Întrebi „de ce", citești mult, cauți tipare.' },
  A: { verb: 'Creezi',       tag: 'Vizual + estetic', desc: 'Desen, scriere, video, design — îți semnezi munca.' },
  S: { verb: 'Asculți',      tag: 'Cu oameni',      desc: 'Empatie naturală, predare, ajutor direct.' },
  E: { verb: 'Conduci',      tag: 'Influencer + lider', desc: 'Convingi, organizezi, decizi sub presiune.' },
  C: { verb: 'Pui ordine',   tag: 'Sistematic',     desc: 'Reguli clare, deadlines, predictibilitate.' },
};
const BIG5_PLAIN = {
  O: { tag: 'Curiozitate',     hi: 'Te atrag idei noi, abstracte', lo: 'Preferi rutine cunoscute' },
  C: { tag: 'Disciplină',      hi: 'Termini ce începi, planifici', lo: 'Te miști spontan, alergic la rigid' },
  E: { tag: 'Energie socială', hi: 'Te alimentează grupurile',     lo: 'Te încarci în liniște, solo' },
  A: { tag: 'Empatie',         hi: 'Cooperezi natural, eviți conflicte', lo: 'Direct, competitiv, fără filtru' },
  N: { tag: 'Sensibilitate',   hi: 'Simți tot, mai intens',       lo: 'Calm sub stres, stabil emoțional' },
};

// Map RIASEC tally → user's top 1-3 codes (their "style")
function topRiasecCodes(riasec) {
  return Object.entries(riasec || {})
    .filter(([k]) => k in RIASEC_PLAIN)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([_, v]) => v > 0)
    .map(([k]) => k);
}

function ResultsHero({ matches, onPickCareer, onRetake, onProfile, onSaveCareer, savedIds, onPickTest }) {
  const top = matches[0];
  const others = matches.slice(1, 4);
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };
  const PaidHookCard = window.PaidHookCard;
  const isAlreadySaved = top && savedIds && savedIds.includes(top.career.id);
  const [justSaved, setJustSaved] = React.useState(false);

  const confidence = (typeof matches.confidence === 'number') ? matches.confidence : 0;
  const sources = matches.sources || [];
  const nextTest = matches.nextTest || null;
  const userProfile = matches.userProfile || null;  // exposed by app.jsx Phase A
  // Plain-language labels for the source-strip ("Bazat pe: …").
  const sourceLabels = {
    'quick':            'Quiz rapid',
    'vocational':       'Vocațional scurt',
    'vocational-deep':  'Vocațional validat (O*NET)',
    'personality-15':   'Personalitate scurt',
    'ipip-neo-60':      'Big Five validat (IPIP-NEO-60)',
  };
  const confLabel = confidence < 0.30 ? 'Scăzută' : confidence < 0.60 ? 'Medie' : 'Solidă';
  const confColor = confidence < 0.30 ? 'var(--yellow)' : confidence < 0.60 ? 'var(--green)' : 'var(--purple)';

  // Phase B (student language): user's top RIASEC codes → plain "Stilul tău".
  // Without going Holland-test-deep, we still show the user something actionable
  // about themselves: 1-3 verbs that summarize how they answered.
  const topCodes = userProfile ? topRiasecCodes(userProfile.riasec) : [];
  const styleVerbs = topCodes.map((c) => RIASEC_PLAIN[c].verb).join(' + ');
  const styleTags = topCodes.map((c) => RIASEC_PLAIN[c].tag).join(' / ');

  // Profile completion: 1, 2, or 3 of the test sources done.
  const completedTests = sources.length;
  const totalTests = 3;  // quick + vocational + (personality OR ipip-neo-60)

  // Per-axis scores from the matching algorithm. Rendered as plain-language rows.
  const whyText = top && top.why && (typeof top.why === 'object' ? top.why.text : top.why);
  const whyAxes = top && top.why && top.why.axes;

  const handleSaveAndGo = () => {
    if (top && onSaveCareer && !isAlreadySaved) onSaveCareer(top.career.id);
    setJustSaved(true);
    setTimeout(() => { setJustSaved(false); if (onProfile) onProfile(); }, 600);
  };

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      {/* hero */}
      <div style={{
        background: colors[top.career.color], color: top.career.color === 'purple' ? '#fff' : '#000',
        padding: '24px 20px 48px', borderBottom: '2px solid #000', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="sticker sticker-white tilt-l">VIBE-UL TĂU</div>
          <button onClick={onRetake} className="label-bold" style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>
            REIA ↻
          </button>
        </div>
        <div className="label-bold" style={{ marginTop: 28, opacity: 0.7 }}>POTRIVIT PENTRU TINE:</div>
        <div className="h-xl anim-pop" style={{ fontSize: 52, marginTop: 8, lineHeight: 0.95 }}>
          {top.career.name.split(' ').map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
        <div className="body-lg" style={{ marginTop: 16, fontWeight: 600, fontStyle: 'italic' }}>
          „{top.career.tagline}."
        </div>
        {whyText && (
          <div className="label-sm" style={{ marginTop: 12, opacity: 0.85, fontFamily: 'JetBrains Mono, monospace' }}>
            DE CE: {whyText}
          </div>
        )}

        {/* Confidence + sources strip — replaces the static disclaimer.
            Honest about what the algorithm has to work with. */}
        <div style={{
          marginTop: 16, padding: '10px 12px',
          background: 'rgba(0,0,0,0.15)', border: '2px solid #000',
          fontSize: 11, lineHeight: 1.45, fontWeight: 600,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ background: confColor, color: '#000', padding: '2px 8px', border: '2px solid #000', fontWeight: 800 }}>
              ÎNCREDERE: {confLabel}
            </span>
            <span style={{ opacity: 0.85 }}>
              Bazat pe: {(sources.length ? sources.map(s => sourceLabels[s] || s).join(' + ') : 'fără date')}
            </span>
          </div>
          {confidence < 0.60 && nextTest && (
            <div style={{ marginTop: 6, opacity: 0.9 }}>
              Mai multe teste = matches mai precise. {nextTest.reason}
            </div>
          )}
        </div>

        {/* big abstract emoji-ish */}
        <div style={{
          position: 'absolute', top: 24, right: -20, width: 120, height: 120,
          background: 'rgba(255,255,255,0.2)', border: '2px solid #000',
          borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 64, transform: 'rotate(15deg)',
        }}>{top.career.emoji}</div>

        {/* match score sticker */}
        <div className="sticker sticker-purple anim-stamp" style={{
          position: 'absolute', bottom: -16, right: 24, fontSize: 14, padding: '10px 16px',
          background: '#000', color: '#fff', transform: 'rotate(-4deg)', boxShadow: '4px 4px 0 #fff, 4px 4px 0 2px #000',
        }}>
          <span style={{ color: 'var(--green)' }}>★</span> MATCH {top.score}%
        </div>
      </div>

      {/* meta strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '2px solid #000' }}>
        {[
          { label: 'SALARIU', value: top.career.salary.split('—')[1]?.trim() || top.career.salary, bg: '#fff' },
          { label: 'CERERE', value: top.career.demand, bg: 'var(--paper-2)' },
          { label: 'VIBE', value: top.career.vibe, bg: '#fff' },
        ].map((m, i) => (
          <div key={i} style={{ padding: '14px 12px', background: m.bg, borderRight: i < 2 ? '2px solid #000' : 'none', textAlign: 'center' }}>
            <div className="label-sm" style={{ color: 'var(--ink-soft)' }}>{m.label}</div>
            <div className="body-sm" style={{ fontWeight: 800, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 20px 0' }}>
        <div className="body-md" style={{ lineHeight: 1.5 }}>
          {top.career.description}
        </div>

        <button
          onClick={() => onPickCareer(top.career.id)}
          className="btn btn-primary btn-lg"
          style={{ marginTop: 24, width: '100%' }}
        >
          VEZI TOT DESPRE ASTA →
        </button>

        {/* PROFILUL TĂU — plain-language summary of what the algorithm sees,
            written for a 16-year-old, not for a psychologist. Phase B (student calibration). */}
        <div style={{ marginTop: 24, padding: 16, background: '#fff', border: '2px solid #000', boxShadow: '4px 4px 0 #000' }}>
          <div className="label-bold" style={{ marginBottom: 4 }}>PROFILUL TĂU — CE-AM ÎNȚELES PÂNĂ AICI</div>
          <div className="body-sm" style={{ color: 'var(--ink-soft)', marginBottom: 14 }}>
            Asta vede algoritmul. Nu te judecă — doar te ascultă.
          </div>

          {/* Stilul (RIASEC) — verbs, not jargon */}
          {topCodes.length > 0 ? (
            <div style={{ marginBottom: 14 }}>
              <div className="label-sm" style={{ color: 'var(--purple)', fontWeight: 800, marginBottom: 4 }}>
                STILUL TĂU
              </div>
              <div className="h-sm" style={{ marginBottom: 4 }}>
                {styleVerbs}
                {styleTags && (
                  <span className="body-sm" style={{ color: 'var(--ink-soft)', fontWeight: 500 }}> · {styleTags}</span>
                )}
              </div>
              <div className="body-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                {topCodes.map((c, i) => (
                  <span key={c}>
                    {i > 0 && ' '}<b>{RIASEC_PLAIN[c].verb}:</b> {RIASEC_PLAIN[c].desc}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Drumul preferat — already plain language */}
          {userProfile && Object.keys(userProfile.paths || {}).length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="label-sm" style={{ color: 'var(--purple)', fontWeight: 800, marginBottom: 4 }}>
                DRUMUL PREFERAT
              </div>
              <div className="h-sm" style={{ marginBottom: 2 }}>
                {(() => {
                  const sorted = Object.entries(userProfile.paths).sort((a, b) => b[1] - a[1]);
                  return sorted.slice(0, 2).map(([k]) => (
                    { facultate: 'Facultate', autodidact: 'Autodidact', antreprenor: 'Antreprenor',
                      profesional: 'Profesional', creator: 'Creator', freelance: 'Freelance', mixt: 'Mixt' }[k] || k
                  )).join(' / ');
                })()}
              </div>
              <div className="body-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                Cum preferi să înveți și să intri în piața muncii. Nu e definitiv — se poate schimba.
              </div>
            </div>
          )}

          {/* Personalitatea (Big Five) — plain language with high/low descriptions */}
          <div style={{ marginBottom: 14 }}>
            <div className="label-sm" style={{ color: 'var(--purple)', fontWeight: 800, marginBottom: 4 }}>
              PERSONALITATEA
            </div>
            {userProfile && userProfile.big5 && Object.keys(userProfile.big5).length > 0 ? (
              <div>
                {['O', 'C', 'E', 'A', 'N'].filter(k => typeof userProfile.big5[k] === 'number').map((k) => {
                  const pct = userProfile.big5[k];
                  const isHigh = pct >= 60; const isLow = pct <= 40;
                  const label = isHigh ? BIG5_PLAIN[k].hi : isLow ? BIG5_PLAIN[k].lo : 'echilibrat';
                  return (
                    <div key={k} style={{ marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13 }}>
                        <b>{BIG5_PLAIN[k].tag}:</b>
                        <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
                        <span style={{ marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700 }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="body-sm" style={{ color: 'var(--ink-soft)', fontStyle: 'italic', lineHeight: 1.4 }}>
                Încă necunoscută. Testul de personalitate (4 sau 12 minute) îți spune cum reacționezi la presiune,
                cât te alimentează grupurile, dacă termini ce începi. Adaugă fit motivațional la matching.
              </div>
            )}
          </div>

          {/* Profile completeness bar */}
          <div style={{ marginTop: 18, padding: 12, background: 'var(--paper-2)', border: '2px solid #000' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span className="label-sm" style={{ fontWeight: 800 }}>PROFIL COMPLETAT</span>
              <span className="mono" style={{ fontWeight: 800 }}>{completedTests} / {totalTests} teste</span>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{
                  flex: 1, height: 14,
                  background: i < completedTests ? 'var(--green)' : '#fff',
                  border: '2px solid #000',
                }}></div>
              ))}
            </div>
            <div className="body-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.4 }}>
              {completedTests === 1 && 'Cu un test în plus → matches mai precise (~50% acuratețe). Cu toate trei → ~75%.'}
              {completedTests === 2 && 'Aproape gata. Ultimul test scoate fit motivațional la suprafață.'}
              {completedTests === 3 && 'Profil complet. Matches calibrate cu toate semnalele disponibile.'}
            </div>
          </div>
        </div>

        {/* Honest answers nudge — directly addresses the „what would mom approve" instinct.
            Placed after the profile so the user has just SEEN what their answers shaped. */}
        <div style={{
          marginTop: 16, padding: 14,
          background: 'var(--yellow)', border: '2px solid #000',
          fontSize: 13, lineHeight: 1.45, fontWeight: 600,
        }}>
          <div className="label-bold" style={{ marginBottom: 6 }}>UN LUCRU IMPORTANT</div>
          <div>
            Răspunsurile sincere = matches utile pentru <b>tine</b>. Dacă alegi „ce-ar suna bine la mama",
            algoritmul îți va recomanda cariera mamei tale, nu pe a ta. Algoritmul nu te judecă —
            doar repetă ce-i spui.
          </div>
        </div>

        {/* Adaptive next-test CTA — warmer, with concrete acuratețe-gain framing.
            Hidden once user has all 3 tests. */}
        {nextTest && nextTest.kind !== 'quick' && (
          <div style={{
            marginTop: 16, padding: 18, background: 'var(--purple)', color: '#fff',
            border: '2px solid #000', boxShadow: '4px 4px 0 #000',
          }}>
            <div className="label-bold" style={{ color: 'var(--yellow)', marginBottom: 8 }}>
              PASUL URMĂTOR
            </div>
            <div className="h-sm" style={{ color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>
              {nextTest.kind === 'vocational' && 'Testul vocațional · 18 itemi · 4 min'}
              {nextTest.kind === 'vocational-deep' && 'Holland validat (O*NET) · 60 itemi · 8-10 min'}
              {nextTest.kind === 'ipip-neo' && 'Big Five validat · 60 itemi · 12 min'}
              {nextTest.kind === 'personality' && 'Personalitate (scurt) · 15 itemi · 4 min'}
            </div>
            <div className="body-md" style={{ marginBottom: 12, opacity: 0.95 }}>
              {nextTest.reason}
            </div>
            <div className="body-sm" style={{ marginBottom: 14, opacity: 0.85, fontStyle: 'italic' }}>
              {completedTests === 1 && 'Acuratețea creste de la ~17% la ~50%.'}
              {completedTests === 2 && 'Acuratețea creste de la ~50% la ~75%.'}
            </div>
            {onPickTest && (
              <button
                onClick={() => onPickTest(nextTest.kind === 'ipip-neo' ? 'ipip-neo' : nextTest.kind)}
                className="btn"
                style={{ background: 'var(--yellow)', color: '#000', fontWeight: 800, width: '100%' }}
              >
                {nextTest.kind === 'vocational' && 'FĂ TESTUL VOCAȚIONAL →'}
                {nextTest.kind === 'vocational-deep' && 'FĂ HOLLAND VALIDAT (10 MIN) →'}
                {nextTest.kind === 'ipip-neo' && 'FĂ BIG FIVE (12 MIN) →'}
                {nextTest.kind === 'personality' && 'FĂ PERSONALITATE (4 MIN) →'}
              </button>
            )}
          </div>
        )}

        {/* other matches */}
        <div className="h-md" style={{ marginTop: 36, marginBottom: 12 }}>
          Și încă <span style={{ background: 'var(--yellow)', padding: '0 6px', border: '2px solid #000' }}>3 vibe-uri</span> care îți merg
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {others.map((m, i) => (
            <button
              key={m.career.id}
              onClick={() => onPickCareer(m.career.id)}
              className="card"
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: 14, background: '#fff', textAlign: 'left',
                font: 'inherit', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 56, height: 56, flexShrink: 0,
                background: colors[m.career.color], border: '2px solid #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, color: m.career.color === 'purple' ? '#fff' : '#000',
              }}>{m.career.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-sm">{m.career.name}</div>
                <div className="body-sm" style={{ color: 'var(--ink-soft)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{m.career.tagline}</div>
              </div>
              <div style={{
                background: '#000', color: 'var(--green)',
                padding: '6px 10px', fontWeight: 800, fontSize: 13,
                fontFamily: 'JetBrains Mono, monospace',
              }}>{m.score}%</div>
            </button>
          ))}
        </div>

        {/* Save vibe — actually persists the top career via onSaveCareer + nav.
            Previously this button only navigated to /profile; nothing was saved. */}
        <div className="card" style={{ marginTop: 32, padding: 20, background: 'var(--green)' }}>
          <div className="h-sm">{isAlreadySaved ? 'Vibe-ul tău e salvat' : 'Salvează rezultatul'}</div>
          <div className="body-sm" style={{ marginTop: 6 }}>
            {isAlreadySaved
              ? 'Îl găsești în Vibe-uri oricând. Apasă mai jos să-l deschizi.'
              : 'Îl găsești în profilul tău. Toate datele rămân pe device-ul tău.'}
          </div>
          <button
            onClick={handleSaveAndGo}
            disabled={justSaved}
            className="btn"
            style={{
              marginTop: 14, width: '100%',
              background: justSaved ? 'var(--purple)' : '#000',
              color: '#fff',
              transition: 'background .15s',
            }}
          >
            {justSaved
              ? '✓ SALVAT — DESCHID PROFILUL'
              : isAlreadySaved
                ? 'DESCHIDE PROFILUL →'
                : 'SALVEAZĂ-MI VIBE-UL →'}
          </button>
        </div>

        {/* Paid in-depth report hook — Phase 1 willingness-to-pay validator */}
        {PaidHookCard && (
          <PaidHookCard
            context="quick-quiz"
            summary={`Quick quiz top match: ${top.career.name} (${top.score}%)`}
          />
        )}

        <div style={{ height: 24 }}></div>
      </div>
    </div>
  );
}

function ResultsList({ matches, onPickCareer, onRetake }) {
  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100, padding: '0 20px 100px' }}>
      <div style={{ paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="h-lg">Top 6 pentru tine</div>
        <button onClick={onRetake} className="btn btn-icon" style={{ background: '#fff' }}>↻</button>
      </div>
      <div className="body-md" style={{ color: 'var(--ink-soft)', marginTop: 4, marginBottom: 20 }}>
        Sortate după cât de mult te potrivești.
      </div>
      {matches.map((m, i) => (
        <button
          key={m.career.id}
          onClick={() => onPickCareer(m.career.id)}
          className="card"
          style={{
            display: 'block', width: '100%', marginBottom: 12, padding: 16,
            background: i === 0 ? 'var(--yellow)' : '#fff', textAlign: 'left',
            font: 'inherit', cursor: 'pointer', position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="h-sm">{i + 1}. {m.career.name}</div>
            <div className="mono" style={{ fontWeight: 800 }}>{m.score}%</div>
          </div>
          <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 4 }}>{m.career.tagline}</div>
          <div className="progress" style={{ marginTop: 10, height: 10 }}>
            <div className="progress-fill" style={{ width: `${m.score}%` }}></div>
          </div>
        </button>
      ))}
    </div>
  );
}

window.ResultsScreen = ResultsScreen;
