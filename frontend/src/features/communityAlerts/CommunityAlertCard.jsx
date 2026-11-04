import React, { useState, useEffect, useCallback } from 'react';
import useT from '../../i18n/useT.js';
import { getProfile } from '../profile/profileStore.js';
import { saveReminder } from '../reminders/remindersStore.js';
import {
  fetchCommunityAlerts,
  getAlertsPreference,
  saveAlertsPreference,
  dismissAlert,
  isAlertDismissed,
} from './communityAlertsStore.js';
import { SUPPORTED_DISEASES, ALERT_LEVELS } from './outbreakSignalEngine.js';
import districtsData from '../profile/districts.json';

export default function CommunityAlertCard({ initialDistrictCode = null, activeDisease = null }) {
  const { lang } = useT();
  const isBn = lang !== 'en';

  // State
  const [districtCode, setDistrictCode] = useState(initialDistrictCode ? String(initialDistrictCode) : null);
  const [selectedDisease, setSelectedDisease] = useState(activeDisease && SUPPORTED_DISEASES[activeDisease] ? activeDisease : 'blast');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optIn, setOptIn] = useState(false);
  const [showOptInPrompt, setShowOptInPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [reminderSaved, setReminderSaved] = useState(false);

  // Initialize preference & district
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const pref = await getAlertsPreference();
        const profile = await getProfile();

        if (!active) return;
        setOptIn(pref.optIn);
        setShowOptInPrompt(!pref.optIn);

        const targetCode = initialDistrictCode
          ? String(initialDistrictCode)
          : (pref.preferredDistrictCode || (profile?.district_code ? String(profile.district_code) : '1'));

        setDistrictCode(targetCode);
      } catch (err) {
        console.warn('[CommunityAlertCard] Init error:', err);
        if (active) setDistrictCode('1');
      }
    }

    init();
    return () => { active = false; };
  }, [initialDistrictCode]);

  // Load report when districtCode or selectedDisease changes
  const loadReport = useCallback(async () => {
    if (!districtCode) return;
    setLoading(true);

    try {
      const data = await fetchCommunityAlerts(districtCode, selectedDisease, isBn ? 'bn' : 'en');
      setReport(data);

      const alertKey = `${selectedDisease}_${districtCode}_${data?.primaryAlert?.alertLevel?.code}`;
      const dismissed = await isAlertDismissed(alertKey);
      setIsDismissed(dismissed);
    } catch (err) {
      console.warn('[CommunityAlertCard] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [districtCode, selectedDisease, isBn]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // Handle Opt-in toggle
  const handleToggleOptIn = async (newVal) => {
    setOptIn(newVal);
    setShowOptInPrompt(!newVal);
    await saveAlertsPreference({ optIn: newVal, preferredDistrictCode: districtCode });
  };

  // Handle Dismiss
  const handleDismiss = async () => {
    if (!report?.primaryAlert) return;
    const alertKey = `${selectedDisease}_${districtCode}_${report.primaryAlert.alertLevel.code}`;
    await dismissAlert(alertKey);
    setIsDismissed(true);
  };

  // Handle 1-Tap Scouting Reminder via F24
  const handleCreateScoutingReminder = async () => {
    try {
      const dName = report?.districtName || 'আপনার এলাকা';
      const disName = SUPPORTED_DISEASES[selectedDisease]?.[isBn ? 'nameBn' : 'nameEn'] || selectedDisease;

      const d = new Date();
      d.setDate(d.getDate() + 1); // Tomorrow
      const dueDate = d.toISOString().slice(0, 10);

      await saveReminder({
        title: isBn
          ? `ধানক্ষেত রোগ পর্যবেক্ষণ (${disName})`
          : `Field Disease Scouting (${disName})`,
        description: isBn
          ? `${dName}-এ ${disName} রোগের প্রাথমিক সতর্কতা সংকেতের কারণে ক্ষেত পরিদর্শন ও পাতার লক্ষণ যাচাই করুন।`
          : `Inspect field for ${disName} symptoms due to community warning in ${dName}.`,
        due_date: dueDate,
        due_time: '08:30',
        source: 'community_alert',
        disease_id: selectedDisease,
      });

      setReminderSaved(true);
      setTimeout(() => setReminderSaved(false), 4000);
    } catch (err) {
      console.error('[CommunityAlertCard] Failed to save reminder:', err);
    }
  };

  if (isDismissed) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs text-gray-500 flex items-center justify-between my-3">
        <span>{isBn ? '🛡️ এলাকাভিত্তিক রোগ সতর্কতা বন্ধ রাখা হয়েছে।' : '🛡️ Community disease alert dismissed.'}</span>
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="text-leaf-700 font-semibold underline hover:text-leaf-850"
        >
          {isBn ? 'পুনরায় দেখুন' : 'Show Alert'}
        </button>
      </div>
    );
  }

  const primary = report?.primaryAlert;
  const isNeighbor = Boolean(primary?.isNeighborAlert);
  const badgeLevel = primary?.alertLevel || ALERT_LEVELS.INSUFFICIENT_DATA;
  const advice = primary?.preventiveAdvice;

  return (
    <div
      data-testid="community-alert-card"
      className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden my-4 text-left"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📡</span>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">
              {isBn ? 'এলাকাভিত্তিক রোগ সতর্কতা ও নজরদারি' : 'Community Outbreak Early Warning'}
            </h3>
            <p className="text-[11px] text-slate-300">
              {isBn ? 'কৃষকদের বেনামী স্ক্যান রিপোর্ট ও বিস্তার বিশ্লেষণ' : 'Anonymous farmer surveillance & spatial analysis'}
            </p>
          </div>
        </div>

        {/* District Selector Pill */}
        <select
          value={districtCode || '1'}
          onChange={(e) => setDistrictCode(e.target.value)}
          aria-label={isBn ? 'জেলা নির্বাচন করুন' : 'Select district'}
          className="bg-slate-700/80 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-600 focus:outline-none focus:ring-1 focus:ring-leaf-400"
          data-testid="district-select"
        >
          {districtsData.map((d) => (
            <option key={d.code} value={d.code}>
              {isBn ? d.district_name_bn : d.district_name_en}
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* Optional Community Opt-In Banner */}
        {showOptInPrompt && (
          <div
            data-testid="community-opt-in-banner"
            className="p-3 bg-sky-50 border border-sky-200 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
          >
            <div className="space-y-0.5">
              <span className="font-bold text-sky-950 flex items-center gap-1.5">
                <span>🤝</span>
                <span>{isBn ? 'সম্প্রদায়ভিত্তিক রোগ পর্যবেক্ষণে অংশ নিন' : 'Join Community Disease Surveillance'}</span>
              </span>
              <p className="text-[11px] text-sky-850 leading-relaxed">
                {isBn
                  ? 'আপনার স্ক্যানের রোগের তথ্য ও এলাকা বেনামীভাবে যুক্ত হয়ে পুরো এলাকার কৃষকদের সময়মতো সতর্ক করতে সাহায্য করে। কোনো ব্যক্তিগত তথ্য প্রকাশ করা হয় না।'
                  : 'Your anonymous disease scans help generate timely early warnings for nearby farmers. No personal data is ever shared.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleOptIn(true)}
              className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-xl text-xs shrink-0 transition-colors shadow-xs"
            >
              {isBn ? 'অংশ নিন ✓' : 'Opt In ✓'}
            </button>
          </div>
        )}

        {/* Disease Filter Chips */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            {isBn ? 'ফসলের রোগ নির্বাচন:' : 'Select Rice Disease:'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(SUPPORTED_DISEASES).map(([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDisease(key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedDisease === key
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                data-testid={`disease-filter-${key}`}
              >
                {isBn ? item.nameBn : item.nameEn}
              </button>
            ))}
          </div>
        </div>

        {/* Active Alert Status Box */}
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-500">
            <div className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent text-slate-700 rounded-full mb-2" />
            <p>{isBn ? 'তথ্য যাচাই ও হিসাব করা হচ্ছে...' : 'Evaluating area signals...'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Status Level Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{badgeLevel.icon}</span>
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {report?.districtName || 'নির্বাচিত জেলা'} • {isBn ? SUPPORTED_DISEASES[selectedDisease]?.nameBn : SUPPORTED_DISEASES[selectedDisease]?.nameEn}
                </span>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badgeLevel.badgeClass}`}
                data-testid="alert-level-badge"
              >
                {isBn ? badgeLevel.titleBn : badgeLevel.titleEn}
              </span>
            </div>

            {/* Signal Message */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 space-y-1.5">
              <p className="font-semibold text-slate-900 leading-relaxed">
                {isBn ? primary?.messageBn : primary?.messageEn}
              </p>

              {/* Contributor indicator without revealing count if low */}
              {!primary?.isSuppressed && primary?.currentContributors >= 3 && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
                  <span>👥</span>
                  <span>
                    {isBn
                      ? `৩+ জন কৃষকের স্বতন্ত্র স্ক্যানের ভিত্তিতে সংকেত নির্ণীত (তুলনামূলক অনুপাত: ${primary.rateRatio || 1}x)`
                      : `Derived from 3+ independent farmer scans (Rate Ratio: ${primary.rateRatio || 1}x)`}
                  </span>
                </div>
              )}
            </div>

            {/* Neighbor Risk Banner (if present) */}
            {isNeighbor && (
              <div
                data-testid="neighbor-risk-banner"
                className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs space-y-1"
              >
                <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                  <span>⚠️</span>
                  <span>{isBn ? 'প্রতিবেশী এলাকার সতর্কতা সংকেত' : 'Neighboring District Risk Alert'}</span>
                </div>
                <p className="text-amber-850 leading-relaxed">
                  {isBn ? primary.messageBn : primary.messageEn}
                </p>
              </div>
            )}

            {/* BRRI / DAE Actionable Preventive Guidance */}
            {advice && (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-emerald-950">
                  <span>🌱</span>
                  <span>{isBn ? advice.titleBn : advice.titleEn}</span>
                </div>
                <ul className="space-y-1.5 text-emerald-900 text-[11px] leading-relaxed list-disc list-inside">
                  {(isBn ? advice.actionsBn : advice.actionsEn).map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCreateScoutingReminder}
                disabled={reminderSaved}
                className="flex-1 py-2 px-3 bg-leaf-700 hover:bg-leaf-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                data-testid="btn-scout-reminder"
              >
                <span>⏰</span>
                <span>
                  {reminderSaved
                    ? (isBn ? '✓ স্মরণবার্তা চালু হয়েছে' : '✓ Reminder Scheduled')
                    : (isBn ? 'ধানক্ষেত পরিদর্শনের স্মরণবার্তা রাখুন' : 'Schedule Inspection Reminder')}
                </span>
              </button>

              <div className="flex items-center space-x-2">
                <a
                  href="tel:16123"
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                >
                  <span>📞</span>
                  <span>{isBn ? '১৬১২৩' : '16123'}</span>
                </a>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-2 px-3 text-slate-400 hover:text-slate-600 rounded-xl text-xs"
                  title={isBn ? 'সতর্কতা লুকিয়ে রাখুন' : 'Dismiss alert'}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Scientific Disclaimer */}
            <div className="text-[10px] text-slate-400 pt-1 leading-normal italic">
              {isBn ? report?.disclaimerBn : report?.disclaimerEn}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
