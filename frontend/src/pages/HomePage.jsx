import React, { useEffect, useState } from 'react';
import useT from '../i18n/useT.js';
import PageContainer from '../components/PageContainer.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import PreviewScreen from '../components/PreviewScreen.jsx';
import ResultScreen from '../components/ResultScreen.jsx';
import OnboardingStrip from '../components/OnboardingStrip.jsx';
import SampleImagesStrip from '../components/SampleImagesStrip.jsx';
import { useScanFlow, SCAN_STEPS } from '../state/useScanFlow.js';
import { loadModel } from '../ml/loadModel.js';
import { getDiseaseKnowledge } from '../lib/diseaseKnowledge.js';
import { FeatureSlot } from '../features/slots.jsx';
import { isFeatureOn } from '../features/flags.js';
import CropScreen from '../features/user_guided_crop/CropScreen.jsx';

export default function HomePage() {
  const { lang, t } = useT();
  const scanFlow = useScanFlow();
  const [diseaseKnowledge, setDiseaseKnowledge] = useState(null);
  const [devForcedResult, setDevForcedResult] = useState(() => {
    if (typeof window !== 'undefined') {
      const isLocalOrDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalOrDev) {
        const params = new URLSearchParams(window.location.search);
      const forceKey = params.get('force');
      if (forceKey) {
        const isNotSure = forceKey === 'not_sure';
        return {
          probs: { [forceKey]: 0.95 },
          ms: 142,
          calibration: { placeholder: true },
          decision: isNotSure
            ? {
                status: 'not_sure',
                top: { key: 'blast', prob: 0.48 },
                top2: [
                  { key: 'blast', prob: 0.48 },
                  { key: 'brown_spot', prob: 0.36 },
                ],
              }
            : {
                status: 'confident',
                top: { key: forceKey, prob: 0.92 },
                top2: [
                  { key: forceKey, prob: 0.92 },
                  { key: 'brown_spot', prob: 0.05 },
                ],
              },
        };
      }
    }
  }
  return null;
});

  // Pre-fetch disease knowledge whenever language changes
  useEffect(() => {
    let active = true;
    getDiseaseKnowledge(lang)
      .then((data) => {
        if (active) setDiseaseKnowledge(data);
      })
      .catch((err) => {
        console.error('Failed to load disease knowledge:', err);
      });
    return () => {
      active = false;
    };
  }, [lang]);

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

  // Dev-only forced result view
  if (import.meta.env.DEV && devForcedResult && diseaseKnowledge) {
    return (
      <ResultScreen
        canvas={scanFlow.canvas}
        analysisResult={devForcedResult}
        diseaseKnowledge={diseaseKnowledge}
        onRetake={() => {
          setDevForcedResult(null);
          // clear query string without reload
          window.history.replaceState({}, '', window.location.pathname);
          scanFlow.reset();
        }}
      />
    );
  }

  // User-guided crop (flag user_guided_crop; off = this whole branch never runs)
  const cropOn = isFeatureOn('user_guided_crop');
  // The image being analysed: the farmer's selected area, or the full photo
  const analysedCanvas = scanFlow.analysisCanvas || scanFlow.canvas;
  const analyseAgain = () => scanFlow.runInference(scanFlow.analysisCanvas || undefined);

  if (cropOn && scanFlow.step === SCAN_STEPS.CROP && scanFlow.canvas) {
    return (
      <CropScreen
        canvas={scanFlow.canvas}
        initialBox={scanFlow.cropBox}
        onConfirm={scanFlow.confirmCrop}
        onCancel={scanFlow.cancelCrop}
        onAnalyseFull={() => scanFlow.runInference()}
      />
    );
  }

  // 1. Preview / Analysing state
  if (
    (scanFlow.step === SCAN_STEPS.PREVIEW || scanFlow.step === SCAN_STEPS.ANALYSING) &&
    scanFlow.canvas
  ) {
    return (
      <PreviewScreen
        canvas={analysedCanvas}
        quality={scanFlow.quality}
        onRetake={scanFlow.reset}
        onAnalyze={analyseAgain}
        isAnalyzing={scanFlow.step === SCAN_STEPS.ANALYSING}
        modelProgress={scanFlow.modelProgress}
        errorKey={scanFlow.inferenceError}
        onRetry={analyseAgain}
        onFocusCrop={cropOn ? scanFlow.startCrop : null}
      />
    );
  }

  // 2. Result state
  if (scanFlow.step === SCAN_STEPS.RESULT && scanFlow.analysisResult) {
    return (
      <ResultScreen
        canvas={analysedCanvas}
        analysisResult={scanFlow.analysisResult}
        diseaseKnowledge={diseaseKnowledge}
        onRetake={scanFlow.reset}
        onRecrop={cropOn ? scanFlow.startCrop : null}
        cropUsed={cropOn && Boolean(scanFlow.analysisCanvas)}
        cropFallback={cropOn && scanFlow.cropFallback}
      />
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

      {/* First-Visit Onboarding Strip */}
      <OnboardingStrip />

      {/* F8–F23 feature slots (off until enabled in features/flags.js) */}
      <FeatureSlot slot="home" />

      {/* Action: Photo Picker (Camera & Gallery buttons) */}
      <div className="w-full max-w-sm mb-6">
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

      {/* Sample Leaf Photos Row */}
      <SampleImagesStrip
        onSelectFile={scanFlow.selectFile}
        disabled={scanFlow.isProcessing}
      />
    </PageContainer>
  );
}
