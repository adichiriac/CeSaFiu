// Profile screen — Phase 2 hub: scores · action plan · saved · share
// Composes data from quick-quiz matches, deep tests (personality/IPIP/vocational),
// and university programs (admission deadlines + URLs) into a single actionable view.

const PATH_PLAN = {
  facultate: {
    label: 'FACULTATE', tagline: 'Drum lung, validare cu ștampilă',
    color: 'var(--purple)', text: '#fff',
    steps: [
      { eyebrow: 'PASUL 1', title: 'Verifică BAC-ul tău', body: 'Rezultatele de la simulări = predictor mai bun decât speri. Dacă ești sub 8, alege 2-3 facultăți „safe" în plus.', when: 'Acum' },
      { eyebrow: 'PASUL 2', title: 'Aplică la 3 facultăți, nu 1', body: 'Una de vis (greu de intrat), una realistă, una sigură. Toate au taxe de ~150 lei.', when: 'Mai 2026' },
      { eyebrow: 'PASUL 3', title: 'Pregătește examenul de admitere', body: 'Începe acum: 1h/zi pe materia de admitere bate 8h/zi în iulie.', when: 'Iunie 2026' },
    ],
  },
  autodidact: {
    label: 'AUTODIDACT', tagline: 'Învață direct făcând. Portofoliul = diplomă.',
    color: 'var(--green)', text: '#000',
    steps: [
      { eyebrow: 'PASUL 1', title: 'Alege 1 (UNUL) curs gratuit', body: 'CS50, FreeCodeCamp, The Odin Project. Nu 5. UNUL. 2-3 luni de focus.', when: 'Săptămâna asta' },
      { eyebrow: 'PASUL 2', title: 'Construiește 3 proiecte publice', body: 'Pe GitHub, sub numele tău. Nu „proiecte de curs" — proiecte care rezolvă ceva real, oricât de mic.', when: '3 luni' },
      { eyebrow: 'PASUL 3', title: 'Aplică la primul job junior', body: 'Remote, 2-3 zile/săpt. Nu aștepta să fii „gata" — primul refuz e parte din proces.', when: '6 luni' },
    ],
  },
  antreprenor: {
    label: 'ANTREPRENOR', tagline: 'Construiești ceva de la zero. Risc real, control real.',
    color: 'var(--purple)', text: '#fff',
    steps: [
      { eyebrow: 'PASUL 1', title: 'Identifică o problemă personală', body: 'Cea mai bună idee e una pe care o trăiești zilnic. „Ce mă enervează cel mai des?" e un întrebare bună.', when: 'Săptămâna asta' },
      { eyebrow: 'PASUL 2', title: 'Vorbește cu 10 oameni', body: 'Înainte să construiești orice. Vând-le ideea pe hârtie. Dacă nu cumpără cu vorba, nu cumpără cu produsul.', when: '1 lună' },
      { eyebrow: 'PASUL 3', title: 'Aplică la Innovation Labs sau YC Startup School', body: 'Programe gratuite. Mentorat real. Network. Innovation Labs RO acceptă liceeni.', when: 'Toamna 2026' },
    ],
  },
  freelance: {
    label: 'FREELANCE', tagline: 'Plătit per proiect. Libertate cu disciplină.',
    color: 'var(--yellow)', text: '#000',
    steps: [
      { eyebrow: 'PASUL 1', title: 'Învață meseria la nivel „junior plus"', body: 'Cursuri online + 3 proiecte personale. Nu te grăbi să facturezi cu o săptămână de cunoștințe.', when: '3-6 luni' },
      { eyebrow: 'PASUL 2', title: 'Primii 3 clienți = sub-piață', body: 'Reduceri agresive, calitate maximă. Investiție în testimoniale + portofoliu, nu în bani.', when: '6-12 luni' },
      { eyebrow: 'PASUL 3', title: 'PFA + facturare normală', body: 'După 3-5 testimoniale solide, treci pe rate de piață și înregistrează-te ca PFA.', when: '12+ luni' },
    ],
  },
  creator: {
    label: 'CREATOR', tagline: 'Audiența ta = cariera ta. Cantitatea bate calitatea la început.',
    color: 'var(--yellow)', text: '#000',
    steps: [
      { eyebrow: 'PASUL 1', title: 'Alege 1 platformă, 1 nișă', body: 'Nu YouTube + TikTok + Insta + Twitter. UNA. 90 zile de postat zilnic.', when: 'Acum' },
      { eyebrow: 'PASUL 2', title: '90 video-uri / postări în 90 zile', body: 'Iei feedback de la algoritm, nu de la prieteni. Apoi iterezi pe ce funcționează.', when: '3 luni' },
      { eyebrow: 'PASUL 3', title: 'Primii bani prin produs propriu', body: 'Nu sponsorizări. Curs, ebook, consulting, abonament. Sponsorizările vin după.', when: '12 luni' },
    ],
  },
  profesional: {
    label: 'PROFESIONAL', tagline: 'Meserie cu mâinile. Cerere mare, salarii UE.',
    color: 'var(--ink)', text: '#fff',
    steps: [
      { eyebrow: 'PASUL 1', title: 'Alege un liceu tehnologic SAU postliceală', body: 'Liceu dual = salariu de la clasa a IX-a. Postliceală = drum mai rapid (3 ani după BAC).', when: 'Mai 2026' },
      { eyebrow: 'PASUL 2', title: 'Caută o ucenicie reală în paralel', body: 'Diploma fără mâini făcute pe șantier nu valorează nimic. 1 zi/săpt în atelier > 5 zile la teorie.', when: 'Toamna 2026' },
      { eyebrow: 'PASUL 3', title: 'Specializare după 2 ani de practică', body: 'Pompe de căldură, automatizări, EV — domeniile cu cea mai mare cerere în UE.', when: '2-3 ani' },
    ],
  },
  postliceala: {
    label: 'POSTLICEALĂ', tagline: 'Profesie validată în 3 ani, fără facultate de 6.',
    color: 'var(--ink)', text: '#fff',
    steps: [
      { eyebrow: 'PASUL 1', title: 'Alege școala postliceală', body: 'Carol Davila București, Cluj, Iași — toate de stat, gratuite. Aplici după BAC.', when: 'Iulie 2026' },
      { eyebrow: 'PASUL 2', title: '3 ani de teorie + practică în spital', body: 'Stagii reale de la primul an. La final: diplomă recunoscută în toată UE.', when: '2026-2029' },
      { eyebrow: 'PASUL 3', title: 'Specializare sau plecare în UE', body: 'Germania / Olanda / UK angajează direct, salarii 2500-4000 €/lună de la primul an.', when: '2029+' },
    ],
  },
  mixt: {
    label: 'MIXT', tagline: 'Combinație facultate + side-project. Cel mai sigur drum.',
    color: 'var(--purple)', text: '#fff',
    steps: [
      { eyebrow: 'PASUL 1', title: 'Aplică la facultate ca plan A', body: 'Facultatea îți dă 4 ani de „lichiditate" — timp să încerci lucruri în paralel fără presiunea unui job full-time.', when: 'Mai-Iulie 2026' },
      { eyebrow: 'PASUL 2', title: 'Side-project din primul an', body: 'Freelance, curs propriu, podcast, micro-business. 5h/săpt. Acumulezi portofoliu în paralel cu diploma.', when: 'Anul I' },
      { eyebrow: 'PASUL 3', title: 'În anul III decizi: angajat sau independent', body: 'Până atunci ai date reale (ce ai construit + cât poți câștiga) ca să alegi conștient.', when: 'Anul III' },
    ],
  },
};

const TEST_META = {
  quick:           { label: 'Quiz rapid',          sub: '6 itemi · orientativ',          bg: 'var(--purple)',  text: '#fff', emoji: '✦' },
  personality:     { label: 'Personalitate',       sub: 'Big Five · 15 itemi · scurt',   bg: 'var(--green)',   text: '#000', emoji: '◆' },
  ipipNeo60:       { label: 'IPIP-NEO-60',         sub: 'Validat · 60 itemi',            bg: '#000',           text: '#fff', emoji: '✓' },
  vocational:      { label: 'Vocațional',          sub: 'Holland · 20 itemi',            bg: 'var(--yellow)',  text: '#000', emoji: '◉' },
  'vocational-deep': { label: 'Vocațional validat', sub: 'O*NET · 60 itemi · validat ✓', bg: '#000',           text: 'var(--yellow)', emoji: '◉' },
};

// N = Neuroticism (raw score); S = 100−N = Stabilitate Emoțională (derived, not displayed in tests)
const BIG5_LABEL = { O: 'Deschidere', C: 'Conștiinciozitate', E: 'Extraversie', A: 'Agreabilitate', N: 'Nevrotism', S: 'Stabilitate Emoțională' };
const HOLLAND_LABEL = { R: 'Realist', I: 'Investigativ', A: 'Artistic', S: 'Social', E: 'Antreprenorial', C: 'Convențional' };

function ProfileScreen({
  savedCareerIds, savedUniIds, chosenPathId, chosenCareerId,
  careers, paths, matches, deepScores, programs, universities,
  hasAnswers,
  onPickCareer, onPickPath, onPickUni,
  onRemoveSavedCareer, onRemoveSavedUni,
  onClearChosenPath, onClearChosenCareer,
  onRetake, onPickTest,
  onBrowseUnis, onBrowsePaths, onBrowseCareers,
}) {
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };
  const careerById = Object.fromEntries((careers || []).map((c) => [c.id, c]));
  const uniById = Object.fromEntries((universities || []).map((u) => [u.id, u]));
  const pathById = Object.fromEntries((paths || []).map((p) => [p.id, p]));

  const savedCareers = (careers || []).filter((c) => savedCareerIds.includes(c.id));
  const savedUnis = (universities || []).filter((u) => (savedUniIds || []).includes(u.id));
  const chosenPath = chosenPathId ? pathById[chosenPathId] : null;
  const chosenCareer = chosenCareerId ? careerById[chosenCareerId] : null;
  const top = (matches && matches[0] && matches[0].score > 0) ? matches[0] : null;

  // If user hasn't chosen a career yet but has a top match, suggest it as a soft "current direction"
  const directionCareer = chosenCareer || (top ? top.career : null);
  const directionPathType = directionCareer ? directionCareer.pathType : null;
  const directionPlan = directionPathType ? (PATH_PLAN[directionPathType] || PATH_PLAN.mixt) : null;

  // Linked university programs for the direction career
  const linkedPrograms = directionCareer
    ? (programs || []).filter((p) => (p.careerIds || []).includes(directionCareer.id)).slice(0, 3)
    : [];

  // Test completion summary
  const testsRow = [
    { key: 'quick',            done: hasAnswers,                          onClick: () => onRetake() },
    { key: 'personality',      done: !!deepScores?.personality,           onClick: () => onPickTest('personality') },
    { key: 'ipipNeo60',        done: !!deepScores?.ipipNeo60,             onClick: () => onPickTest('ipip-neo') },
    { key: 'vocational',       done: !!deepScores?.vocational,            onClick: () => onPickTest('vocational') },
    { key: 'vocational-deep',  done: !!deepScores?.vocationalDeep,        onClick: () => onPickTest('vocational-deep') },
  ];
  const completed = testsRow.filter((t) => t.done).length;

  // Empty state — nothing built yet
  const isFresh = !chosenPath && !chosenCareer && !top && savedCareers.length === 0 && savedUnis.length === 0;

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      {/* ── HEADER ─────────────────────────────────────── */}
      <div style={{ padding: '8px 20px 0' }}>
        <div className="h-lg" style={{ marginBottom: 4 }}>Profilul tău</div>
        <div className="body-md" style={{ color: 'var(--ink-soft)' }}>
          {chosenCareer
            ? <>Vrei să fii <b style={{ color: 'var(--ink)' }}>{chosenCareer.name}</b></>
            : top
              ? <>Match #1: <b style={{ color: 'var(--ink)' }}>{top.career.name}</b> · {top.score}%</>
              : 'Începe să construiești — testează, explorează, salvează.'}
        </div>
      </div>

      {/* ── IDENTITY CARD ──────────────────────────────── */}
      <div style={{ padding: '16px 20px 20px' }}>
        <div className="card card-pop" style={{ padding: 18, background: 'var(--purple)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 99,
              background: 'var(--yellow)', border: '2px solid #000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#000', fontWeight: 900, fontSize: 24, fontFamily: 'Epilogue',
            }}>A</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-sm" style={{ color: '#fff' }}>Alex, cls. a XI-a</div>
              <div className="body-sm" style={{ opacity: 0.85 }}>București · profil real, neînregistrat</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 14 }}>
            {[
              { k: 'TESTE', v: `${completed}/5` },
              { k: 'CARIERE', v: savedCareers.length },
              { k: 'UNI', v: savedUnis.length },
              { k: 'TRASEU', v: chosenPath ? '✓' : '—' },
            ].map((s) => (
              <div key={s.k} style={{ background: 'rgba(255,255,255,0.14)', border: '2px solid #000', padding: '8px 6px', textAlign: 'center' }}>
                <div className="label-sm" style={{ color: 'var(--yellow)', fontSize: 10 }}>{s.k}</div>
                <div className="h-sm" style={{ color: '#fff', marginTop: 2, fontSize: 16 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FRESH STATE: 3-card welcome ──────────────────── */}
      {isFresh && (
        <div style={{ padding: '0 20px 20px' }}>
          <div className="label-bold" style={{ marginBottom: 10, color: 'var(--ink-soft)' }}>ÎNCEPE DE AICI</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Dă quiz-ul rapid', sub: '6 întrebări · 90 sec', bg: 'var(--yellow)', text: '#000', icon: '✦', onClick: onRetake },
              { label: 'Explorează 80+ cariere', sub: 'Filtre după interese, salarii, drumuri', bg: '#fff', text: '#000', icon: '⌕', onClick: onBrowseCareers },
              { label: 'Vezi 6 drumuri posibile', sub: 'Facultate, freelance, antreprenor, etc.', bg: 'var(--green)', text: '#000', icon: '↗', onClick: onBrowsePaths },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.onClick}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 16,
                  background: item.bg, color: item.text, textAlign: 'left',
                  font: 'inherit', cursor: 'pointer', width: '100%',
                }}
              >
                <div style={{ fontSize: 26, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="h-sm" style={{ fontSize: 16 }}>{item.label}</div>
                  <div className="body-sm" style={{ marginTop: 2, opacity: 0.85 }}>{item.sub}</div>
                </div>
                <div style={{ fontSize: 18 }}>→</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 1. CARIERA TA #1 ─────────────────────────────── */}
      {(chosenCareer || top) && (
        <div style={{ padding: '0 20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div className="label-bold" style={{ color: 'var(--ink-soft)' }}>
              CARIERA TA #1
            </div>
            {chosenCareer && (
              <button
                onClick={onClearChosenCareer}
                style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'var(--ink-soft)', textDecoration: 'underline', fontSize: 11 }}
              >
                schimbă
              </button>
            )}
          </div>
          <button
            onClick={() => onPickCareer(directionCareer.id)}
            className="card card-pop"
            style={{
              width: '100%', padding: 18, textAlign: 'left',
              background: chosenCareer ? 'var(--green)' : '#fff',
              color: '#000', font: 'inherit', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 64, height: 64, flexShrink: 0,
                background: colors[directionCareer.color] || 'var(--purple)', border: '2px solid #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: directionCareer.color === 'purple' ? '#fff' : '#000',
              }}>{directionCareer.emoji}</div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                {chosenCareer ? (
                  <span style={{
                    background: '#000', color: 'var(--green)', border: '2px solid #000',
                    fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: '3px 7px', marginBottom: 8,
                    whiteSpace: 'nowrap',
                  }}>✓ ALES DE TINE</span>
                ) : (
                  <span style={{
                    background: 'var(--yellow)', color: '#000', border: '2px solid #000',
                    fontSize: 10, fontWeight: 800, letterSpacing: 0.5, padding: '3px 7px', marginBottom: 8,
                    whiteSpace: 'nowrap',
                  }}>SUGERAT · {top.score}%</span>
                )}
                <div className="h-md" style={{ fontSize: 20, lineHeight: 1.1 }}>{directionCareer.name}</div>
                <div className="body-sm" style={{ marginTop: 4, opacity: 0.85 }}>{directionCareer.tagline}</div>
              </div>
            </div>
          </button>
          {!chosenCareer && top && (
            <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 8, lineHeight: 1.4 }}>
              Apasă „ALEGE CA #1" pe pagina carierei ca să o blochezi aici.
            </div>
          )}
        </div>
      )}

      {/* ── 2. TRASEUL TĂU ───────────────────────────────── */}
      {chosenPath ? (
        <div style={{ padding: '0 20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div className="label-bold" style={{ color: 'var(--ink-soft)' }}>TRASEUL TĂU</div>
            <button
              onClick={onClearChosenPath}
              style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'var(--ink-soft)', textDecoration: 'underline', fontSize: 11 }}
            >
              schimbă
            </button>
          </div>
          <button
            onClick={() => onPickPath(chosenPath.id)}
            className="card card-pop"
            style={{
              width: '100%', padding: 18, textAlign: 'left', font: 'inherit', cursor: 'pointer',
              background: colors[chosenPath.color] || 'var(--purple)',
              color: chosenPath.color === 'purple' ? '#fff' : '#000',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 60, height: 60, flexShrink: 0,
                background: '#fff', border: '2px solid #000',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 30, transform: 'rotate(-3deg)',
                boxShadow: '3px 3px 0 #000',
              }}>{chosenPath.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="h-md" style={{ fontSize: 22, lineHeight: 1.0 }}>{chosenPath.name}</div>
                <div className="body-sm" style={{ marginTop: 6, fontStyle: 'italic', opacity: 0.95 }}>„{chosenPath.tagline}"</div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, opacity: 0.8 }}>
                  <span>⏱ {chosenPath.duration}</span>
                  <span>· {chosenPath.cost}</span>
                </div>
              </div>
            </div>
          </button>
        </div>
      ) : directionPlan && (
        <div style={{ padding: '0 20px 22px' }}>
          <div className="label-bold" style={{ marginBottom: 10, color: 'var(--ink-soft)' }}>
            DRUM SUGERAT · {directionPlan.label}
          </div>
          <div className="card" style={{ background: directionPlan.color, color: directionPlan.text, padding: '14px 16px' }}>
            <div className="body-md" style={{ fontStyle: 'italic', marginBottom: 10, opacity: 0.95 }}>
              „{directionPlan.tagline}"
            </div>
            <div className="body-sm" style={{ lineHeight: 1.45, opacity: 0.92 }}>
              {directionPlan.steps[0].title}. Apoi {directionPlan.steps[1].title.toLowerCase()}.
            </div>
            <button
              onClick={onBrowsePaths}
              className="btn"
              style={{
                width: '100%', marginTop: 12,
                background: directionPlan.text === '#fff' ? '#fff' : '#000',
                color: directionPlan.text === '#fff' ? '#000' : '#fff',
              }}
            >
              ALEGE UN TRASEU →
            </button>
          </div>
        </div>
      )}

      {/* ── 3. CARIERE SALVATE (alternative) ─────────────── */}
      <div style={{ padding: '0 20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div className="label-bold" style={{ color: 'var(--ink-soft)' }}>
            ALTERNATIVE SALVATE · {savedCareers.length}
          </div>
          {savedCareers.length > 0 && (
            <button
              onClick={onBrowseCareers}
              style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'var(--purple)', textDecoration: 'underline', fontSize: 11, fontWeight: 700 }}
            >
              + adaugă
            </button>
          )}
        </div>
        {savedCareers.length === 0 ? (
          <button
            onClick={onBrowseCareers}
            className="card"
            style={{
              width: '100%', padding: 16, textAlign: 'center', background: 'var(--paper-2)',
              font: 'inherit', cursor: 'pointer', color: 'var(--ink)',
              borderStyle: 'dashed',
            }}
          >
            <div className="body-sm" style={{ color: 'var(--ink-soft)' }}>
              Salvează 3-5 cariere de explorat în paralel cu #1
            </div>
            <div className="label-bold" style={{ color: 'var(--purple)', marginTop: 6 }}>
              EXPLOREAZĂ CARIERE →
            </div>
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedCareers.filter((c) => c.id !== chosenCareerId).map((c) => (
              <div
                key={c.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#fff' }}
              >
                <button
                  onClick={() => onPickCareer(c.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                    background: 'none', border: 'none', font: 'inherit', cursor: 'pointer',
                    textAlign: 'left', padding: 0, minWidth: 0, color: 'inherit',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, flexShrink: 0,
                    background: colors[c.color] || 'var(--purple)', border: '2px solid #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: c.color === 'purple' ? '#fff' : '#000',
                  }}>{c.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="h-sm" style={{ fontSize: 14 }}>{c.name}</div>
                    <div className="body-sm" style={{ color: 'var(--ink-soft)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: 11 }}>{c.tagline}</div>
                  </div>
                </button>
                <button
                  onClick={() => onRemoveSavedCareer(c.id)}
                  className="btn-icon"
                  style={{
                    background: 'transparent', border: '2px solid #000', width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, cursor: 'pointer', flexShrink: 0,
                  }}
                  aria-label="Scoate"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. UNIVERSITĂȚI SALVATE ──────────────────────── */}
      <div style={{ padding: '0 20px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div className="label-bold" style={{ color: 'var(--ink-soft)' }}>
            UNIVERSITĂȚI URMĂRITE · {savedUnis.length}
          </div>
          {savedUnis.length > 0 && (
            <button
              onClick={onBrowseUnis}
              style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', color: 'var(--purple)', textDecoration: 'underline', fontSize: 11, fontWeight: 700 }}
            >
              + adaugă
            </button>
          )}
        </div>
        {savedUnis.length === 0 ? (
          <>
            {linkedPrograms.length > 0 ? (
              <div>
                <div className="body-sm" style={{ color: 'var(--ink-soft)', marginBottom: 8, lineHeight: 1.4 }}>
                  Sugerate pentru <b style={{ color: 'var(--ink)' }}>{directionCareer.name}</b>:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {linkedPrograms.map((p) => {
                    const uni = uniById[p.universityId];
                    if (!uni) return null;
                    return (
                      <button
                        key={p.id}
                        onClick={() => onPickUni(uni.id)}
                        className="card"
                        style={{
                          width: '100%', padding: 12, background: '#fff',
                          textAlign: 'left', font: 'inherit', cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                          <div className="h-sm" style={{ fontSize: 14, flex: 1, minWidth: 0 }}>{p.name}</div>
                          {uni.tier === 'TOP' && <div className="sticker" style={{ background: 'var(--yellow)', border: '2px solid #000', fontSize: 9, padding: '2px 6px', flexShrink: 0 }}>TOP</div>}
                        </div>
                        <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 2, fontSize: 11 }}>
                          {uni.name.replace(/^(Universitatea|UMF) /, '')} · {uni.city}
                          {p.admission && <> · ⏰ {p.admission.deadline}</>}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={onBrowseUnis}
                  className="btn"
                  style={{ width: '100%', marginTop: 10, background: '#fff', color: '#000' }}
                >
                  EXPLOREAZĂ TOATE UNIVERSITĂȚILE →
                </button>
              </div>
            ) : (
              <button
                onClick={onBrowseUnis}
                className="card"
                style={{
                  width: '100%', padding: 16, textAlign: 'center', background: 'var(--paper-2)',
                  font: 'inherit', cursor: 'pointer', color: 'var(--ink)',
                }}
              >
                <div className="body-sm" style={{ color: 'var(--ink-soft)' }}>
                  Salvează facultățile la care vrei să aplici
                </div>
                <div className="label-bold" style={{ color: 'var(--purple)', marginTop: 6 }}>
                  EXPLOREAZĂ ~95 INSTITUȚII →
                </div>
              </button>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedUnis.map((u) => (
              <div
                key={u.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fff' }}
              >
                <button
                  onClick={() => onPickUni(u.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 12,
                    background: 'none', border: 'none', font: 'inherit', cursor: 'pointer',
                    textAlign: 'left', padding: 0, minWidth: 0, color: 'inherit',
                  }}
                >
                  <div style={{
                    width: 40, height: 40, flexShrink: 0,
                    background: u.tier === 'TOP' ? 'var(--yellow)' : 'var(--paper-2)',
                    border: '2px solid #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 900, color: '#000',
                  }}>{u.tier}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="h-sm" style={{ fontSize: 14, lineHeight: 1.15 }}>{u.name}</div>
                    <div className="body-sm" style={{ color: 'var(--ink-soft)', fontSize: 11 }}>{u.city} · {u.kind}</div>
                  </div>
                </button>
                <button
                  onClick={() => onRemoveSavedUni(u.id)}
                  style={{
                    background: 'transparent', border: '2px solid #000', width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, cursor: 'pointer', flexShrink: 0,
                  }}
                  aria-label="Scoate"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 5. TESTS BAR (compact) ───────────────────────── */}
      <div style={{ padding: '0 20px 22px' }}>
        <div className="label-bold" style={{ marginBottom: 8, color: 'var(--ink-soft)' }}>
          TESTELE TALE — {completed}/5
        </div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginRight: -20 }}>
          {testsRow.map((t) => {
            const meta = TEST_META[t.key];
            return (
              <button
                key={t.key}
                onClick={t.onClick}
                className="card"
                style={{
                  flex: '0 0 auto', minWidth: 132, padding: '12px 12px',
                  background: t.done ? meta.bg : '#fff',
                  color: t.done ? meta.text : 'var(--ink)',
                  border: '2px solid #000', textAlign: 'left',
                  cursor: 'pointer', font: 'inherit',
                  opacity: t.done ? 1 : 0.85,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                  <span className="label-sm" style={{ opacity: 0.8, fontSize: 10 }}>{t.done ? 'GATA ✓' : 'NEFĂCUT'}</span>
                </div>
                <div className="h-sm" style={{ marginTop: 4, fontSize: 14, lineHeight: 1.15 }}>{meta.label}</div>
                <div className="body-sm" style={{ marginTop: 2, fontSize: 11, opacity: 0.85 }}>{meta.sub}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 6. PARENT SHARE ──────────────────────────────── */}
      {(chosenCareer || top) && (
        <div style={{ padding: '0 20px 22px' }}>
          <div className="card card-pop" style={{
            background: 'var(--green)', color: '#000', padding: '16px 18px 18px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -10, right: -8, width: 80, height: 80,
              background: '#000', color: 'var(--green)', borderRadius: 99,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, transform: 'rotate(12deg)', border: '2px solid #000',
            }}>♥</div>
            <div className="sticker sticker-white tilt-l" style={{ marginBottom: 12 }}>PENTRU PĂRINȚI</div>
            <div className="h-md" style={{ lineHeight: 1.15, maxWidth: 240 }}>
              Arată-i mamei profilul tău
            </div>
            <div className="body-sm" style={{ marginTop: 8, lineHeight: 1.45, maxWidth: 280 }}>
              {savedUnis.length > 0
                ? `Vede cele ${savedUnis.length} ${savedUnis.length === 1 ? 'facultate' : 'facultăți'} la care te uiți și ${chosenCareer ? 'cariera aleasă' : 'top match-urile tale'} — într-un singur link.`
                : 'Trimite un link cu ce ai descoperit — facultăți, cariere, drumuri.'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const c = chosenCareer || (top && top.career);
                  const text = `Am dat un quiz de orientare. ${chosenCareer ? `Vreau să fiu: ${c.name}` : `Match #1: ${c.name}`}. Vezi profilul: cesafiu.ro/p/alex`;
                  if (navigator.share) {
                    navigator.share({ text }).catch(() => {});
                  } else {
                    navigator.clipboard?.writeText(text);
                  }
                  window.umamiTrack && window.umamiTrack('profile_parent_share', { careerId: c.id });
                }}
                style={{ flex: '1 1 auto', minWidth: 140 }}
              >
                TRIMITE PE WHATSAPP
              </button>
              <button
                className="btn"
                onClick={() => {
                  navigator.clipboard?.writeText(`cesafiu.ro/p/alex`);
                  window.umamiTrack && window.umamiTrack('profile_link_copy');
                }}
                style={{ background: '#fff', color: '#000' }}
              >
                COPIAZĂ LINK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. RETAKE FOOTER ─────────────────────────────── */}
      <div style={{ padding: 20, marginTop: 12 }}>
        <button onClick={onRetake} className="btn btn-yellow btn-lg" style={{ width: '100%' }}>
          REIA QUIZ-UL ↻
        </button>
        <div className="body-sm" style={{ marginTop: 12, textAlign: 'center', color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          Vrei un raport mai serios?<br />
          Dă <button onClick={() => onPickTest('ipip-neo')} style={{ background: 'none', border: 'none', textDecoration: 'underline', font: 'inherit', cursor: 'pointer', color: 'var(--purple)', fontWeight: 700 }}>IPIP-NEO-60</button> — 12 minute, instrument validat științific.
        </div>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
