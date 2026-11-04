import React, { useState } from 'react';
import useT from '../i18n/useT.js';

const STORAGE_KEY = 'agroleaf_onboarding_dismissed';

export default function OnboardingStrip({ className = '' }) {
  const { t } = useT();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (dismissed) {
    return null;
  }

  return (
    <div
      className={`w-full max-w-sm mb-5 p-3.5 bg-leaf-50 border border-leaf-700/20 rounded-2xl relative shadow-2xs ${className}`}
      role="region"
      aria-label={t('onboardingTitle')}
    >
      {/* Dismiss Button - Accessible Touch Target */}
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-1 right-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-leaf-400"
        aria-label={t('dismiss')}
      >
        ✕
      </button>

      <span className="block text-xs font-bold text-leaf-800 uppercase tracking-wider mb-2.5">
        💡 {t('onboardingTitle')}
      </span>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xl mb-1" aria-hidden="true">📸</span>
          <span className="text-[11px] font-semibold text-gray-800 leading-tight">
            {t('step1Photo')}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl mb-1" aria-hidden="true">⏳</span>
          <span className="text-[11px] font-semibold text-gray-800 leading-tight">
            {t('step2Wait')}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl mb-1" aria-hidden="true">🔊</span>
          <span className="text-[11px] font-semibold text-gray-800 leading-tight">
            {t('step3Listen')}
          </span>
        </div>
      </div>
    </div>
  );
}
