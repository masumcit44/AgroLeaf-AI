import React, { useState, useEffect } from 'react';
import useT from '../i18n/useT.js';

export default function SampleImagesStrip({ onSelectFile, disabled = false, className = '' }) {
  const { lang, t } = useT();
  const [samples, setSamples] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/samples/manifest.json')
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setSamples(data);
        }
      })
      .catch(() => {
        if (isMounted) setSamples([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // When manifest is missing or empty, render nothing
  if (!samples || samples.length === 0) {
    return null;
  }

  const handlePickSample = async (sample) => {
    if (disabled) return;
    setLoadFailed(false);
    try {
      const res = await fetch(sample.src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      onSelectFile(file);
    } catch (err) {
      // Samples are downloaded on tap, so this fails offline; say so (QA K2)
      console.error('Failed to load sample image:', err);
      setLoadFailed(true);
    }
  };

  return (
    <div className={`w-full max-w-sm mb-6 ${className}`}>
      <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 text-center">
        🌾 {t('trySamplePhoto')}
      </span>

      <div className="grid grid-cols-4 gap-2 mb-1.5">
        {samples.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={disabled}
            onClick={() => handlePickSample(s)}
            className="flex flex-col items-center bg-white border border-gray-200/90 rounded-xl p-1 hover:border-leaf-700/60 active:scale-95 transition-all cursor-pointer shadow-2xs group focus:outline-none focus:ring-2 focus:ring-leaf-400"
            aria-label={`${t('trySample')}: ${lang === 'en' ? s.labelEn : s.labelBn}`}
          >
            <img
              src={s.src}
              alt={lang === 'en' ? s.labelEn : s.labelBn}
              className="w-14 h-14 object-cover rounded-lg mb-1 group-hover:opacity-90"
              loading="lazy"
            />
            <span className="text-[10px] font-semibold text-gray-700 truncate w-full text-center">
              {lang === 'en' ? s.labelEn : s.labelBn}
            </span>
          </button>
        ))}
      </div>

      {loadFailed && (
        <p role="alert" className="text-xs text-red-700 text-center mb-1.5">
          {t('errSampleLoad')}
        </p>
      )}

      <span className="block text-[10px] text-gray-400 text-center">
        {t('sampleCredit')}
      </span>
    </div>
  );
}
