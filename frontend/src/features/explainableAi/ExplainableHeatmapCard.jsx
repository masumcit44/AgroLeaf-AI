// F11 Explainable AI Heatmap & Disease Highlighting Component
// Mobile-first, interactive 3-way view (Original / Heatmap / Overlay)
// Powered by on-device Class Activation Mapping (CAM) from EfficientNet-B0 v10.

import React, { useState, useEffect, useRef } from 'react';
import useT from '../../i18n/useT.js';
import { extractClassCam } from './camEngine.js';
import {
  valueToRgba,
  upsampleBilinear,
  calculateSourceCropMapping,
} from './heatmapRenderer.js';

export function ExplainableHeatmapCard({ scan, context }) {
  const { lang, t } = useT();
  const [activeView, setActiveView] = useState('overlay'); // 'original' | 'heatmap' | 'overlay'
  const [opacity, setOpacity] = useState(0.65);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const canvasRef = useRef(null);

  const isResultContext = context === 'result' && Boolean(scan);
  const sourceCanvas = scan?.canvas;
  const decision = scan?.decision;
  const camMaps = scan?.camMaps;
  const isConfident = Boolean(scan?.isConfident && decision?.status === 'confident');
  const targetClassKey = scan?.classKey || decision?.top?.key || 'not_sure';
  const isNotSure = !isConfident || targetClassKey === 'not_sure' || targetClassKey === 'not_rice';

  // Extract CAM data for target class
  const camResult = isResultContext ? extractClassCam(camMaps, targetClassKey) : null;

  // Render on-screen canvas whenever activeView, opacity, or sourceCanvas changes
  useEffect(() => {
    if (!isResultContext) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Base dimensions
    const width = 320;
    const height = 320;
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Original Image (if available)
    if (activeView === 'original' || activeView === 'overlay') {
      if (sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
        // Calculate center crop mapping so original leaf matches the 320x320 model view
        const mapping = calculateSourceCropMapping(sourceCanvas.width, sourceCanvas.height, 320, 366);
        ctx.drawImage(
          sourceCanvas,
          mapping.cropX,
          mapping.cropY,
          mapping.cropW,
          mapping.cropH,
          0,
          0,
          width,
          height
        );
      } else {
        // Neutral placeholder if no source canvas
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, width, height);
      }
    } else {
      // Heatmap-only view: dark neutral background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Draw Heatmap (if activeView is 'heatmap' or 'overlay' and CAM exists)
    if ((activeView === 'heatmap' || activeView === 'overlay') && camResult && !camResult.isDegraded) {
      // Upsample 10x10 CAM grid to 320x320 using bilinear interpolation
      const upsampled = upsampleBilinear(camResult.grid, 10, 10, width, height);
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;

      // heatmap mode: full-spectrum thermal palette (fully opaque)
      // overlay mode: amber→crimson high-contrast palette over green leaf
      const renderMode = activeView === 'heatmap' ? 'heatmap' : 'overlay';
      const activeAlpha = activeView === 'heatmap' ? 1.0 : opacity;

      for (let i = 0; i < width * height; i++) {
        const val = upsampled[i];
        const [r, g, b, a] = valueToRgba(val, activeAlpha, renderMode);
        const idx = i * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }

      // Draw heatmap onto offscreen canvas then composite
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.putImageData(imgData, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
  }, [isResultContext, activeView, opacity, sourceCanvas, camResult]);

  // Early return if not in result context or scan missing
  if (!isResultContext) {
    return null;
  }

  // CAM unavailable — no data, degraded, or PWA cache miss (old model)
  const camUnavailable = !camResult || camResult.isDegraded;

  // Explanation text depending on diagnosis
  let explanationText = t('explainableAi.explanationSimple');
  if (isNotSure) {
    explanationText = t('explainableAi.notSureExplanation');
  } else if (targetClassKey === 'healthy') {
    explanationText = t('explainableAi.healthyExplanation');
  }

  return (
    <section
      role="region"
      aria-labelledby="explainable-heatmap-title"
      data-testid="explainable-heatmap-card"
      className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4 text-left transition-all"
    >
      {/* 1. Header with Icon & Subtitle */}
      <div className="border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🔬</span>
          <div>
            <h3 id="explainable-heatmap-title" className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight leading-snug">
              {t('explainableAi.cardTitle')}
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {t('explainableAi.cardSubtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* CAM Unavailable Fallback — honest message, no fake heatmap */}
      {camUnavailable && !isNotSure && targetClassKey !== 'healthy' && (
        <div
          data-testid="cam-unavailable-notice"
          className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed"
        >
          <p className="font-semibold mb-1">
            {lang === 'bn' ? '⚠️ AI হাইলাইট পাওয়া যায়নি' : '⚠️ AI Highlight Unavailable'}
          </p>
          <p>{t('explainableAi.camUnavailable')}</p>
        </div>
      )}

      {/* 2. Interactive 3-Way Segmented View Tabs */}
      <div
        className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl"
        role="tablist"
        aria-label="Image view selection"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'original'}
          onClick={() => setActiveView('original')}
          className={`min-h-[44px] flex items-center justify-center py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeView === 'original'
              ? 'bg-white text-gray-900 shadow-xs ring-1 ring-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          {t('explainableAi.tabOriginal')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'overlay'}
          onClick={() => setActiveView('overlay')}
          className={`min-h-[44px] flex items-center justify-center py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeView === 'overlay'
              ? 'bg-leaf-600 text-white shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          {t('explainableAi.tabOverlay')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'heatmap'}
          onClick={() => setActiveView('heatmap')}
          className={`min-h-[44px] flex items-center justify-center py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeView === 'heatmap'
              ? 'bg-white text-gray-900 shadow-xs ring-1 ring-gray-200'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
          }`}
        >
          {t('explainableAi.tabHeatmap')}
        </button>
      </div>

      {/* 3. Heatmap / Leaf Viewport Canvas Container */}
      <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-2xl overflow-hidden border border-gray-200 bg-gray-950 shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          data-testid="heatmap-canvas"
          className="w-full h-full object-contain"
        />

        {/* Floating Mode Pill on top-right */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded-full border border-white/20 pointer-events-none">
          {activeView === 'overlay' && (lang === 'bn' ? 'মিশ্র ভিউ' : 'Blended')}
          {activeView === 'original' && (lang === 'bn' ? 'আসল ছবি' : 'Original')}
          {activeView === 'heatmap' && (lang === 'bn' ? 'হিটম্যাপ' : 'Heatmap')}
        </div>
      </div>

      {/* 4. Opacity Slider Control (visible in Overlay mode) */}
      {activeView === 'overlay' && (
        <div className="space-y-1.5 pt-1 px-1">
          <div className="flex justify-between items-center text-xs font-semibold text-gray-700">
            <label htmlFor="heatmap-opacity-slider">
              {t('explainableAi.opacityLabel')}: {Math.round(opacity * 100)}%
            </label>
          </div>
          <input
            id="heatmap-opacity-slider"
            type="range"
            min="0.20"
            max="0.90"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-leaf-600"
            aria-label={t('explainableAi.opacityLabel')}
          />
        </div>
      )}

      {/* 5. Attribution Legend */}
      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-3 space-y-1.5">
        <div className="flex justify-between items-center text-xs text-gray-600 font-semibold">
          <span>{t('explainableAi.legendLow')}</span>
          <span className="font-bold text-gray-700">{t('explainableAi.legendTitle')}</span>
          <span>{t('explainableAi.legendHigh')}</span>
        </div>
        {/* Continuous gradient bar — matches overlay colormap: amber → orange → crimson */}
        <div
          className="w-full h-3 rounded-full border border-gray-300 shadow-2xs"
          style={{
            background: 'linear-gradient(to right, rgba(255,210,15,0.5) 0%, rgba(255,155,0,0.7) 40%, rgba(250,75,10,0.85) 72%, rgba(230,20,20,0.95) 100%)',
          }}
          aria-hidden="true"
        />
      </div>

      {/* 6. Simple Farmer Explanation */}
      <div className="bg-leaf-50/70 border border-leaf-200 rounded-xl p-3 text-xs text-gray-800 leading-relaxed space-y-1">
        <p className="font-medium">
          {explanationText}
        </p>
        {!isNotSure && targetClassKey !== 'healthy' && (
          <p className="text-leaf-900 font-semibold text-[11px] pt-0.5">
            {t('explainableAi.explanationNote')}
          </p>
        )}
      </div>

      {/* 7. Collapsible Technical Verification (for Judges and Evaluators) */}
      <div className="pt-1">
        <button
          type="button"
          id="xai-technical-toggle"
          onClick={() => setDetailsOpen((prev) => !prev)}
          className="w-full min-h-[44px] flex items-center justify-between text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          aria-expanded={detailsOpen}
          aria-controls="xai-technical-content"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden="true">⚙️</span>
            <span>{t('explainableAi.technicalDetailsToggle')}</span>
          </span>
          <span className="text-xs transition-transform duration-200" aria-hidden="true">
            {detailsOpen ? '▲' : '▼'}
          </span>
        </button>

        <div
          id="xai-technical-content"
          hidden={!detailsOpen}
          className="p-3 mt-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 space-y-2 leading-relaxed"
        >
          <div>
            <strong className="text-gray-800">• {t('explainableAi.techModel')}</strong>
          </div>
          <div>
            <strong className="text-gray-800">• {t('explainableAi.techMethod')}</strong>
          </div>
          <div>
            <strong className="text-gray-800">• {t('explainableAi.techLayer')}</strong>
          </div>
          <div>
            <strong className="text-gray-800">• {t('explainableAi.techLatency')}</strong>
          </div>
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
            {t('explainableAi.techDisclaimer')}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ExplainableHeatmapCard;
