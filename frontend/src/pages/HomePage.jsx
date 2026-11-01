import React from 'react';
import useT from '../i18n/useT.js';
import PageContainer from '../components/PageContainer.jsx';
import PhotoPicker from '../components/PhotoPicker.jsx';
import PreviewScreen from '../components/PreviewScreen.jsx';
import { useScanFlow, SCAN_STEPS } from '../state/useScanFlow.js';

export default function HomePage() {
  const { t } = useT();
  const scanFlow = useScanFlow();

  // If in preview mode, render PreviewScreen
  if (scanFlow.step === SCAN_STEPS.PREVIEW && scanFlow.canvas) {
    return (
      <PreviewScreen
        canvas={scanFlow.canvas}
        quality={scanFlow.quality}
        onRetake={scanFlow.reset}
        onAnalyze={() => {
          // Handled in M04
        }}
      />
    );
  }

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
