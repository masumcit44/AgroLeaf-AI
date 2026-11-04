import React, { useEffect, useState, useRef } from 'react';
import useT from '../../i18n/useT.js';
import { buildPlan } from './planRules.js';
import { getDiseaseKnowledge } from '../../lib/diseaseKnowledge.js';
import { getProfile } from '../../features/profile/profileStore.js';

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

function formatStepNumber(idx, lang) {
  const n = idx + 1;
  if (lang !== 'bn') return String(n);
  return String(n).replace(/[0-9]/g, (d) => BANGLA_DIGITS[d] || d);
}

/** [result] Rule-based plan from disease text + band + weather + profile. */
export function ActionPlan({ scan, context }) {
  const { t, lang } = useT();
  const [plan, setPlan] = useState([]);
  const weatherRiskRef = useRef([]);

  useEffect(() => {
    let active = true;

    if (!scan?.decision || context !== 'result') {
      return () => { active = false; };
    }

    async function loadPlan() {
      try {
        const knowledge = await getDiseaseKnowledge(lang);
        const profile = await getProfile();
        let weatherRisk = [];
        if (profile?.district_code && scan.decision) {
          // Weather risk integration if profile exists
        }
        weatherRiskRef.current = weatherRisk;

        const planSteps = buildPlan(scan.decision, knowledge, weatherRisk, lang);
        if (active) {
          setPlan(planSteps);
        }
      } catch (err) {
        console.error('ActionPlan: failed to build plan', err);
        if (active) setPlan([]);
      }
    }

    loadPlan();
    return () => { active = false; };
  }, [scan, context, lang]);

  if (!plan.length || !scan?.decision || context !== 'result') return null;

  return (
    <div
      data-testid="action-plan"
      className="w-full max-w-sm rounded-2xl border border-leaf-300 bg-leaf-50/50 p-4 space-y-3 text-left"
    >
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
        <span>📋</span>
        {t('actionPlan.title')}
      </h3>
      <ol className="space-y-2.5">
        {plan.map((step, idx) => (
          <li key={idx} className="flex gap-3 text-xs sm:text-sm text-gray-800 leading-relaxed">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-leaf-700 text-white text-xs font-bold flex items-center justify-center select-none font-mono">
              {formatStepNumber(idx, lang)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{step.text}</p>
              {step.source && (
                <p className="text-[11px] text-leaf-700 mt-0.5 flex items-center gap-1">
                  <span aria-hidden="true">📎</span>
                  {t('actionPlan.source')}: {t(`actionPlan.source.${step.source}`) || step.source}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
