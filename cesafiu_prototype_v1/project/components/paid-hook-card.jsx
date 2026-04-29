// paid-hook-card.jsx
// Hook card for the paid in-depth report. Lives at the bottom of every
// results surface (quick quiz, personality, vocational). The point is NOT
// to charge — it's to validate willingness-to-pay before building the
// report engine. Per ROADMAP §1.6: manual fulfillment for the first ~20.
//
// Tracks two events in Umami so the funnel is clean:
//   paid_intent_clicked    — user pressed "Vreau raportul"
//   paid_intent_submitted  — user typed an email and confirmed
// Submits to the same Formspree endpoint as the waitlist but tagged
// `intent: paid_report_19eur` so the lists are separable on export.
//
// Props:
//   context — short string identifying which surface (e.g. 'quick-quiz',
//             'personality', 'vocational') so analytics can split funnels
//   summary — optional one-line summary of the user's result, included
//             in the Formspree payload so manual fulfillment has context
function PaidHookCard({ context, summary }) {
  const [stage, setStage] = React.useState('idle'); // idle | email | sending | sent | error
  const [email, setEmail] = React.useState('');
  const [agree, setAgree] = React.useState(false);

  const track = (name, extra) => {
    try {
      if (window.umamiTrack) {
        window.umamiTrack(name, Object.assign({ context: context || 'unknown' }, extra || {}));
      } else if (window.umami) {
        window.umami.track(name, Object.assign({ context: context || 'unknown' }, extra || {}));
      }
    } catch (e) { /* analytics is never blocking */ }
  };

  const handleClick = () => {
    track('paid_intent_clicked', {});
    setStage('email');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !agree) return;
    setStage('sending');
    try {
      await fetch('https://formspree.io/f/myklbprg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          email,
          intent: 'paid_report_19eur',
          context: context || 'unknown',
          summary: summary || '',
          surface: window.CESAFIU_SURFACE || 'unknown',
          submitted_at: new Date().toISOString(),
        }),
      });
      track('paid_intent_submitted', { email_provided: true });
      setStage('sent');
    } catch (err) {
      // Even on network error we count the intent — better signal than losing it.
      track('paid_intent_submitted', { email_provided: true, error: 'network' });
      setStage('sent');
    }
  };

  // ── States ────────────────────────────────────────────────
  if (stage === 'sent') {
    return (
      <div className="card" style={{
        marginTop: 16, padding: 20,
        background: 'var(--purple)', color: '#fff', border: '2px solid #000',
      }}>
        <div className="h-sm" style={{ color: '#fff' }}>✓ Notat. Te contactăm.</div>
        <div className="body-sm" style={{ marginTop: 6, opacity: 0.9 }}>
          Când raportul tău e gata, primești email cu link-ul de plată la prețul de pre-lansare. Mulțumim — feedback-ul tău e cel mai valoros pentru noi acum.
        </div>
      </div>
    );
  }

  if (stage === 'email' || stage === 'sending') {
    return (
      <div className="card" style={{
        marginTop: 16, padding: 20,
        background: 'var(--purple)', color: '#fff', border: '2px solid #000',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: 'var(--yellow)', color: '#000',
            padding: '3px 8px', fontSize: 10, fontWeight: 800,
            border: '2px solid #000', letterSpacing: '.06em',
          }}>PRE-LANSARE</span>
          <span style={{
            background: '#000', color: 'var(--yellow)',
            padding: '3px 10px', fontSize: 11, fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
            textDecoration: 'line-through', opacity: 0.55,
          }}>€29</span>
          <span style={{
            background: '#000', color: 'var(--yellow)',
            padding: '3px 10px', fontSize: 13, fontWeight: 800,
            fontFamily: 'JetBrains Mono, monospace',
          }}>€19</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="h-sm" style={{ color: '#fff' }}>Lasă-ne emailul tău</div>
          <div className="body-sm" style={{ marginTop: 6, opacity: 0.9 }}>
            Te anunțăm când lansăm raportul. Pre-lansare €19 (€29 după). Fără card acum.
          </div>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplu.ro"
            className="input"
            style={{ marginTop: 12, width: '100%' }}
          />
          <label style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10,
            fontSize: 12, lineHeight: 1.4, opacity: 0.9, cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            <span>Sunt de acord să fiu contactat despre raportul plătit. GDPR — dezabonare oricând.</span>
          </label>
          <button
            type="submit"
            disabled={!email || !agree || stage === 'sending'}
            className="btn"
            style={{
              marginTop: 14, width: '100%',
              background: 'var(--yellow)', color: '#000',
              opacity: (!email || !agree || stage === 'sending') ? 0.55 : 1,
              cursor: (!email || !agree || stage === 'sending') ? 'not-allowed' : 'pointer',
            }}
          >
            {stage === 'sending' ? 'TRIMITE...' : 'REZERVĂ-MI LOCUL →'}
          </button>
          <button
            type="button"
            onClick={() => setStage('idle')}
            className="label-bold"
            style={{
              marginTop: 8, width: '100%', background: 'transparent',
              color: '#fff', border: 'none', textDecoration: 'underline',
              cursor: 'pointer', opacity: 0.7,
            }}
          >
            anulează
          </button>
        </form>
      </div>
    );
  }

  // idle (default)
  return (
    <div className="card" style={{
      marginTop: 16, padding: 20,
      background: 'var(--purple)', color: '#fff', border: '2px solid #000',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
        <span style={{
          background: 'var(--yellow)', color: '#000',
          padding: '3px 8px', fontSize: 10, fontWeight: 800,
          border: '2px solid #000', letterSpacing: '.06em',
        }}>RAPORT DETALIAT · PRE-LANSARE</span>
      </div>
      <div className="h-sm" style={{ color: '#fff', fontSize: 18 }}>Vrei raportul detaliat?</div>
      <div className="body-sm" style={{ marginTop: 8, opacity: 0.92 }}>
        PDF de 12-15 pagini construit pe rezultatele tale: <b>5 cariere de top</b> cu salarii actuale RO + UE,
        <b> traseu universitar concret</b> (facultăți + școli profesionale + bootcampuri),
        <b> întrebări pentru părinți</b>, și <b>2 next steps</b> pentru următoarele 30 de zile.
        Livrare PDF în 48h.
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 10,
        marginTop: 14, marginBottom: 14,
      }}>
        <span style={{
          background: '#000', color: 'var(--yellow)',
          padding: '4px 10px', fontSize: 18, fontWeight: 900,
          fontFamily: 'JetBrains Mono, monospace',
        }}>€19</span>
        <span style={{ fontSize: 13, opacity: 0.6, textDecoration: 'line-through' }}>€29 după lansare</span>
      </div>
      <button
        onClick={handleClick}
        className="btn"
        style={{ width: '100%', background: 'var(--yellow)', color: '#000', fontWeight: 800 }}
      >
        VREAU RAPORTUL →
      </button>
      <div className="label-sm" style={{ marginTop: 10, opacity: 0.7, fontSize: 11 }}>
        Fără card acum — doar îți rezervi locul la prețul de pre-lansare.
      </div>
    </div>
  );
}

window.PaidHookCard = PaidHookCard;
