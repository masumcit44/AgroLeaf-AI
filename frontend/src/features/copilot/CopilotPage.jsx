import React from 'react';
import FarmerCopilotCard from './FarmerCopilotCard.jsx';
import useT from '../../i18n/useT.js';

export default function CopilotPage() {
  const { lang } = useT();

  return (
    <main className="max-w-xl mx-auto px-4 py-4 pb-20">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <span>🎙️</span>
          <span>{lang === 'en' ? 'AgroLeaf Farmer Copilot' : 'এগ্রোলিফ কৃষক সহকারী'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {lang === 'en'
            ? 'Voice-first agricultural Q&A grounded in BRRI & DAE verified evidence.'
            : 'বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI) ও কৃষি সম্প্রসারণ অধিদপ্তর (DAE) নির্দেশিত ভয়েস সহকারী।'}
        </p>
      </div>

      {/* Standalone Voice Copilot Card */}
      <FarmerCopilotCard />

      {/* Trust & Evidence Footer Banner */}
      <div className="mt-6 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 space-y-1.5">
        <div className="flex items-center space-x-1.5 font-bold text-gray-800">
          <span>🏛️</span>
          <span>তথ্যসূত্র ও বৈজ্ঞানিক ভিত্তি:</span>
        </div>
        <p>
          সকল তথ্য ও বালাই ব্যবস্থাপনা বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI)-এর "আধুনিক ধানের চাষ" এবং কৃষি সম্প্রসারণ অধিদপ্তরের (DAE) বামিস নির্দেশিকা অনুযায়ী সংকলিত।
        </p>
        <div className="pt-1 flex items-center justify-between text-leaf-800 font-semibold">
          <span>টোল-ফ্রি হেল্পলাইন: ১৬১২৩</span>
          <a href="tel:16123" className="underline hover:text-leaf-950">
            কল করুন →
          </a>
        </div>
      </div>
    </main>
  );
}

