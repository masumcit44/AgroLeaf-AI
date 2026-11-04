import React, { useState, useEffect } from 'react';
import useT from '../../i18n/useT.js';
import {
  saveReminder,
  getActiveReminderForDisease,
} from './remindersStore.js';
import {
  getRecommendedFollowUpDays,
  getFutureDateStr,
  formatBengaliDate,
  toBanglaDigits,
} from './remindersLogic.js';
import { requestNotificationPermission } from './notificationService.js';

const DISEASE_NAMES_BN = {
  blast: 'ধানের ব্লাস্ট',
  brown_spot: 'বাদামি দাগ',
  tungro: 'টুংরো রোগ',
  sheath_blight: 'খোল পোড়া',
  leaf_smut: 'লিফ স্মাট',
  healthy: 'সুস্থ ধান গাছ',
  not_sure: 'অনিশ্চিত লক্ষণ',
};

const DISEASE_NAMES_EN = {
  blast: 'Rice Blast',
  brown_spot: 'Brown Spot',
  tungro: 'Tungro',
  sheath_blight: 'Sheath Blight',
  leaf_smut: 'Leaf Smut',
  healthy: 'Healthy Rice',
  not_sure: 'Inconclusive Symptoms',
};

export default function FollowUpCard({ scan, context }) {
  const { lang } = useT();
  const isBn = lang === 'bn';

  const classKey = scan?.classKey || (scan?.decision?.status === 'confident' ? scan?.decision?.top?.key : 'not_sure') || 'not_sure';
  const diseaseName = (isBn ? DISEASE_NAMES_BN[classKey] : DISEASE_NAMES_EN[classKey]) || classKey;
  const recommendedDays = getRecommendedFollowUpDays(classKey);

  const [existingReminder, setExistingReminder] = useState(null);
  const [selectedDays, setSelectedDays] = useState(recommendedDays);
  const [isCustom, setIsCustom] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if an active reminder already exists for this disease
  useEffect(() => {
    let active = true;
    if (!classKey) return;

    getActiveReminderForDisease(classKey).then((r) => {
      if (active) setExistingReminder(r);
    });

    return () => {
      active = false;
    };
  }, [classKey, savedSuccess]);

  if (context !== 'result' || !scan?.decision) {
    return null;
  }

  const dueDate = getFutureDateStr(selectedDays);
  const formattedDueDate = formatBengaliDate(dueDate);

  async function handleAddReminder() {
    setIsSaving(true);
    try {
      const title = isBn
        ? `${diseaseName} পুনর্নিরীক্ষণ`
        : `${diseaseName} Follow-up`;
      const description = isBn
        ? 'জমিতে নতুন লক্ষণ পর্যবেক্ষণ এবং আক্রান্ত অংশের অবস্থা যাচাই করুন।'
        : 'Inspect field for lesion spread and plant vigor.';

      await saveReminder({
        title,
        description,
        due_date: dueDate,
        disease_id: classKey,
        source: 'diagnosis',
      });

      // Optional progressive notification request (silent if denied)
      requestNotificationPermission().catch(() => {});

      setSavedSuccess(true);
    } catch (err) {
      console.error('Failed to save follow-up reminder:', err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      data-testid="follow-up-reminder-card"
      className="w-full max-w-sm bg-white border border-leaf-200 rounded-2xl p-4 shadow-xs space-y-3"
    >
      <div className="flex items-center space-x-2 border-b border-leaf-100 pb-2">
        <span className="text-xl" aria-hidden="true">📅</span>
        <h3 className="font-bold text-sm text-gray-900">
          {isBn ? 'পরবর্তী মাঠ পর্যবেক্ষণ স্মরণবার্তা' : 'Follow-up Inspection Reminder'}
        </h3>
      </div>

      {savedSuccess ? (
        <div className="bg-leaf-50 border border-leaf-300 rounded-xl p-3 text-center space-y-2">
          <p className="text-leaf-900 font-semibold text-xs sm:text-sm">
            {isBn
              ? `✓ ${formattedDueDate}-এর জন্য স্মরণবার্তা সংরক্ষিত হয়েছে!`
              : `✓ Reminder set for ${dueDate}!`}
          </p>
          <a
            href="#/reminders"
            className="inline-block text-xs font-bold text-leaf-700 underline focus-visible:outline-2"
          >
            {isBn ? 'সব স্মরণবার্তা দেখুন →' : 'View all reminders →'}
          </a>
        </div>
      ) : existingReminder ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2 text-xs">
          <p className="text-amber-900 font-medium">
            {isBn
              ? `ℹ️ এই রোগের জন্য ইতিমধ্যে একটি স্মরণবার্তা আছে (${formatBengaliDate(existingReminder.due_date)})`
              : `ℹ️ Active reminder already exists for this disease (${existingReminder.due_date})`}
          </p>
          <a
            href="#/reminders"
            className="inline-block font-bold text-leaf-700 underline"
          >
            {isBn ? 'স্মরণবার্তা তালিকায় দেখুন →' : 'View in Reminders list →'}
          </a>
        </div>
      ) : (
        <div className="space-y-3 text-xs sm:text-sm">
          <p className="text-gray-700">
            {isBn
              ? `${diseaseName}-এর লক্ষণ পর্যবেক্ষণ করতে কয় দিন পর স্মরণবার্তা পেতে চান?`
              : `When would you like a reminder to inspect ${diseaseName}?`}
          </p>

          {/* Quick timing options */}
          <div className="flex flex-wrap gap-1.5">
            {[2, 3, 5, 7].map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => {
                  setSelectedDays(days);
                  setIsCustom(false);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                  selectedDays === days && !isCustom
                    ? 'bg-leaf-600 text-white border-leaf-700 shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {isBn ? `${toBanglaDigits(days)} দিন পর` : `In ${days} days`}
              </button>
            ))}
          </div>

          <p className="text-xs text-gray-500 font-medium">
            {isBn
              ? `নির্ধারিত তারিখ: ${formattedDueDate}`
              : `Scheduled Date: ${dueDate}`}
          </p>

          <button
            type="button"
            onClick={handleAddReminder}
            disabled={isSaving}
            className="w-full min-h-[44px] bg-leaf-600 hover:bg-leaf-700 active:bg-leaf-800 text-white font-bold text-sm rounded-xl py-2 px-4 shadow-sm transition-colors flex items-center justify-center space-x-2 focus-visible:outline-2 focus-visible:outline-leaf-700"
          >
            <span>{isSaving ? (isBn ? 'সংরক্ষণ হচ্ছে…' : 'Saving…') : (isBn ? '⏰ স্মরণবার্তা যোগ করুন' : '⏰ Add Reminder')}</span>
          </button>
        </div>
      )}
    </div>
  );
}
