import React from 'react';
import useT from '../i18n/useT.js';

const SAMPLES = [
  { id: 'blast', labelBn: 'ব্লাস্ট', labelEn: 'Blast', src: '/samples/sample_blast.jpg' },
  { id: 'brown_spot', labelBn: 'বাদামী দাগ', labelEn: 'Brown Spot', src: '/samples/sample_brown_spot.jpg' },
  { id: 'healthy', labelBn: 'সুস্থ', labelEn: 'Healthy', src: '/samples/sample_healthy.jpg' },
  { id: 'tungro', labelBn: 'টুংরো', labelEn: 'Tungro', src: '/samples/sample_tungro.jpg' },
];

export default function SampleImagesStrip({ onSelectFile, disabled = false, className = '' }) {
  const { lang, t } = useT();

  const handlePickSample = async (sample) => {
    if (disabled) return;
    try {
      const res = await fetch(sample.src);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const file = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });
      onSelectFile(file);
    } catch (err) {
      console.error('Failed to load sample image:', err);
    }
  };

  return (
    <div className={`w-full max-w-sm mb-6 ${className}`}>
      <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 text-center">
        🌾 {t('trySamplePhoto')}
      </span>

      <div className="grid grid-cols-4 gap-2 mb-1.5">
        {SAMPLES.map((s) => (
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

      <span className="block text-[10px] text-gray-400 text-center">
        {t('sampleCredit')}
      </span>
    </div>
  );
}
