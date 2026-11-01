import React from 'react';
import useT from '../i18n/useT.js';
import PageContainer from '../components/PageContainer.jsx';

export default function AccuracyPage() {
  const { t } = useT();

  return (
    <PageContainer>
      <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-bold text-leaf-700 mb-4 pb-2 border-b border-gray-100">
          {t('accuracyTitle')}
        </h1>

        {/* Evaluation In Progress Banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⏳</span>
            <span className="font-bold text-amber-700 text-base">
              {t('evalInProgress')}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {t('evalInProgressDesc')}
          </p>
        </div>

        {/* Planned Metrics Structure */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-800">
            পরিমাপের মূল সূচকসমূহ (Evaluation Metrics)
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <span className="block text-xs text-gray-500 mb-1">Macro-F1</span>
              <span className="text-sm font-semibold text-gray-700">—</span>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <span className="block text-xs text-gray-500 mb-1">Selective Accuracy</span>
              <span className="text-sm font-semibold text-gray-700">—</span>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <span className="block text-xs text-gray-500 mb-1">Coverage Rate</span>
              <span className="text-sm font-semibold text-gray-700">—</span>
            </div>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <span className="block text-xs text-gray-500 mb-1">Expected Calibration (ECE)</span>
              <span className="text-sm font-semibold text-gray-700">—</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
