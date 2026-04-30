// Results for the deep tests (personality 15-item + ipipNeo60 + vocational)
function DeepResultsScreen({ kind, scores, onBrowse, onRetake, onProfile, onIpipNeo }) {
  if (kind === 'personality' || kind === 'ipipNeo60') {
    return <PersonalityResults dataKey={kind} scores={scores} onBrowse={onBrowse} onRetake={onRetake} onProfile={onProfile} onIpipNeo={onIpipNeo} />;
  }
  return <VocationalResults scores={scores} onBrowse={onBrowse} onRetake={onRetake} onProfile={onProfile} />;
}

function PersonalityResults({ dataKey, scores, onBrowse, onRetake, onProfile, onIpipNeo }) {
  const key = dataKey || 'personality';
  const isValidated = key === 'ipipNeo60';
  const dims = window.QUIZ_DATA[key].dimensions;
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };
  const PaidHookCard = window.PaidHookCard;
  // Ranked
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const top = ranked[0];

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      <div style={{ background: 'var(--purple)', color: '#fff', padding: '20px 20px 36px', borderBottom: '2px solid #000', position: 'relative' }}>
        <div className="sticker sticker-white tilt-l" style={{ marginBottom: 14 }}>
          {isValidated ? 'IPIP-NEO-60 · VALIDAT' : 'BIG FIVE · VERSIUNE SCURTĂ'}
        </div>
        <div className="h-xl" style={{ fontSize: 44 }}>Profilul<br/>tău</div>
        <div className="body-lg" style={{ marginTop: 12, fontWeight: 600, fontStyle: 'italic' }}>
          Dominantă: <span style={{ background: 'var(--yellow)', color: '#000', padding: '0 6px' }}>{dims[top[0]].name}</span>
        </div>
      </div>

      {/* Honest framing — short version is a hint; IPIP-60 is validated public-domain. */}
      <div className="card" style={{
        margin: '12px 20px 0', padding: 12,
        background: isValidated ? 'var(--paper-2)' : 'var(--yellow)',
        border: '2px solid #000',
      }}>
        <div className="label-bold" style={{ fontSize: 11, marginBottom: 4 }}>
          {isValidated ? '✓ TEST VALIDAT ȘTIINȚIFIC' : '⚠ DOAR ORIENTATIV'}
        </div>
        <div className="body-sm" style={{ fontSize: 13 }}>
          {isValidated
            ? 'IPIP-NEO-60 (Goldberg) — instrument din domeniul public, validat pe populație internațională. Versiune RO v1.'
            : 'Acesta e un test scurt inspirat din Big Five — nu e versiune validată. Pentru evaluare reală, ia testul complet IPIP-NEO-60 (gratuit, mai jos).'}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {Object.entries(scores).map(([k, v]) => {
          const d = dims[k];
          return (
            <div key={k} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <div className="h-sm" style={{ fontSize: 16 }}>{d.name}</div>
                <div className="mono" style={{ fontWeight: 800 }}>{v}%</div>
              </div>
              <div className="progress" style={{ height: 16 }}>
                <div className="progress-fill" style={{ width: `${v}%`, background: colors[d.color] }}></div>
              </div>
              <div className="body-sm" style={{ color: 'var(--ink-soft)', marginTop: 6 }}>
                {v >= 50 ? d.high : d.low}
              </div>
            </div>
          );
        })}

        <div className="card" style={{ padding: 18, marginTop: 16, background: 'var(--green)' }}>
          <div className="h-sm">Vezi cariere care se potrivesc</div>
          <div className="body-sm" style={{ marginTop: 6 }}>Combinăm profilul tău cu Holland Code pentru recomandări mai precise.</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={onBrowse} className="btn" style={{ flex: 1, background: '#000', color: '#fff' }}>EXPLOREAZĂ →</button>
            <button onClick={onRetake} className="btn btn-icon" style={{ background: '#fff' }}>↻</button>
          </div>
        </div>

        {/* Paid in-depth report hook — Phase 1 willingness-to-pay validator.
            On the legacy short test, also offers a free upgrade to IPIP-NEO-60
            (validated). On the IPIP results screen, no upgrade — that IS the
            upgrade. */}
        {PaidHookCard && (
          <PaidHookCard
            context={isValidated ? 'ipip-neo-60' : 'personality-test'}
            summary={`${isValidated ? 'IPIP-NEO-60' : 'Big Five short'} top dimension: ${dims[top[0]].name} (${top[1]}%)`}
            onUpgradeFree={!isValidated && onIpipNeo ? onIpipNeo : undefined}
          />
        )}
      </div>
    </div>
  );
}

function VocationalResults({ scores, onBrowse, onRetake, onProfile }) {
  const codes = window.QUIZ_DATA.vocational.codes;
  const colors = { purple: 'var(--purple)', yellow: 'var(--yellow)', green: 'var(--green)' };
  const PaidHookCard = window.PaidHookCard;
  // Defensive: deep variant produces { raw, top, validated:true }; light produces
  // { raw, top }. If anything's missing fall back to deriving from raw.
  const top3 = (scores && scores.top && scores.top.length)
    ? scores.top
    : (scores && scores.raw)
      ? Object.entries(scores.raw).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => ({ code: k, score: v }))
      : [];
  const isValidated = !!(scores && scores.validated);

  // Match careers
  const careers = window.QUIZ_DATA.careers
    .map((c) => {
      const overlap = (c.riasec || []).filter((r) => top3.some((t) => t.code === r)).length;
      return { c, overlap };
    })
    .filter((x) => x.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 4);

  return (
    <div className="scroll-y" style={{ position: 'absolute', inset: 0, paddingBottom: 100 }}>
      <div style={{ background: 'var(--green)', padding: '20px 20px 36px', borderBottom: '2px solid #000', position: 'relative' }}>
        <div className="sticker sticker-purple tilt-r" style={{ marginBottom: 14 }}>{isValidated ? 'HOLLAND · VERSIUNE VALIDATĂ ✓' : 'HOLLAND · VERSIUNE SCURTĂ'}</div>
        <div className="h-xl" style={{ fontSize: 38, lineHeight: 1.0 }}>Codul tău</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {top3.map((t, i) => {
            const cd = codes[t.code];
            return (
              <div key={t.code} style={{
                width: 84, height: 84, background: i === 0 ? 'var(--purple)' : '#fff',
                color: i === 0 ? '#fff' : '#000', border: '2px solid #000',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                boxShadow: '4px 4px 0 #000', transform: `rotate(${(i - 1) * 3}deg)`,
              }}>
                <div className="h-xl" style={{ fontSize: 36, color: 'inherit' }}>{t.code}</div>
                <div className="label-sm" style={{ marginTop: 0, fontSize: 10 }}>{cd.short}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer differs based on which Holland variant produced the result */}
      {isValidated ? (
        <div className="card" style={{
          margin: '12px 20px 0', padding: 12,
          background: 'var(--green)', border: '2px solid #000',
        }}>
          <div className="label-bold" style={{ fontSize: 11, marginBottom: 4 }}>✓ TEST VALIDAT · 60 ITEMI</div>
          <div className="body-sm" style={{ fontSize: 13 }}>
            Acesta e codul tău Holland calculat din 60 de răspunsuri — versiunea folosită oficial. E cea mai precisă predicție a profilului tău vocațional din ce-ți putem oferi automat.
          </div>
        </div>
      ) : (
        <div className="card" style={{
          margin: '12px 20px 0', padding: 12,
          background: 'var(--yellow)', border: '2px solid #000',
        }}>
          <div className="label-bold" style={{ fontSize: 11, marginBottom: 4 }}>⚠ DOAR ORIENTATIV</div>
          <div className="body-sm" style={{ fontSize: 13 }}>
            Test scurt — orientativ. Pentru o predicție mai precisă, fă testul vocațional aprofundat (60 de itemi).
          </div>
        </div>
      )}

      <div style={{ padding: 20 }}>
        {top3.map((t) => {
          const cd = codes[t.code];
          return (
            <div key={t.code} className="card" style={{ padding: 16, marginBottom: 12, background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="h-sm">{cd.name}</div>
                <div style={{
                  background: colors[cd.color], color: cd.color === 'purple' ? '#fff' : '#000',
                  border: '2px solid #000', padding: '3px 10px', fontWeight: 800, fontSize: 13,
                }}>{cd.short}</div>
              </div>
              <div className="body-sm" style={{ marginTop: 6, color: 'var(--ink)' }}>{cd.desc}</div>
            </div>
          );
        })}

        {careers.length > 0 && (
          <>
            <div className="h-md" style={{ marginTop: 24, marginBottom: 10 }}>
              Cariere care îți merg
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {careers.map((m) => (
                <div key={m.c.id} className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 48, height: 48, background: colors[m.c.color], border: '2px solid #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: m.c.color === 'purple' ? '#fff' : '#000', flexShrink: 0,
                  }}>{m.c.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div className="h-sm" style={{ fontSize: 15 }}>{m.c.name}</div>
                    <div className="body-sm" style={{ color: 'var(--ink-soft)' }}>{m.c.tagline}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="card" style={{ padding: 18, marginTop: 20, background: 'var(--purple)', color: '#fff' }}>
          <div className="h-sm" style={{ color: '#fff' }}>Vezi toate variantele</div>
          <div className="body-sm" style={{ marginTop: 6, opacity: 0.9 }}>
            Browse cariere, trasee și universități care se potrivesc.
          </div>
          <button onClick={onBrowse} className="btn btn-yellow" style={{ marginTop: 14, width: '100%' }}>
            EXPLOREAZĂ →
          </button>
        </div>

        {/* Paid in-depth report hook — Phase 1 willingness-to-pay validator */}
        {PaidHookCard && (
          <PaidHookCard
            context="vocational-test"
            summary={`RIASEC top: ${(top3 || []).map(t => t.code).join('+')}`}
          />
        )}
      </div>
    </div>
  );
}

window.DeepResultsScreen = DeepResultsScreen;
