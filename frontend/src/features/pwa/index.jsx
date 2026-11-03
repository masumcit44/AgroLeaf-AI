// F9 Offline PWA: STUB from Batch 0 (documentation/feature_plan/PARALLEL_IMPLEMENTATION_PLAN.md).
// Owner: OpenCode. Replace the bodies below; keep the export names and props.
// Every slot component receives { scan, context }:
//   scan = { canvas, probs, decision, calibration, classKey, isConfident } on result slots, null elsewhere.
// Rendering is already gated by features/flags.js and wrapped in an error boundary (features/slots.jsx).
import React from 'react';

/** [app] Offline/online banner and update notice, rendered once in the app frame. */
// eslint-disable-next-line no-unused-vars
export function PwaStatus({ scan, context }) {
  return null;
}

/** [home] 'Install app' prompt on the home page. */
// eslint-disable-next-line no-unused-vars
export function InstallPrompt({ scan, context }) {
  return null;
}
