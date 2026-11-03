import React, { useEffect, useRef, useState } from 'react';
import useT from '../../i18n/useT.js';
import { isFeatureOn } from '../flags.js';
import { buildFeedbackPayload, submitFeedback, flushFeedbackOutbox } from './feedbackApi.js';

const OPTIONS = [
  ['healthy', 'option_healthy'],
  ['blast', 'option_blast'],
  ['brown_spot', 'option_brown_spot'],
  ['leaf_smut', 'option_leaf_smut'],
  ['tungro', 'option_tungro'],
  ['sheath_blight', 'option_sheath_blight'],
  ['other_rice', 'option_other_rice'],
  ['not_rice', 'option_not_rice'],
  ['unknown', 'option_unknown'],
];

export function FeedbackButton({ scan, context }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [reportedClass, setReportedClass] = useState('');
  const [comment, setComment] = useState('');
  const [includePhoto, setIncludePhoto] = useState(false);
  const [status, setStatus] = useState(null);
  const [formError, setFormError] = useState(null);
  const lastQueuedId = useRef(null);

  useEffect(() => {
    setOpen(false);
    setReportedClass('');
    setComment('');
    setIncludePhoto(false);
    setStatus(null);
    setFormError(null);
    lastQueuedId.current = null;
  }, [scan]);

  useEffect(() => {
    if (!isFeatureOn('feedback')) return undefined;
    const run = () => {
      flushFeedbackOutbox((item, outcome) => {
        if (item.id === lastQueuedId.current && outcome === 'sent') setStatus('sent');
      }).catch(() => {});
    };
    if (typeof navigator === 'undefined' || navigator.onLine !== false) run();
    if (typeof window !== 'undefined') window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, []);

  const openSheet = () => {
    setOpen(true);
    setStatus(null);
    setFormError(null);
    lastQueuedId.current = null;
  };

  const closeSheet = () => {
    if (!open) return;
    setOpen(false);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!reportedClass || open && false) return; // guard
    setFormError(null);
    try {
      let photo = null, phash = null;
      if (includePhoto) {
        const prepared = await preparePhoto(scan?.canvas);
        photo = prepared.photo;
        phash = prepared.phash;
      }
      const payload = buildFeedbackPayload(scan, { reportedClass, comment, includePhoto: Boolean(photo), photo, phash });
      lastQueuedId.current = payload.id;
      const { outcome } = await submitFeedback(payload);
      setStatus(outcome === 'sent' ? 'sent' : outcome === 'reject' ? 'error' : 'saved');
      setOpen(false);
      setReportedClass('');
      setComment('');
      setIncludePhoto(false);
    } catch (err) {
      const msg = err?.message;
      if (msg === 'photo_too_large' || msg === 'photo_unavailable') setFormError(t('feedback.photoError'));
      else setFormError(t('feedback.error'));
    } finally {
      setFormError(null);
    }
  };

  if (!isFeatureOn('feedback') || !scan) return null;

  if (status === 'sent' || status === 'saved' || status === 'error') {
    return (
      <div role="status" className="w-full max-w-sm rounded-xl border px-3 py-2 text-xs sm:text-sm font-semibold">
        {t(`feedback.${status}`)}
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={openSheet} className="text-xs sm:text-sm font-semibold text-gray-600 underline underline-offset-2 hover:text-leaf-700">
        {t('feedback.link')}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={closeSheet} role="presentation">
          <form role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white p-4 shadow-xl space-y-3" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="feedback-title" className="text-base font-bold text-gray-900">{t('feedback.title')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t('feedback.intro')}</p>
              </div>
              {/* close button removed; overlay click handles closing */}
            </div>
            <fieldset className="space-y-1.5">
              <legend className="sr-only">{t('feedback.title')}</legend>
              {OPTIONS.map(([value, key]) => (
                <label key={value} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${reportedClass === value ? 'border-leaf-700 bg-leaf-50' : 'border-gray-200'}`}>
                  <input type="radio" name="feedback-class" value={value} checked={reportedClass === value} onChange={() => setReportedClass(value)} className="accent-leaf-700" />
                  <span>{t(key)}</span>
                </label>
              ))}
            </fieldset>
            <div>
              <label htmlFor="feedback-comment" className="block text-xs font-semibold text-gray-700">{t('feedback.comment')}</label>
              <textarea id="feedback-comment" maxLength={500} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('feedback.commentPlaceholder')} className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm" />
              <div className="text-right text-[10px] text-gray-500">{comment.length}/500</div>
            </div>
            <label className="flex items-start gap-2 rounded-xl border border-gray-200 p-2.5 cursor-pointer">
              <input type="checkbox" checked={includePhoto} onChange={(e) => setIncludePhoto(e.target.checked)} disabled={!scan?.canvas} className="mt-0.5 accent-leaf-700" />
              <span className="text-xs text-gray-700">{t('feedback.sendPhoto')}</span>
            </label>
            <p className="text-[11px] leading-relaxed text-gray-500">{t('feedback.privacy')}</p>
            {formError && <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{formError}</div>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={closeSheet} disabled={true} className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 disabled:opacity-60">{t('feedback.dismiss')}</button>
              <button type="submit" disabled={!reportedClass} className="flex-1 rounded-xl bg-leaf-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">{t('feedback.submit')}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}