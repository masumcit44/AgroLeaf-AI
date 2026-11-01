import React, { useEffect, useRef } from 'react';
import useT from '../i18n/useT.js';
import BigButton from './BigButton.jsx';
import PageContainer from './PageContainer.jsx';

export default function PreviewScreen({ canvas, quality, onRetake, onAnalyze, isAnalyzing = false }) {
  const { t } = useT();
  const canvasMountRef = useRef(null);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!canvas || !mountEl) return;

    mountEl.innerHTML = '';
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = canvas.width;
    displayCanvas.height = canvas.height;
    displayCanvas.className = 'w-auto max-w-full max-h-[52vh] object-contain rounded-xl shadow-xs border border-gray-200 mx-auto';
    const ctx = displayCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);
    }
    mountEl.appendChild(displayCanvas);
  }, [canvas]);

  const hasHint = Boolean(quality?.hintKey);

  return (
    <PageContainer className="items-center py-4">
      {/* Title */}
      <h1 className="text-xl font-bold text-gray-800 mb-3 text-center">
        {t('previewTitle')}
      </h1>

      {/* Rendered Canvas Preview */}
      <div
        ref={canvasMountRef}
        className="w-full flex items-center justify-center min-h-[220px] bg-gray-100/70 rounded-2xl p-2 mb-4"
        role="img"
        aria-label={t('previewImageAria')}
      />

      {/* Non-blocking Quality Advisory Hint */}
      {hasHint && (
        <div className="w-full max-w-sm mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left flex items-start gap-2.5">
          <span className="text-xl shrink-0" aria-hidden="true">⚠️</span>
          <div className="flex-1">
            <span className="text-xs sm:text-sm font-semibold text-amber-800 leading-snug block">
              {t(quality.hintKey)}
            </span>
            <span className="text-[11px] text-amber-700 block mt-0.5">
              {t('hintNeverBlocks')}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-3 mt-auto pt-2">
        {/* Check Button (disabled until M04) */}
        <BigButton
          variant="primary"
          onClick={onAnalyze}
          disabled={true}
          note={t('modelBeingAdded')}
          ariaLabel={t('btnCheck')}
        >
          {isAnalyzing ? t('analysingText') : t('btnCheck')}
        </BigButton>

        {/* Retake Button */}
        <BigButton
          variant="secondary"
          onClick={onRetake}
          ariaLabel={t('btnRetake')}
        >
          {t('btnRetake')}
        </BigButton>
      </div>
    </PageContainer>
  );
}
