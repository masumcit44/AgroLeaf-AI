import React, { useState, useEffect, useCallback } from 'react';
import FarmerCopilotCard from './FarmerCopilotCard.jsx';
import { listPlans, deletePlan } from './plannerStore.js';
import useT from '../../i18n/useT.js';

export default function CopilotPage() {
  const { lang } = useT();
  const isBn = lang !== 'en';

  const [activeTab, setActiveTab] = useState('planner'); // 'planner' | 'saved'
  const [savedPlans, setSavedPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const loadSavedPlans = useCallback(async () => {
    setIsLoadingPlans(true);
    try {
      const plans = await listPlans();
      setSavedPlans(plans || []);
    } catch (err) {
      console.error('[CopilotPage] Failed to load saved plans:', err);
    } finally {
      setIsLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    loadSavedPlans();
  }, [loadSavedPlans]);

  const handleDeletePlan = async (id, e) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      isBn
        ? 'আপনি কি এই চাষাবাদ পরিকল্পনাটি মুছে ফেলতে চান?'
        : 'Are you sure you want to delete this farming plan?'
    );
    if (!confirmed) return;

    try {
      await deletePlan(id);
      await loadSavedPlans();
      if (selectedPlan?.id === id) {
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error('[CopilotPage] Failed to delete plan:', err);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setActiveTab('planner');
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-4 pb-20">
      {/* Page Title & Subtitle */}
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center space-x-2">
          <span>🌾</span>
          <span>
            {isBn
              ? 'এগ্রোলিফ কৃষি গবেষণা ও চাষাবাদ পরিকল্পনাকারী'
              : 'AgroLeaf Agricultural Research & Farming Planner'}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          {isBn
            ? 'BRRI, DAE, BARC ও IRRI গবেষণার তথ্যের ভিত্তিতে আপনার জমির সঠিক সার, সেচ ও বালাই ব্যবস্থাপনার এ-টু-জেড গাইডলাইন।'
            : 'Evidence-based A-to-Z crop roadmaps, fertilizer schedules, and reminders grounded in BRRI, DAE, BARC & IRRI research.'}
        </p>
      </div>

      {/* Segmented Tab Bar */}
      <div className="flex bg-gray-100 p-1 rounded-xl mb-4 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`flex-1 min-w-0 min-h-[44px] py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center space-x-2 text-center leading-tight transition-all ${
            activeTab === 'planner'
              ? 'bg-white text-leaf-800 shadow-sm font-bold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          data-testid="copilot-tab-planner"
        >
          <span>🌱</span>
          <span>{isBn ? 'গবেষণা ও পরিকল্পনা' : 'Research & Planner'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('saved');
            loadSavedPlans();
          }}
          className={`flex-1 min-w-0 min-h-[44px] py-2 px-2 sm:px-3 rounded-lg flex items-center justify-center space-x-2 text-center leading-tight transition-all ${
            activeTab === 'saved'
              ? 'bg-white text-leaf-800 shadow-sm font-bold'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          data-testid="copilot-tab-saved"
        >
          <span>📁</span>
          <span>
            {isBn
              ? `সংরক্ষিত পরিকল্পনা (${savedPlans.length})`
              : `Saved Plans (${savedPlans.length})`}
          </span>
        </button>
      </div>

      {/* Tab 1: Active Planner & Assistant */}
      {activeTab === 'planner' && (
        <div>
          {selectedPlan && (
            <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center space-x-2 text-emerald-900">
                <span className="text-base">📌</span>
                <span>
                  {isBn
                    ? `সংরক্ষিত পরিকল্পনা প্রদর্শিত হচ্ছে: ${selectedPlan.variety_name_bn || selectedPlan.variety_name}`
                    : `Viewing Saved Plan: ${selectedPlan.variety_name}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="px-2.5 py-1 bg-white text-emerald-700 font-semibold border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                {isBn ? 'নতুন জিজ্ঞাসা' : 'New Query'}
              </button>
            </div>
          )}

          <FarmerCopilotCard initialPlan={selectedPlan} />
        </div>
      )}

      {/* Tab 2: Saved Plans Management */}
      {activeTab === 'saved' && (
        <div className="space-y-3" data-testid="saved-plans-container">
          {isLoadingPlans ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-leaf-600 rounded-full mb-2" />
              <p>{isBn ? 'পরিকল্পনাসমূহ লোড হচ্ছে...' : 'Loading saved plans...'}</p>
            </div>
          ) : savedPlans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
              <span className="text-4xl block mb-2">📋</span>
              <h3 className="font-bold text-gray-800 text-base mb-1">
                {isBn
                  ? 'এখনো কোনো চাষাবাদ পরিকল্পনা সংরক্ষণ করা হয়নি'
                  : 'No saved farming plans yet'}
              </h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto mb-4">
                {isBn
                  ? 'মুখে বলে বা প্রশ্ন লিখে আপনার জমির জন্য সম্পূর্ণ চাষাবাদ রোডম্যাপ ও সারের হিসাব তৈরি করুন এবং সংরক্ষণ করে রাখুন।'
                  : 'Ask or speak your planting query to generate and save personalized crop roadmaps and fertilizer calculations.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('planner')}
                className="px-4 py-2 bg-leaf-700 hover:bg-leaf-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                {isBn ? 'নতুন পরিকল্পনা তৈরি করুন' : 'Create New Plan'}
              </button>
            </div>
          ) : (
            savedPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-leaf-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🌾</span>
                      <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                        {isBn ? plan.variety_name_bn : plan.variety_name}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-xs bg-leaf-100 text-leaf-800 font-medium">
                        {plan.season?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      📍 {plan.district || 'জাতীয় নির্দেশিকা'} • 📐 {plan.land_amount}{' '}
                      {isBn ? 'শতক' : 'decimals'}{' '}
                      {plan.land_amount === 33 && (isBn ? '(১ বিঘা)' : '(1 Bigha)')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(plan.created_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg flex items-center justify-between">
                  <span>
                    🌱 {isBn ? `${plan.roadmap?.length || 0}টি শারীরবৃত্তীয় পর্যায়` : `${plan.roadmap?.length || 0} Growth Stages`}
                  </span>
                  <span>
                    🧪 {isBn ? 'BARC FRG-2024 সার সুপারিশ' : 'BARC FRG-2024 Dosage'}
                  </span>
                </div>

                <div className="flex items-center space-x-2 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className="flex-1 py-1.5 px-3 bg-leaf-50 hover:bg-leaf-100 text-leaf-800 rounded-lg text-xs font-semibold text-center transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>📖</span>
                    <span>{isBn ? 'সম্পূর্ণ রোডম্যাপ দেখুন' : 'View Full Roadmap'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeletePlan(plan.id, e)}
                    className="py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
                    title={isBn ? 'পরিকল্পনা মুছে ফেলুন' : 'Delete Plan'}
                  >
                    <span>🗑️</span>
                    <span>{isBn ? 'মুছুন' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Trust & Evidence Footer Banner */}
      <div className="mt-6 p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 space-y-1.5">
        <div className="flex items-center space-x-1.5 font-bold text-gray-800">
          <span>🏛️</span>
          <span>তথ্যসূত্র ও বৈজ্ঞানিক ভিত্তি:</span>
        </div>
        <p>
          সকল তথ্য ও বালাই ব্যবস্থাপনা বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (BRRI)-এর "আধুনিক ধানের চাষ", বাংলাদেশ কৃষি গবেষণা কাউন্সিল (BARC) সার সুপারিশ নির্দেশিকা ২০২৪, এবং কৃষি সম্প্রসারণ অধিদপ্তরের (DAE) বামিস নির্দেশিকা অনুযায়ী সংকলিত।
        </p>
        <div className="pt-1 flex items-center justify-between text-leaf-800 font-semibold">
          <span>কৃষি কল সেন্টার: ১৬১২৩ (কলের বর্তমান চার্জ প্রযোজ্য হতে পারে)</span>
          <a href="tel:16123" className="underline hover:text-leaf-950">
            কল করুন →
          </a>
        </div>
      </div>
    </main>
  );
}
