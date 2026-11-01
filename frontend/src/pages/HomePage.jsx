import React from 'react';
import useT from '../i18n/useT.js';
import BigButton from '../components/BigButton.jsx';
import PageContainer from '../components/PageContainer.jsx';

export default function HomePage() {
  const { t } = useT();

  return (
    <PageContainer className="items-center justify-center text-center py-8">
      {/* Visual Icon */}
      <div className="w-20 h-20 mb-4 bg-leaf-50 text-leaf-700 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-leaf-700/20">
        🌾
      </div>

      {/* Main Headline */}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-leaf-700 tracking-tight leading-snug max-w-sm mb-3">
        {t('homeHeadline')}
      </h1>

      {/* Instruction Subheadline */}
      <p className="text-base text-gray-600 max-w-sm mb-8 leading-relaxed">
        {t('homeSubheadline')}
      </p>

      {/* Big Action Button (Disabled for M02, enabled in M03) */}
      <div className="w-full max-w-sm mb-8">
        <BigButton
          disabled={true}
          note={t('homeComingSoon')}
          ariaLabel={t('homeTakePhotoBtn')}
        >
          {t('homeTakePhotoBtn')}
        </BigButton>
      </div>

      {/* Farmer Guidelines Card */}
      <div className="w-full max-w-sm bg-white border border-gray-200/80 rounded-xl p-4 text-left shadow-xs">
        <h2 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <span>💡</span>
          <span>সঠিক ফলাফলের টিপস (Photo Tips)</span>
        </h2>
        <ul className="text-xs sm:text-sm text-gray-600 space-y-1.5 list-disc list-inside">
          <li>কেবল একটি আক্রান্ত ধান পাতার স্পষ্ট ছবি তুলুন</li>
          <li>ছবি যেন ঝাপসা বা অতিরিক্ত অন্ধকার না হয়</li>
          <li>পাতাটি ক্যামেরার মাঝখানে ফোকাস রাখুন</li>
        </ul>
      </div>
    </PageContainer>
  );
}
