import React, { useEffect, useRef } from 'react';
import useT from '../i18n/useT.js';
import BigButton from './BigButton.jsx';
import PageContainer from './PageContainer.jsx';

export default function PreviewScreen({
  canvas,
  quality,
  onRetake,
  onAnalyze,
  isAnalyzing = false,
  modelProgress = null,
  errorKey = null,
  onRetry = null,
  onFocusCrop = null, // user-guided crop; null = button not shown (feature off)
}) {
  const { t } = useT();
  const canvasMountRef = useRef(null);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!canvas || !mountEl) return;

    mountEl.innerHTML = '';
    const displayCanvas = document.createElement('canvas');
    displayCanvas.width = canvas.width;
    displayCanvas.height = canvas.height;
    displayCanvas.className = 'w-auto max-w-full max-h-[48vh] object-contain rounded-xl shadow-xs border border-gray-200 mx-auto';
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
        className="w-full flex items-center justify-center min-h-[220px] bg-gray-100/70 rounded-2xl p-2 mb-3"
        role="img"
        aria-label={t('previewImageAria')}
      />

      {/* Inference Error Notification */}
      {errorKey && (
        <div className="w-full max-w-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-left flex items-start gap-2.5">
          <span className="text-xl shrink-0" aria-hidden="true">❌</span>
          <div className="flex-1">
            <span className="text-sm font-semibold text-red-700 block">
              {t(errorKey)}
            </span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 text-xs font-bold text-red-800 underline hover:text-red-900 cursor-pointer"
              >
                {t('btnTryAgain')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Non-blocking Quality Advisory Hint */}
      {hasHint && !errorKey && (
        <div className="w-full max-w-sm mb-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left flex items-start gap-2.5">
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

      {/* Analyzing Progress State */}
      {isAnalyzing && (
        <div className="w-full max-w-sm p-4 mb-4 bg-leaf-50 border border-leaf-700/30 rounded-2xl flex flex-col items-center text-center">
          <div className="flex items-center gap-3 text-leaf-700 font-bold text-sm mb-2">
            <svg className="animate-spin h-5 w-5 text-leaf-700 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span>
              {modelProgress !== null && modelProgress < 100
                ? `${t('modelLoadingProgress')} ${modelProgress}%`
                : t('analysingLeaf')}
            </span>
          </div>
          {modelProgress !== null && (
            <div className="w-full bg-leaf-200 rounded-full h-2 overflow-hidden mt-1">
              <div
                className="bg-leaf-700 h-2 transition-all duration-200 rounded-full"
                style={{ width: `${Math.max(5, modelProgress)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-sm space-y-3 mt-auto pt-2">
        <BigButton
          variant="primary"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          ariaLabel={t('btnCheck')}
        >
          {isAnalyzing ? t('analysingText') : t('btnCheck')}
        </BigButton>

        {onFocusCrop && (
          <div>
            <BigButton
              variant="secondary"
              onClick={onFocusCrop}
              disabled={isAnalyzing}
              ariaLabel={t('user_guided_crop.focusButton')}
            >
              {t('user_guided_crop.focusButton')}
            </BigButton>
            <p className="text-[11px] text-gray-500 text-center mt-1">{t('user_guided_crop.focusHint')}</p>
          </div>
        )}

        <BigButton
          variant="secondary"
          onClick={onRetake}
          disabled={isAnalyzing}
          ariaLabel={t('btnRetake')}
        >
          {t('btnRetake')}
        </BigButton>
      </div>
    </PageContainer>
  );
}
