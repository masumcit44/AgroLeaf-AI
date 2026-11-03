// F16 Disease progress history: STUB from Batch 0 (documentation/feature_plan/PARALLEL_IMPLEMENTATION_PLAN.md).
// Owner: Cline. Replace the bodies below; keep the export names and props.
// Every slot component receives { scan, context }:
//   scan = { canvas, probs, decision, calibration, classKey, isConfident } on result slots, null elsewhere.
// Rendering is already gated by features/flags.js and wrapped in an error boundary (features/slots.jsx).
import React from 'react';

/** [result] Save this result on the phone (thumbnail, result, band, field label). */
// eslint-disable-next-line no-unused-vars
export function SaveToHistory({ scan, context }) {
  return null;
}

/** [home] Link to #/history when there are saved results. */
// eslint-disable-next-line no-unused-vars
export function HistoryLink({ scan, context }) {
  return null;
}

/** [route] Page at #/history. */
// eslint-disable-next-line no-unused-vars
export function HistoryPage({ scan, context }) {
  return null;
}
