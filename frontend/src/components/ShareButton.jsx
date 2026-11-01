import React, { useState } from 'react';
import useT from '../i18n/useT.js';

export default function ShareButton({
  classKey,
  diseaseData,
  isConfident = true,
  className = '',
}) {
  const { lang, t } = useT();
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const nameBn = diseaseData?.name_bn || classKey;
    const nameEn = diseaseData?.name_en || classKey;
    const whatToDo = lang === 'en'
      ? (diseaseData?.what_to_do_now_en || t('askOfficer'))
      : (diseaseData?.what_to_do_now_bn || t('askOfficer'));

    let shareText = '';
    if (isConfident) {
      shareText = lang === 'en'
        ? `AgroLeaf AI: Possible condition — ${nameEn}. ${whatToDo} Call 16123 for agricultural support. ${origin}`
        : `এগ্রোলিফ এআই: সম্ভাব্য সমস্যা — ${nameBn}। ${whatToDo} কৃষি পরামর্শে কল করুন ১৬১২৩। ${origin}`;
    } else {
      shareText = lang === 'en'
        ? `AgroLeaf AI: Leaf screening was inconclusive. Call 16123 for agricultural support. ${origin}`
        : `এগ্রোলিফ এআই: পাতার সমস্যাটি নিশ্চিত হওয়া যায়নি। পরামর্শের জন্য ১৬১২৩ কৃষি হেল্পলাইনে কল করুন। ${origin}`;
    }

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'AgroLeaf AI',
          text: shareText,
          url: origin,
        });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User closed native share dialog
      }
    }

    // Fallback: Copy text to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error('Clipboard write failed:', err);
      }
    }
  };

  return (
    <div className={`w-full max-w-sm relative ${className}`}>
      <button
        type="button"
        onClick={handleShare}
        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-800 font-bold rounded-2xl border border-gray-300 shadow-2xs text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-transform focus:outline-none focus:ring-4 focus:ring-gray-300"
        aria-label={t('shareResult')}
      >
        <span>📤</span>
        <span>{t('shareResult')}</span>
      </button>

      {/* Floating Copied Toast */}
      {copied && (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-opacity animate-bounce"
        >
          ✓ {t('shareCopied')}
        </div>
      )}
    </div>
  );
}
