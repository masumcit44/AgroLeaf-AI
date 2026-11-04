import React, { useState, useEffect } from 'react';
import useT from '../../i18n/useT.js';
import { getDueReminders } from './remindersStore.js';
import { toBanglaDigits } from './remindersLogic.js';

export default function DueBanner() {
  const { lang } = useT();
  const isBn = lang === 'bn';
  const [dueList, setDueList] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    getDueReminders().then((list) => {
      if (active) setDueList(list || []);
    });
    return () => {
      active = false;
    };
  }, []);

  if (dismissed || dueList.length === 0) {
    return null;
  }

  const first = dueList[0];
  const countStr = isBn ? toBanglaDigits(dueList.length) : String(dueList.length);

  return (
    <div
      data-testid="due-reminders-banner"
      className="w-full max-w-sm bg-amber-50 border-2 border-amber-400 rounded-2xl p-3 shadow-sm animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start space-x-2">
          <span className="text-xl leading-none mt-0.5" aria-hidden="true">⏰</span>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-amber-950">
              {isBn ? `আজকের করণীয় কাজ (${countStr}টি)` : `Due Today (${countStr})`}
            </h4>
            <p className="text-xs text-amber-900 mt-0.5 font-medium line-clamp-1">
              {first.title}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-amber-800 hover:text-amber-950 p-2 text-sm font-bold leading-none min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl cursor-pointer"
          aria-label={isBn ? 'বিজ্ঞপ্তি বন্ধ করুন' : 'Dismiss banner'}
        >
          ✕
        </button>
      </div>

      <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between">
        <span className="text-[11px] text-amber-800 font-medium">
          {isBn ? 'মাঠ পরিদর্শন করুন' : 'Inspect your field'}
        </span>
        <a
          href="#/reminders"
          className="text-xs font-bold text-leaf-700 hover:text-leaf-800 hover:underline px-2 py-1 min-h-[44px] flex items-center cursor-pointer"
        >
          {isBn ? 'সব কাজ দেখুন →' : 'View all →'}
        </a>
      </div>
    </div>
  );
}
