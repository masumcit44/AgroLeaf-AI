import React from 'react';
import useT from '../i18n/useT.js';
import PageContainer from '../components/PageContainer.jsx';

export default function AboutPage() {
  const { t } = useT();
  const keyPoints = t('aboutKeyPoints') || [];

  return (
    <PageContainer className="py-4">
      <div className="bg-white border border-gray-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6 text-left">
        {/* Title & Introduction */}
        <div>
          <h1 className="text-2xl font-extrabold text-leaf-700 mb-2 pb-2 border-b border-gray-100">
            {t('aboutTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            {t('aboutDescription')}
          </p>
        </div>

        {/* What the app is and isn't */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">
            ⚖️ {t('aboutWhatIsTitle')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-emerald-950">
              <span className="font-bold block mb-1">{t('whatItIsLabel')}</span>
              <span className="leading-relaxed">{t('aboutWhatItIs')}</span>
            </div>
            <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-2xl text-red-950">
              <span className="font-bold block mb-1">{t('whatItIsNotLabel')}</span>
              <span className="leading-relaxed">{t('aboutWhatItIsNot')}</span>
            </div>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-4 bg-leaf-50/60 border border-leaf-700/20 rounded-2xl space-y-1">
          <h2 className="text-sm font-bold text-leaf-800">
            🔒 {t('aboutPrivacyTitle')}
          </h2>
          <p className="text-xs text-gray-700 leading-relaxed">
            {t('aboutPrivacyDesc')}
          </p>
        </div>

        {/* Key Principles */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-2">
            🌱 {t('aboutKeyPointsTitle')}
          </h2>
          <ul className="text-xs sm:text-sm text-gray-700 space-y-2 list-disc list-inside leading-relaxed">
            {keyPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>

        {/* Audio AI Voice Disclaimer */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl space-y-1">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            🔊 {t('aboutVoiceTitle')}
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t('aboutVoiceDesc')}
          </p>
        </div>

        {/* Dataset Credits & Citations */}
        <div className="border-t border-gray-100 pt-4 space-y-2">
          <h2 className="text-sm font-bold text-gray-900">
            📚 {t('aboutDatasetTitle')}
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            {t('aboutDatasetCredit')}
          </p>
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>{t('aboutMapCreditTitle') || (t('lang') === 'en' ? 'Map Boundaries:' : 'মানচিত্রের সীমানা:')}</strong>{' '}
            geoBoundaries / BBS / OCHA ROAP (CC BY 4.0)
          </p>
          <div className="text-[11px] text-gray-500 pt-1">
            <strong>{t('aboutOfficialSource')}:</strong>{' '}
            <a
              href="https://www.bamis.gov.bd/diseases/1/all/76"
              target="_blank"
              rel="noopener noreferrer"
              className="text-leaf-700 font-semibold underline hover:text-leaf-800"
            >
              {t('aboutOfficialSourceName')} ↗
            </a>
          </div>
        </div>

        {/* Competition Attribution */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
          <span className="text-xs font-bold text-amber-900 block">
            {t('builtForAignite')}
          </span>
        </div>

        {/* Open Source & Contact */}
        <div className="text-center pt-2">
          <p className="text-xs text-gray-500 mb-1">
            {t('aboutContactDesc')}
          </p>
          <a
            href="https://github.com/masumcit44/AgroLeaf-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-leaf-700 hover:text-leaf-800 underline"
          >
            <span>GitHub: masumcit44/AgroLeaf-AI</span>
            <span>↗</span>
          </a>
        </div>
      </div>
    </PageContainer>
  );
}
