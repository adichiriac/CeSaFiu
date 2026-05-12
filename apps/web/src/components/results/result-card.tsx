'use client';

/**
 * Phase D — Shareable card visual.
 *
 * Pure presentation. Three layout variants (minimal / paint / split) sharing
 * the same data interface so the orchestrator can pass identical props to
 * any variant and the html-to-image capture works the same way for each.
 *
 * The card renders at a fixed pixel size (`CARD_WIDTH × CARD_HEIGHT`) so the
 * PNG export is deterministic. Display scaling is the caller's responsibility
 * — wrap in a CSS `transform: scale(...)` container if needed.
 *
 * See docs/VIRAL-PHASE-D-PLAN.md §2.1 for the design intent of each variant.
 */

import {forwardRef} from 'react';

export type CardVariant = 'minimal' | 'paint' | 'split';

export type CardCareer = {
  name: string;
  score: number;
};

export type ResultCardProps = {
  variant: CardVariant;
  archetypeName: string;
  archetypeTag: string;
  archetypeGlyph: string;
  pair: string;        // e.g. "RI"
  topScore: number;    // % for the top match, displayed in the code stamp
  top3: CardCareer[];  // up to 3 careers
  brand: string;       // localized "Ce Să Fiu?" / "CeSăFiu?" label
  topEyebrow: string;  // localized "TOP 3 CARIERE" / "TOP 3 CAREERS"
  identityEyebrow: string; // localized "EȘTI" / "YOU ARE"
  footerUrl: string;   // "cesafiu.ro" — same in all locales
};

/** Native pixel size of the rendered card. PNG export multiplies by pixelRatio. */
export const CARD_WIDTH = 360;
export const CARD_HEIGHT = 640;

export const ResultCard = forwardRef<HTMLDivElement, ResultCardProps>(function ResultCard(
  props,
  ref
) {
  const {variant} = props;
  return (
    <div
      ref={ref}
      data-card-variant={variant}
      style={{
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Epilogue", system-ui, sans-serif',
        // Outer black border + shadow render as part of the captured PNG.
        border: '2px solid #000',
        boxShadow: '4px 4px 0 #000',
        background: variant === 'paint' ? 'var(--paper)' : 'var(--paper)',
        boxSizing: 'border-box',
      }}
    >
      {variant === 'minimal' && <MinimalVariant {...props} />}
      {variant === 'paint' && <PaintVariant {...props} />}
      {variant === 'split' && <SplitVariant {...props} />}
    </div>
  );
});

// ─── Shared bits ────────────────────────────────────────────────────────────

function BrandSticker({label, rotate = -3}: {label: string; rotate?: number}) {
  return (
    <div
      style={{
        display: 'inline-block',
        background: 'var(--yellow)',
        border: '2px solid #000',
        padding: '5px 12px',
        fontWeight: 900,
        fontSize: 13,
        letterSpacing: 0.5,
        transform: `rotate(${rotate}deg)`,
        boxShadow: '2px 2px 0 #000',
        color: '#000',
      }}
    >
      {label}
    </div>
  );
}

function CodeStamp({pair, score, accent = 'var(--purple)'}: {pair: string; score: number; accent?: string}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignSelf: 'flex-start',
        background: '#000',
        color: 'var(--yellow)',
        border: '2px solid #000',
        padding: '7px 12px',
        fontWeight: 900,
        fontSize: 15,
        letterSpacing: 2,
        fontFamily: 'ui-monospace, "SF Mono", monospace',
        boxShadow: `3px 3px 0 ${accent}`,
      }}
    >
      {pair}·{score}
    </div>
  );
}

function CareerRow({rank, name, score}: {rank: number; name: string; score: number}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 0',
        fontSize: 13,
        fontWeight: 700,
        color: '#000',
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          background: 'var(--purple)',
          color: '#fff',
          border: '1.5px solid #000',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 900,
          flexShrink: 0,
        }}
      >
        {rank}
      </span>
      <span style={{flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{name}</span>
      <span style={{fontFamily: 'ui-monospace, monospace', fontSize: 12, color: 'var(--ink-soft)'}}>{score}%</span>
    </div>
  );
}

/** Compute archetype name font-size so very long names still fit. */
function archetypeFontSize(name: string): number {
  if (name.length > 20) return 26;
  if (name.length > 14) return 32;
  return 40;
}

/**
 * Split variant uses a tighter, single-line scaling — names are allowed to
 * extend past the yellow wedge into the paper region but must not wrap.
 */
function splitArchetypeFontSize(name: string): number {
  if (name.length > 22) return 22;
  if (name.length > 17) return 28;
  if (name.length > 12) return 34;
  return 42;
}

// ─── Variant 1: Minimal ─────────────────────────────────────────────────────

function MinimalVariant(p: ResultCardProps) {
  return (
    <>
      {/* Dotted-grid texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          pointerEvents: 'none',
        }}
      />
      {/* Top */}
      <div style={{position: 'relative', padding: '14px 16px 6px', zIndex: 1}}>
        <BrandSticker label={p.brand} />
      </div>
      {/* Middle */}
      <div
        style={{
          position: 'absolute',
          top: 100,
          left: 18,
          right: 18,
          zIndex: 1,
        }}
      >
        <div style={{fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--ink-soft)', marginBottom: 8}}>
          {p.identityEyebrow}
        </div>
        <div
          style={{
            fontSize: archetypeFontSize(p.archetypeName),
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -1,
            color: '#000',
            marginBottom: 10,
            wordBreak: 'break-word',
          }}
        >
          {p.archetypeName}
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            color: 'var(--ink-soft)',
            marginBottom: 16,
            fontStyle: 'italic',
          }}
        >
          „{p.archetypeTag}"
        </div>
        <CodeStamp pair={p.pair} score={p.topScore} />
      </div>
      {/* Bottom */}
      <div style={{position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 1}}>
        <div style={{fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--ink-soft)', marginBottom: 6}}>
          {p.topEyebrow}
        </div>
        {p.top3.map((c, i) => (
          <CareerRow key={c.name} rank={i + 1} name={c.name} score={c.score} />
        ))}
        <div
          style={{
            marginTop: 10,
            fontSize: 10,
            color: 'var(--ink-soft)',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: 1,
            borderTop: '1px dashed #000',
            paddingTop: 8,
          }}
        >
          {p.footerUrl}
        </div>
      </div>
    </>
  );
}

// ─── Variant 2: Paint ───────────────────────────────────────────────────────

function PaintVariant(p: ResultCardProps) {
  return (
    <>
      {/* Purple top block */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '52%',
          background: 'var(--purple)',
        }}
      />
      {/* Brand sticker top-left */}
      <div style={{position: 'absolute', top: 14, left: 16, zIndex: 2}}>
        <BrandSticker label={p.brand} rotate={-4} />
      </div>
      {/* Big glyph top-right */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          fontSize: 56,
          color: 'var(--yellow)',
          lineHeight: 1,
          zIndex: 2,
          textShadow: '2px 2px 0 #000',
        }}
      >
        {p.archetypeGlyph}
      </div>
      {/* Archetype name on purple */}
      <div style={{position: 'absolute', top: 100, left: 18, right: 18, zIndex: 2}}>
        <div style={{fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--yellow)', marginBottom: 8}}>
          {p.identityEyebrow}
        </div>
        <div
          style={{
            fontSize: archetypeFontSize(p.archetypeName),
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -1,
            color: '#fff',
            wordBreak: 'break-word',
            textShadow: '3px 3px 0 #000',
          }}
        >
          {p.archetypeName}
        </div>
      </div>
      {/* Tagline on paper, just below the split */}
      <div style={{position: 'absolute', top: '54%', left: 18, right: 18, zIndex: 2}}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.4,
            color: 'var(--ink-soft)',
            fontStyle: 'italic',
            marginBottom: 14,
          }}
        >
          „{p.archetypeTag}"
        </div>
        <CodeStamp pair={p.pair} score={p.topScore} accent="var(--yellow)" />
      </div>
      {/* Bottom: top 3 + footer */}
      <div style={{position: 'absolute', left: 16, right: 16, bottom: 16, zIndex: 2}}>
        <div style={{fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--ink-soft)', marginBottom: 6}}>
          {p.topEyebrow}
        </div>
        {p.top3.map((c, i) => (
          <CareerRow key={c.name} rank={i + 1} name={c.name} score={c.score} />
        ))}
        <div
          style={{
            marginTop: 10,
            fontSize: 10,
            color: 'var(--ink-soft)',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: 1,
            borderTop: '1px dashed #000',
            paddingTop: 8,
          }}
        >
          {p.footerUrl}
        </div>
      </div>
    </>
  );
}

// ─── Variant 3: Split (diagonal two-tone) ──────────────────────────────────

function SplitVariant(p: ResultCardProps) {
  return (
    <>
      {/* Diagonal yellow wedge — decorative backdrop, no divider line */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--yellow)',
          clipPath: 'polygon(0 0, 65% 0, 35% 100%, 0 100%)',
        }}
      />
      {/* Brand sticker top-left, on yellow */}
      <div style={{position: 'absolute', top: 14, left: 16, zIndex: 2}}>
        <BrandSticker label={p.brand} rotate={-2} />
      </div>
      {/* Glyph top-right, on paper */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 18,
          fontSize: 44,
          color: 'var(--purple)',
          lineHeight: 1,
          zIndex: 2,
        }}
      >
        {p.archetypeGlyph}
      </div>
      {/* Archetype on full width — single line; may extend past the yellow wedge */}
      <div style={{position: 'absolute', top: 80, left: 16, right: 16, zIndex: 3}}>
        <div style={{fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: '#000', marginBottom: 6}}>
          {p.identityEyebrow}
        </div>
        <div
          style={{
            fontSize: splitArchetypeFontSize(p.archetypeName),
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -1,
            color: '#000',
            whiteSpace: 'nowrap',
          }}
        >
          {p.archetypeName}
        </div>
      </div>
      {/* Top 3 below archetype, full width */}
      <div style={{position: 'absolute', top: 175, left: 16, right: 16, zIndex: 3}}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1.5,
            color: 'var(--ink-soft)',
            marginBottom: 8,
            borderLeft: '3px solid var(--purple)',
            paddingLeft: 8,
          }}
        >
          {p.topEyebrow}
        </div>
        {p.top3.map((c, i) => (
          <CareerRow key={c.name} rank={i + 1} name={c.name} score={c.score} />
        ))}
      </div>
      {/* Tagline strip */}
      <div style={{position: 'absolute', left: 16, right: 16, bottom: 64, zIndex: 3}}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1.35,
            color: '#000',
            fontStyle: 'italic',
            background: 'rgba(255, 225, 112, 0.85)',
            padding: '6px 10px',
            border: '1.5px solid #000',
          }}
        >
          „{p.archetypeTag}"
        </div>
      </div>
      {/* Footer: code stamp + URL */}
      <div
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 3,
        }}
      >
        <CodeStamp pair={p.pair} score={p.topScore} accent="var(--purple)" />
        <span
          style={{
            fontSize: 11,
            color: 'var(--ink-soft)',
            fontFamily: 'ui-monospace, monospace',
            letterSpacing: 1,
          }}
        >
          {p.footerUrl}
        </span>
      </div>
    </>
  );
}
