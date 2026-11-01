import React, { useEffect, useRef } from 'react';
import useT from '../i18n/useT.js';
import PageContainer from './PageContainer.jsx';
import ResultCard from './ResultCard.jsx';
import NotSureCard from './NotSureCard.jsx';
import CallHelpButton from './CallHelpButton.jsx';
import DisclaimerNote from './DisclaimerNote.jsx';
import BigButton from './BigButton.jsx';
import { stopActiveAudio } from '../lib/audioManager.js';

export default function ResultScreen({
  canvas,
  analysisResult,
  diseaseKnowledge = {},
  onRetake,
}) {
  const { t } = useT();
  const thumbnailMountRef = useRef(null);

  // Scroll smoothly to top on result screen mount and stop any audio on unmount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      stopActiveAudio();
    };
  }, []);

  // Mount downscaled image thumbnail
  useEffect(() => {
    const mountEl = thumbnailMountRef.current;
    if (!canvas || !mountEl) return;

    mountEl.innerHTML = '';
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = canvas.width;
    thumbCanvas.height = canvas.height;
    thumbCanvas.className = 'h-28 sm:h-32 w-auto max-w-full object-contain rounded-2xl border border-gray-200 shadow-xs mx-auto';
    const ctx = thumbCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);
    }
    mountEl.appendChild(thumbCanvas);
  }, [canvas]);

  const { calibration, decision } = analysisResult;
  const isPlaceholder = calibration?.placeholder === true;
  const isConfident = decision.status === 'confident' && decision.top;
  const metaDisclaimer = diseaseKnowledge?._meta?.disclaimer_bn;
  const classesData = diseaseKnowledge?.classes || {};

  return (
    <PageContainer className="items-center py-4 space-y-4">
      {/* Demo Model Banner (if placeholder model) */}
      {isPlaceholder && (
        <div className="w-full max-w-sm bg-amber-500/15 border-2 border-amber-500/40 rounded-2xl p-3 text-center">
          <span className="text-amber-900 font-bold text-xs sm:text-sm block">
            ⚠️ {t('demoModelBanner')}
          </span>
        </div>
      )}

      {/* Captured Photo Thumbnail */}
      {canvas && (
        <div
          ref={thumbnailMountRef}
          className="w-full flex items-center justify-center"
          role="img"
          aria-label={t('previewImageAria')}
        />
      )}

      {/* Main Result Card */}
      {isConfident ? (
        <ResultCard
          classKey={decision.top.key}
          prob={decision.top.prob}
          diseaseData={classesData[decision.top.key]}
        />
      ) : (
        <NotSureCard
          top2={decision.top2}
          diseaseInfo={classesData}
        />
      )}

      {/* 16123 Helpline Button */}
      <CallHelpButton />

      {/* Retake Photo Button */}
      <div className="w-full max-w-sm">
        <BigButton
          variant="secondary"
          onClick={() => {
            stopActiveAudio();
            onRetake();
          }}
          ariaLabel={t('btnRetakePhoto')}
        >
          {t('btnRetakePhoto')}
        </BigButton>
      </div>

      {/* Disclaimer Note */}
      <DisclaimerNote metaDisclaimer={metaDisclaimer} />
    </PageContainer>
  );
}
