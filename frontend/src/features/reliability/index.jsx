// F14 Confidence and reliability: STUB from Batch 0 (documentation/feature_plan/PARALLEL_IMPLEMENTATION_PLAN.md).
// Owner: Claude (lead). Replace the bodies below; keep the export names and props.
// Every slot component receives { scan, context }:
//   scan = { canvas, probs, decision, calibration, classKey, isConfident } on result slots, null elsewhere.
// Rendering is already gated by features/flags.js and wrapped in an error boundary (features/slots.jsx).
import React from 'react';

/** [result] Reliability band + what it measured on independent tests. */
// eslint-disable-next-line no-unused-vars
export function ReliabilityNote({ scan, context }) {
  return null;
}
