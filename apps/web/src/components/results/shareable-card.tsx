'use client';

/**
 * Phase D — Shareable card orchestrator.
 *
 * Owns variant state, hosts the card visual, the variant picker, and the
 * download / share-as-image actions. The existing <ReferralShareCard /> is
 * untouched and handles the text/link share flow — this component is purely
 * about the visual artifact.
 *
 * The PNG export uses html-to-image via dynamic import.
 *
 * See docs/VIRAL-PHASE-D-PLAN.md §2.1 and §5 D1.
 */

import {useEffect, useMemo, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {deriveArchetype} from '@/lib/results/archetypes';
import {trackEvent} from '@/lib/analytics/umami';
import {ResultCard, type CardCareer, type CardVariant, CARD_WIDTH, CARD_HEIGHT} from './result-card';

const VARIANTS: CardVariant[] = ['minimal', 'paint', 'split'];

type ShareableCardProps = {
  locale: string;
  riasec: Record<string, number> | null | undefined;
  topScore: number;
  top3: CardCareer[];
};

export default function ShareableCard({locale, riasec, topScore, top3}: ShareableCardProps) {
  const t = useTranslations('shareableCard');
  const cardRef = useRef<HTMLDivElement | null>(null);
  // Randomize initial variant per session so no single layout dominates feeds.
  const [variant, setVariant] = useState<CardVariant>(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)]);
  const [downloading, setDownloading] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'preparing' | 'shared' | 'unsupported' | 'error'>('idle');

  const archetypeLocale = locale === 'en' ? 'en' : 'ro';
  const archetype = useMemo(() => deriveArchetype(riasec, archetypeLocale), [riasec, archetypeLocale]);

  // Fire `card_generated` once on mount. Intentionally empty-deps — re-firing
  // on prop changes would inflate the event count.
  const generatedFired = useRef(false);
  useEffect(() => {
    if (generatedFired.current) return;
    generatedFired.current = true;
    trackEvent('card_generated', {pair: archetype.pair, initial_variant: variant});
  }, [archetype.pair, variant]);

  function pickVariant(next: CardVariant) {
    if (next === variant) return;
    setVariant(next);
    trackEvent('card_variant_selected', {variant: next});
  }

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const mod = await loadHtmlToImage();
      if (!mod) {
        // Dep not installed — fail gracefully.
        setShareStatus('unsupported');
        window.setTimeout(() => setShareStatus('idle'), 2400);
        return;
      }
      const dataUrl = await mod.toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: '#fef9f1',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `cesafiu-${archetype.pair}${topScore}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      trackEvent('card_downloaded_png', {variant, pair: archetype.pair});
    } catch (err) {
      console.warn('[shareable-card] download failed', err);
      setShareStatus('error');
      window.setTimeout(() => setShareStatus('idle'), 2400);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShareImage() {
    if (!cardRef.current) return;
    setShareStatus('preparing');
    try {
      const mod = await loadHtmlToImage();
      if (!mod) {
        setShareStatus('unsupported');
        window.setTimeout(() => setShareStatus('idle'), 2400);
        return;
      }
      const blob = await mod.toBlob(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: '#fef9f1',
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
      });
      if (!blob) {
        setShareStatus('error');
        window.setTimeout(() => setShareStatus('idle'), 2400);
        return;
      }
      const file = new File([blob], `cesafiu-${archetype.pair}${topScore}.png`, {type: 'image/png'});
      const navAny = navigator as Navigator & {canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void>};
      const shareData: ShareData & {files?: File[]} = {
        title: t('shareTitle'),
        text: t('shareText', {archetype: archetype.name}),
        files: [file],
      };
      if (typeof navAny.canShare === 'function' && navAny.canShare(shareData) && typeof navAny.share === 'function') {
        await navAny.share(shareData);
        setShareStatus('shared');
        trackEvent('card_shared_native', {variant, pair: archetype.pair});
        window.setTimeout(() => setShareStatus('idle'), 2400);
      } else {
        setShareStatus('unsupported');
        window.setTimeout(() => setShareStatus('idle'), 2400);
      }
    } catch (err) {
      // User cancellation throws AbortError — treat as no-op.
      const code = (err as {name?: string} | null)?.name;
      if (code === 'AbortError') {
        setShareStatus('idle');
        return;
      }
      console.warn('[shareable-card] share image failed', err);
      setShareStatus('error');
      window.setTimeout(() => setShareStatus('idle'), 2400);
    }
  }

  return (
    <section
      className="shareableCardSection"
      style={{
        background: '#fff',
        border: '2px solid #000',
        boxShadow: '4px 4px 0 #000',
        padding: '18px 16px 20px',
        marginTop: 16,
      }}
    >
      <div style={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4}}>
        <div style={{fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: 'var(--ink-soft)', textTransform: 'uppercase'}}>
          {t('eyebrow')}
        </div>
        <div style={{fontSize: 10, color: 'var(--ink-soft)', fontFamily: 'ui-monospace, monospace'}}>{archetype.pair}·{topScore}</div>
      </div>
      <h3 style={{fontSize: 22, fontWeight: 900, lineHeight: 1.1, margin: '0 0 4px'}}>{t('title')}</h3>
      <p style={{fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 14px', lineHeight: 1.4}}>{t('lead')}</p>

      {/* Variant picker */}
      <div role="group" aria-label={t('pickerLabel')} style={{display: 'flex', gap: 8, marginBottom: 14}}>
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => pickVariant(v)}
            aria-pressed={variant === v}
            style={{
              flex: 1,
              padding: '10px 8px',
              border: '2px solid #000',
              background: variant === v ? 'var(--yellow)' : '#fff',
              boxShadow: variant === v ? '3px 3px 0 var(--purple)' : '2px 2px 0 #000',
              cursor: 'pointer',
              fontWeight: 900,
              fontSize: 11,
              letterSpacing: 1,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: '#000',
            }}
          >
            <VariantThumb variant={v} />
            {t(`variant.${v}`)}
          </button>
        ))}
      </div>

      {/* Scaled card preview (the captured element is full-size below) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}`,
          maxWidth: 280,
          margin: '0 auto 16px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            transform: 'scale(var(--card-scale, 0.78))',
            transformOrigin: 'top left',
            // Computed at runtime via CSS variable below.
          }}
        >
          <ResultCard
            ref={cardRef}
            variant={variant}
            archetypeName={archetype.name}
            archetypeTag={archetype.tag}
            archetypeGlyph={archetype.glyph}
            pair={archetype.pair}
            topScore={topScore}
            top3={top3.slice(0, 3)}
            brand={t('brand')}
            topEyebrow={t('topEyebrow')}
            identityEyebrow={t('identityEyebrow')}
            footerUrl="cesafiu.ro"
          />
        </div>
        <CardScaler />
      </div>

      {/* Actions */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8}}>
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          style={{
            background: 'var(--yellow)',
            color: '#000',
            border: '2px solid #000',
            padding: '12px 10px',
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: 1,
            cursor: downloading ? 'wait' : 'pointer',
            boxShadow: '3px 3px 0 #000',
            opacity: downloading ? 0.6 : 1,
            textTransform: 'uppercase',
          }}
        >
          {downloading ? t('downloadingCTA') : t('downloadCTA')}
        </button>
        <button
          type="button"
          onClick={handleShareImage}
          style={{
            background: 'var(--purple)',
            color: '#fff',
            border: '2px solid #000',
            padding: '12px 10px',
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: 1,
            cursor: 'pointer',
            boxShadow: '3px 3px 0 #000',
            textTransform: 'uppercase',
          }}
        >
          {shareStatus === 'preparing' ? t('preparingCTA') : t('shareCTA')}
        </button>
      </div>

      {/* Status messages */}
      {shareStatus === 'unsupported' && (
        <p style={{marginTop: 10, fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center'}}>{t('unsupportedHelp')}</p>
      )}
      {shareStatus === 'error' && (
        <p style={{marginTop: 10, fontSize: 11, color: '#b00', textAlign: 'center'}}>{t('errorHelp')}</p>
      )}
      {shareStatus === 'shared' && (
        <p style={{marginTop: 10, fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center'}}>{t('sharedHelp')}</p>
      )}
    </section>
  );
}

/** Sets a CSS variable on the parent so the inner card scales to fill the preview width. */
function CardScaler() {
  useEffect(() => {
    const apply = () => {
      const el = document.querySelector<HTMLElement>('.shareableCardSection');
      if (!el) return;
      const inner = el.querySelector<HTMLElement>('[data-card-variant]');
      const wrap = inner?.parentElement?.parentElement;
      if (!wrap) return;
      const target = wrap.getBoundingClientRect().width;
      if (target <= 0) return;
      const scale = target / CARD_WIDTH;
      wrap.style.setProperty('--card-scale', scale.toFixed(4));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);
  return null;
}

function VariantThumb({variant}: {variant: CardVariant}) {
  const size = 18;
  const common: React.CSSProperties = {
    width: size,
    height: size,
    border: '1.5px solid #000',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
  };
  if (variant === 'minimal') {
    return (
      <span
        style={{
          ...common,
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.45) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
          background: '#fef9f1',
        }}
      />
    );
  }
  if (variant === 'paint') {
    return (
      <span style={{...common, background: 'linear-gradient(to bottom, var(--purple) 55%, #fef9f1 55%)'}} />
    );
  }
  return (
    <span
      style={{
        ...common,
        background: '#fef9f1',
        backgroundImage: 'linear-gradient(135deg, var(--yellow) 50%, transparent 50%)',
      }}
    />
  );
}

// ─── html-to-image dynamic loader ──────────────────────────────────────────

type HtmlToImageModule = {
  toPng: (node: HTMLElement, options?: {pixelRatio?: number; backgroundColor?: string; width?: number; height?: number}) => Promise<string>;
  toBlob: (node: HTMLElement, options?: {pixelRatio?: number; backgroundColor?: string; width?: number; height?: number}) => Promise<Blob | null>;
};

let cached: HtmlToImageModule | null | undefined;

async function loadHtmlToImage(): Promise<HtmlToImageModule | null> {
  if (cached !== undefined) return cached;
  try {
    const mod = (await import('html-to-image')) as HtmlToImageModule;
    cached = mod;
    return mod;
  } catch (err) {
    console.warn('[shareable-card] html-to-image not available — install with `npm install html-to-image`', err);
    cached = null;
    return null;
  }
}
