import React from 'react';
import useT from '../i18n/useT.js';
import PageContainer from '../components/PageContainer.jsx';

export default function AboutPage() {
  const { t } = useT();
  const keyPoints = t('aboutKeyPoints') || [];

  return (
    <PageContainer>
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-leaf-700 mb-3 pb-2 border-b border-gray-100">
            {t('aboutTitle')}
          </h1>
          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            {t('aboutDescription')}
          </p>
        </div>

        {/* Key Principles */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-2.5">
            {t('aboutKeyPointsTitle')}
          </h2>
          <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
            {keyPoints.map((point, idx) => (
              <li key={idx} className="leading-relaxed">
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Competition */}
        <div className="p-3.5 bg-leaf-50 border border-leaf-700/20 rounded-lg">
          <h2 className="text-xs font-bold text-leaf-700 uppercase tracking-wider mb-1">
            {t('aboutCompetitionTitle')}
          </h2>
          <p className="text-sm font-semibold text-ink">
            {t('aboutCompetition')}
          </p>
        </div>

        {/* Dataset & Licences */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-2">
            {t('aboutDatasetTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            {t('aboutDatasetCredit')}
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
