import React, { useEffect } from 'react';
import useT from '../i18n/useT.js';
import PageContainer from '../components/PageContainer.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import PreviewScreen from '../components/PreviewScreen.jsx';
import BigButton from '../components/BigButton.jsx';
import { useScanFlow, SCAN_STEPS } from '../state/useScanFlow.js';
import { loadModel } from '../ml/loadModel.js';

export default function HomePage() {
  const { t } = useT();
  const scanFlow = useScanFlow();

  // Pre-load model after first paint in background idle callback
  useEffect(() => {
    let cancelIdle = null;
    let timer = null;

    if ('requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(() => {
        loadModel().catch((err) => {
          console.debug('Idle background model load deferred:', err.message);
        });
      }, { timeout: 2000 });
      cancelIdle = () => window.cancelIdleCallback(handle);
    } else {
      timer = setTimeout(() => {
        loadModel().catch((err) => {
          console.debug('Timer background model load deferred:', err.message);
        });
      }, 1500);
      cancelIdle = () => clearTimeout(timer);
    }

    return () => {
      if (cancelIdle) cancelIdle();
    };
  }, []);

  // 1. Preview / Analysing state
  if (
    (scanFlow.step === SCAN_STEPS.PREVIEW || scanFlow.step === SCAN_STEPS.ANALYSING) &&
    scanFlow.canvas
  ) {
    return (
      <PreviewScreen
        canvas={scanFlow.canvas}
        quality={scanFlow.quality}
        onRetake={scanFlow.reset}
        onAnalyze={scanFlow.runInference}
        isAnalyzing={scanFlow.step === SCAN_STEPS.ANALYSING}
        modelProgress={scanFlow.modelProgress}
        errorKey={scanFlow.inferenceError}
        onRetry={scanFlow.runInference}
      />
    );
  }

  // 2. Result state (M04 interim debug view, upgraded to cards in M05)
  if (scanFlow.step === SCAN_STEPS.RESULT && scanFlow.analysisResult) {
    const { probs, ms, calibration, decision } = scanFlow.analysisResult;
    const isPlaceholder = calibration?.placeholder === true;

    return (
      <PageContainer className="py-4">
        {/* Placeholder Warning Banner */}
        {isPlaceholder && (
          <div className="w-full bg-amber-500/15 border-2 border-amber-500/40 rounded-xl p-3 mb-4 text-center">
            <span className="text-amber-900 font-bold text-sm block">
              ⚠️ {t('demoModelBanner')}
            </span>
          </div>
        )}

        <h1 className="text-xl font-bold text-gray-800 mb-2 text-center">
          {t('resultTitle')}
        </h1>

        {/* Decision Badge */}
        <div className={`w-full p-3 rounded-xl mb-4 text-center font-bold text-sm ${
          decision.status === 'confident'
            ? 'bg-leaf-100 text-leaf-800 border border-leaf-700/30'
            : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}>
          <span>
            {decision.status === 'confident'
              ? `${t('decisionConfident')}: ${decision.top?.key}`
              : t('decisionNotSure')}
          </span>
        </div>

        {/* Interim Debug Probability Breakdown */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Class Probabilities
          </h2>
          <div className="space-y-2">
            {Object.entries(probs)
              .sort((a, b) => b[1] - a[1])
              .map(([clsKey, prob]) => {
                const pct = (prob * 100).toFixed(1);
                return (
                  <div key={clsKey} className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700 capitalize">
                      {clsKey.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-leaf-700 h-2 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono font-semibold text-gray-900">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500 text-right">
            {t('inferenceTime').replace('{ms}', ms)}
          </div>
        </div>

        {/* Reset / Test Another Button */}
        <div className="w-full mt-auto pt-2">
          <BigButton
            variant="primary"
            onClick={scanFlow.reset}
            ariaLabel={t('btnTestAnother')}
          >
            {t('btnTestAnother')}
          </BigButton>
        </div>
      </PageContainer>
    );
  }

  // 3. Idle / Landing State
  return (
    <PageContainer className="items-center justify-center text-center py-6">
      {/* Visual Badge */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-3 bg-leaf-50 text-leaf-700 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shadow-inner border border-leaf-700/20">
        🌾
      </div>

      {/* Main Headline */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-leaf-700 tracking-tight leading-snug max-w-sm mb-2">
        {t('homeHeadline')}
      </h1>

      {/* Subheadline */}
      <p className="text-sm sm:text-base text-gray-600 max-w-sm mb-6 leading-relaxed">
        {t('homeSubheadline')}
      </p>

      {/* Processing Loader */}
      {scanFlow.isProcessing && (
        <div className="w-full max-w-sm py-4 mb-4 bg-leaf-50 border border-leaf-700/30 rounded-xl flex items-center justify-center gap-3 text-leaf-700 font-semibold text-sm">
          <svg className="animate-spin h-5 w-5 text-leaf-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>{t('analysingText')}</span>
        </div>
      )}

      {/* Validation Error Alert */}
      {scanFlow.errorKey && (
        <div className="w-full max-w-sm mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-left flex items-start gap-2.5">
          <span className="text-xl shrink-0" aria-hidden="true">❌</span>
          <div className="flex-1">
            <span className="text-sm font-bold text-red-700 block">
              {t(scanFlow.errorKey)}
            </span>
          </div>
        </div>
      )}

      {/* Action: Photo Picker (Camera & Gallery buttons) */}
      <div className="w-full max-w-sm mb-7">
        <PhotoPicker
          onFileSelect={scanFlow.selectFile}
          disabled={scanFlow.isProcessing}
        />
      </div>

      {/* 3 Pictogram Tips */}
      <div className="w-full max-w-sm grid grid-cols-3 gap-2 mb-6">
        <div className="bg-white border border-gray-200/80 rounded-xl p-2.5 flex flex-col items-center text-center shadow-xs">
          <span className="text-2xl mb-1" aria-hidden="true">🍃</span>
          <span className="text-xs font-bold text-gray-700 leading-tight">
            {t('tipOneLeaf')}
          </span>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-xl p-2.5 flex flex-col items-center text-center shadow-xs">
          <span className="text-2xl mb-1" aria-hidden="true">☀️</span>
          <span className="text-xs font-bold text-gray-700 leading-tight">
            {t('tipDaylight')}
          </span>
        </div>
        <div className="bg-white border border-gray-200/80 rounded-xl p-2.5 flex flex-col items-center text-center shadow-xs">
          <span className="text-2xl mb-1" aria-hidden="true">🔍</span>
          <span className="text-xs font-bold text-gray-700 leading-tight">
            {t('tipCloseUp')}
          </span>
        </div>
      </div>
    </PageContainer>
  );
}
