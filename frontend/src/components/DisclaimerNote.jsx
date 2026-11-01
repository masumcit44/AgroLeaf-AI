import React from 'react';
import useT from '../i18n/useT.js';

export default function DisclaimerNote({ metaDisclaimer, className = '' }) {
  const { t } = useT();
  const text = metaDisclaimer || t('footerDisclaimer');

  return (
    <div className={`w-full max-w-sm p-3.5 bg-gray-50 border border-gray-200/80 rounded-xl text-center text-xs text-gray-600 leading-relaxed ${className}`}>
      <span className="font-semibold text-gray-700 block mb-1">
        ℹ️ {t('footerDisclaimer')}
      </span>
      {metaDisclaimer && metaDisclaimer !== t('footerDisclaimer') && (
        <span className="block mt-1 text-[11px] text-gray-500">
          {text}
        </span>
      )}
    </div>
  );
}
