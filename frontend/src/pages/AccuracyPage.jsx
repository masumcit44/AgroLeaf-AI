import React, { useState, useEffect } from 'react';
import useT from '../i18n/useT.js';
import PageContainer from '../components/PageContainer.jsx';
import { CLASS_NAMES, formatMetric, formatCount } from '../lib/metricsFormatting.js';

export default function AccuracyPage({
  metricsUrl = '/data/metrics-v1.json',
  initialMetrics = undefined,
}) {
  const { lang, t } = useT();
  const [metrics, setMetrics] = useState(initialMetrics || null);
  const [loading, setLoading] = useState(initialMetrics === undefined);

  useEffect(() => {
    if (initialMetrics !== undefined) return;
    let active = true;
    async function fetchMetrics() {
      try {
        const res = await fetch(metricsUrl);
        if (!res.ok) {
          if (active) {
            setMetrics(null);
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (active) {
          setMetrics(data);
          setLoading(false);
        }
      } catch {
        if (active) {
          setMetrics(null);
          setLoading(false);
        }
      }
    }
    fetchMetrics();
    return () => {
      active = false;
    };
  }, [metricsUrl, initialMetrics]);

  const hasMetrics = Boolean(metrics && metrics.internal_test);

  const getClassName = (key) => {
    return CLASS_NAMES[key]?.[lang] || key;
  };

  return (
    <PageContainer>
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-leaf-700 pb-2 border-b border-gray-100">
            {t('accuracyTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {lang === 'bn'
              ? 'মডেলের যাচাইকৃত ফলাফল, নির্ভুলতার সীমা এবং মাঠ পর্যায়ের সত্যনিষ্ঠ মূল্যায়ন।'
              : 'Verified model evaluation results, accuracy thresholds, and honest field reporting.'}
          </p>
        </div>

        {/* 1. In-Progress Banner (shown when metrics-v1.json is missing) */}
        {!hasMetrics && !loading && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 sm:p-5" data-testid="in-progress-banner">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl" aria-hidden="true">⏳</span>
              <span className="font-bold text-amber-800 text-base">
                {t('evalInProgress')}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {t('evalInProgressDesc')}
            </p>
          </div>
        )}

        {/* 2. Plain Language Summary (shown only when real metrics exist) */}
        {hasMetrics && (
          <div className="bg-leaf-50 border border-leaf-700/20 rounded-xl p-4 text-leaf-950 text-xs sm:text-sm leading-relaxed" data-testid="plain-summary">
            <span className="font-bold block mb-1 text-leaf-800">
              {lang === 'bn' ? '📊 সহজ ভাষায় মূল ফলাফল:' : '📊 Plain Language Summary:'}
            </span>
            {metrics.external && metrics.external.length > 0 ? (
              <p>
                {lang === 'bn'
                  ? `অন্য জেলার ছবিতে পরীক্ষা: ${formatCount(metrics.external[0].n)} টির মধ্যে মডেল উত্তর দিয়েছে ${formatMetric(metrics.external[0].coverage)} ক্ষেত্রে; যেগুলোতে উত্তর দিয়েছে তার ${formatMetric(metrics.external[0].selective_accuracy)} সঠিক।`
                  : `Tested on photos from other districts: the model answered ${formatMetric(metrics.external[0].coverage)} of the time (out of ${formatCount(metrics.external[0].n)} photos); of those answers, ${formatMetric(metrics.external[0].selective_accuracy)} were correct.`}
              </p>
            ) : (
              <p>
                {lang === 'bn'
                  ? `অভ্যন্তরীণ যাচাইকরণে মডেল ${formatCount(metrics.internal_test.n)} টি নমুনার মধ্যে ${formatMetric(metrics.internal_test.coverage)} ক্ষেত্রে উত্তর দিয়েছে এবং নির্বাচনী নির্ভুলতা (Selective Accuracy) ছিল ${formatMetric(metrics.internal_test.selective_accuracy)}।`
                  : `In internal evaluation, the model answered ${formatMetric(metrics.internal_test.coverage)} of the time on ${formatCount(metrics.internal_test.n)} test photos, achieving ${formatMetric(metrics.internal_test.selective_accuracy)} selective accuracy.`}
              </p>
            )}
          </div>
        )}

        {/* 3. Internal Test Key Indicators */}
        {hasMetrics && (
          <div className="space-y-3" data-testid="internal-metrics">
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              {lang === 'bn' ? 'অভ্যন্তরীণ পরীক্ষার সারসংক্ষেপ (Internal Test)' : 'Internal Test Summary'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <span className="block text-[11px] sm:text-xs text-gray-500 mb-1">Macro-F1</span>
                <span className="text-base sm:text-lg font-bold text-gray-800">
                  {formatMetric(metrics.internal_test.macro_f1)}
                </span>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <span className="block text-[11px] sm:text-xs text-gray-500 mb-1">
                  {lang === 'bn' ? 'উত্তরের হার (Coverage)' : 'Coverage'}
                </span>
                <span className="text-base sm:text-lg font-bold text-gray-800">
                  {formatMetric(metrics.internal_test.coverage)}
                </span>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <span className="block text-[11px] sm:text-xs text-gray-500 mb-1">
                  {lang === 'bn' ? 'নির্বাচনী নির্ভুলতা (Selective Acc)' : 'Selective Accuracy'}
                </span>
                <span className="text-base sm:text-lg font-bold text-leaf-700">
                  {formatMetric(metrics.internal_test.selective_accuracy)}
                </span>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <span className="block text-[11px] sm:text-xs text-gray-500 mb-1">
                  {lang === 'bn' ? 'ক্যালিব্রেশন ত্রুটি (ECE)' : 'ECE Calibration'}
                </span>
                <span className="text-base sm:text-lg font-bold text-gray-800">
                  {formatMetric(metrics.internal_test.ece_after)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Per-Class Precision & Recall Table */}
        {hasMetrics && metrics.internal_test.per_class && (
          <div className="space-y-3" data-testid="per-class-table">
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              {lang === 'bn' ? 'রোগভিত্তিক সূচকসমূহ (Per-Class Performance)' : 'Per-Class Performance (Internal Test)'}
            </h2>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">{lang === 'bn' ? 'রোগ / অবস্থা' : 'Class'}</th>
                    <th scope="col" className="px-3 py-2.5 text-center">{lang === 'bn' ? 'সংখ্যা (n)' : 'Support'}</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Precision</th>
                    <th scope="col" className="px-3 py-2.5 text-center">Recall</th>
                    <th scope="col" className="px-3 py-2.5 text-center">F1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {Object.entries(metrics.internal_test.per_class).map(([classKey, item]) => (
                    <tr key={classKey} className="hover:bg-gray-50/70">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {getClassName(classKey)}
                        {classKey === 'leaf_smut' && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            {lang === 'bn' ? 'স্থগিত (Suppressed)' : 'Suppressed'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">
                        {formatCount(item.support)}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700">
                        {formatMetric(item.precision)}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700">
                        {formatMetric(item.recall)}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold text-gray-800">
                        {formatMetric(item.f1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. External Validation Sets Table */}
        {hasMetrics && metrics.external && metrics.external.length > 0 && (
          <div className="space-y-4" data-testid="external-table">
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              {lang === 'bn' ? 'বাহ্যিক মাঠ পর্যায়ের পরীক্ষা (External District Validation)' : 'External District Validation'}
            </h2>
            {metrics.external.map((ext, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-bold text-gray-900 text-sm min-w-0 [overflow-wrap:anywhere]">{ext.name}</span>
                  {ext.doi ? (
                    <span className="text-[11px] text-gray-500 font-mono">DOI: {ext.doi}</span>
                  ) : null}
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">{lang === 'bn' ? 'পরীক্ষিত রোগসমূহ: ' : 'Classes tested: '}</span>
                  {ext.classes_tested.map((k) => getClassName(k)).join(', ')}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <span className="block text-[11px] text-gray-500 mb-0.5">{lang === 'bn' ? 'নমুনা সংখ্যা' : 'Sample count'}</span>
                    <span className="font-bold text-sm text-gray-800">{formatCount(ext.n)}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <span className="block text-[11px] text-gray-500 mb-0.5">Macro-F1 (Mapped)</span>
                    <span className="font-bold text-sm text-gray-800">{formatMetric(ext.macro_f1_mapped)}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <span className="block text-[11px] text-gray-500 mb-0.5">{lang === 'bn' ? 'উত্তরের হার' : 'Coverage'}</span>
                    <span className="font-bold text-sm text-gray-800">{formatMetric(ext.coverage)}</span>
                  </div>
                  <div className="p-2.5 bg-white border border-gray-200 rounded-lg">
                    <span className="block text-[11px] text-gray-500 mb-0.5">{lang === 'bn' ? 'অজানা রোগ বর্জন' : 'Unseen Rejection'}</span>
                    <span className="font-bold text-sm text-leaf-700">{formatMetric(ext.unseen_rejection_rate)}</span>
                  </div>
                </div>
                {ext.method && (
                  <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-lg p-2.5 leading-relaxed min-w-0 [overflow-wrap:anywhere]">
                    <span className="font-semibold text-gray-700 mr-1">
                      {`${t('evalMethodLabel')}: `}
                    </span>
                    {ext.method}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 5b. Safety gate (leaf-colour check + stricter "healthy") — before/after on held-out data */}
        {hasMetrics && metrics.safety_gate && (
          <div className="space-y-3" data-testid="safety-gate">
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              {lang === 'bn' ? 'নিরাপত্তা ছাঁকনি (Safety Gate)' : 'Safety Gate'}
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              {lang === 'bn' ? metrics.safety_gate.summary_bn : metrics.safety_gate.summary_en}
            </p>
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-2.5 font-semibold">{lang === 'bn' ? 'পরীক্ষা' : 'Test set'}</th>
                    <th className="p-2.5 font-semibold text-right">{lang === 'bn' ? 'আগে' : 'Before'}</th>
                    <th className="p-2.5 font-semibold text-right">{lang === 'bn' ? 'পরে' : 'After'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(metrics.safety_gate.rows || []).map((row) => (
                    <tr key={row.label_en}>
                      <td className="p-2.5 text-gray-800">{lang === 'bn' ? row.label_bn : row.label_en}</td>
                      <td className="p-2.5 text-right text-gray-600">{formatMetric(row.before)}</td>
                      <td className="p-2.5 text-right font-bold text-gray-900">{formatMetric(row.after)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. Confusion Matrix & Calibration Diagram (Cleanly hidden on error if not yet present) */}
        {hasMetrics && (
          <div className="space-y-3" data-testid="visual-evidence">
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              {lang === 'bn' ? 'ভিজ্যুয়াল যাচাইকরণ চার্ট (Visual Evidence)' : 'Visual Validation Charts'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-center">
                <span className="block text-xs font-semibold text-gray-700 mb-2">
                  {lang === 'bn' ? 'কনফিউশন ম্যাট্রিক্স (Confusion Matrix)' : 'Internal Confusion Matrix'}
                </span>
                <img
                  src="/accuracy/confusion_internal.png"
                  alt="Confusion Matrix"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                  onError={(e) => {
                    e.currentTarget.parentElement.style.display = 'none';
                  }}
                />
              </div>
              <div className="p-3 border border-gray-200 rounded-xl bg-gray-50 text-center">
                <span className="block text-xs font-semibold text-gray-700 mb-2">
                  {lang === 'bn' ? 'নির্ভরযোগ্যতা ডায়াগ্রাম (Reliability Curve)' : 'Validation Reliability Curve'}
                </span>
                <img
                  src="/accuracy/reliability_val.png"
                  alt="Reliability Diagram"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                  onError={(e) => {
                    e.currentTarget.parentElement.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. Model Technical Facts */}
        {hasMetrics && metrics.model && (
          <div className="space-y-3 border-t border-gray-100 pt-4" data-testid="model-facts">
            <h2 className="text-sm sm:text-base font-bold text-gray-800">
              {lang === 'bn' ? 'মডেল ও স্থাপত্য সংক্রান্ত তথ্যাদি (Technical Facts)' : 'Model & Architecture Facts'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-gray-700">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-500 block text-[11px]">{lang === 'bn' ? 'মডেল আর্কিটেকচার' : 'Architecture'}</span>
                <span className="font-semibold">{metrics.model.arch}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-500 block text-[11px]">{lang === 'bn' ? 'ফাইল সাইজ' : 'ONNX Size'}</span>
                <span className="font-semibold">{metrics.model.onnx_mb ? `${metrics.model.onnx_mb} MB` : '—'}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-gray-500 block text-[11px]">{lang === 'bn' ? 'মূল্যায়নের তারিখ' : 'Eval Date'}</span>
                <span className="font-semibold">{metrics.model.date || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. Limitations & Responsible AI Disclaimers */}
        <div className="space-y-3 border-t border-gray-100 pt-4" data-testid="limitations-section">
          <h2 className="text-sm sm:text-base font-bold text-gray-800">
            {lang === 'bn' ? 'সীমাবদ্ধতা ও দায়িত্বশীল এআই ঘোষণা (Limitations)' : 'Limitations & Responsible AI Disclaimers'}
          </h2>
          <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-gray-700 leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5">
            <li className="font-semibold text-amber-900">
              {lang === 'bn'
                ? 'এটি প্রাথমিক ধারণা দেয়, চূড়ান্ত রোগ নির্ণয় নয়।'
                : 'This gives a preliminary screening idea, not a final diagnosis.'}
            </li>
            <li className="font-semibold text-amber-900">
              {lang === 'bn'
                ? 'লিফ স্মাট রোগের জন্য বাইরের কোনো পরীক্ষা ডেটা নেই।'
                : 'There is no external test data for Leaf Smut.'}
            </li>
            <li className="font-semibold text-amber-900">
              {lang === 'bn'
                ? 'কৃষকের সুরক্ষার্থে লিফ স্মাট রোগের ফলাফল সরাসরি না দেখিয়ে সতর্কতামূলকভাবে \'নিশ্চিত নয়\' তালিকায় বিকল্প হিসেবে দেখানো হয় (Weak-Class Suppression)।'
                : 'To safeguard farmers, Leaf Smut predictions are conservatively suppressed into "Not Sure" as an advisory candidate (Weak-Class Suppression).'}
            </li>
            {metrics?.limitations &&
              metrics.limitations.map((item, idx) => (
                <li key={idx} className="text-gray-800">{item}</li>
              ))}
          </ul>
        </div>

        {/* 9. Dataset Credits with DOI */}
        <div className="border-t border-gray-100 pt-4 space-y-1.5 text-xs text-gray-500 leading-relaxed" data-testid="dataset-credits">
          <span className="font-bold text-gray-700 block">
            {t('aboutDatasetTitle')}
          </span>
          <p>{t('aboutDatasetCredit')}</p>
        </div>
      </div>
    </PageContainer>
  );
}
