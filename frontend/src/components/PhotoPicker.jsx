import React, { useRef } from 'react';
import useT from '../i18n/useT.js';

export default function PhotoPicker({ onFileSelect, onStartScanner, disabled = false }) {
  const { t } = useT();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input value so re-selecting the same file fires onChange
    e.target.value = '';
  };

  const handleCameraClick = () => {
    if (typeof onStartScanner === 'function') {
      onStartScanner();
    } else {
      cameraInputRef.current?.click();
    }
  };

  return (
    <div className="w-full flex flex-col sm:flex-row gap-3">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Camera Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleCameraClick}
        className="flex-1 min-h-[56px] px-5 py-3.5 bg-leaf-700 hover:bg-leaf-700/90 active:scale-[0.99] text-white font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={t('btnCamera')}
      >
        <span className="text-2xl" aria-hidden="true">📷</span>
        <span className="text-base sm:text-lg">{t('btnCamera')}</span>
      </button>

      {/* Gallery Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => galleryInputRef.current?.click()}
        className="flex-1 min-h-[56px] px-5 py-3.5 bg-white hover:bg-gray-50 active:scale-[0.99] text-ink border border-gray-300 font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label={t('btnGallery')}
      >
        <span className="text-2xl" aria-hidden="true">🖼️</span>
        <span className="text-base sm:text-lg">{t('btnGallery')}</span>
      </button>
    </div>
  );
}
