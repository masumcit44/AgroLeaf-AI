// F20 Feedback and misclassification reporting: STUB from Batch 0 (documentation/feature_plan/PARALLEL_IMPLEMENTATION_PLAN.md).
// Owner: OpenCode. Replace the bodies below; keep the export names and props.
// Every slot component receives { scan, context }:
//   scan = { canvas, probs, decision, calibration, classKey, isConfident } on result slots, null elsewhere.
// Rendering is already gated by features/flags.js and wrapped in an error boundary (features/slots.jsx).
import React from 'react';

/** [result] 'Was this wrong?' flow, queued in the outbox. */
// eslint-disable-next-line no-unused-vars
export function FeedbackButton({ scan, context }) {
  return null;
}
