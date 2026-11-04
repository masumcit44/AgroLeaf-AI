// Feature flags for the F8–F23 work (documentation/feature_plan/). Owned by the lead.
// A feature is ON only after the lead's review and live tests (released 3 Nov 2026: pwa, history,
// profile, weather, user_guided_crop). The rest stay OFF until they are built and tested.
// Testers can switch features on in a preview with ?features=history,weather (remembered in
// localStorage); this never works on the production host.
export const FEATURES = {
  pwa: true, // F9
  reliability: true, // F14
  history: true, // F16
  profile: true, // F21
  weather: true, // F8
  weatherReport: true, // F8 v2 dedicated weather & crop report (live 4 Nov)
  actionPlan: true, // F10
  feedback: false, // F20
  help: true, // F22
  areaMap: false, // F23
  reminders: true, // F24
  yieldRisk: true, // F26 yield impact & dynamic risk intelligence
  explainableAi: true, // F11 explainable AI heatmap & disease highlighting
  confidenceScore: true, // Calibrated confidence score badge & retake guidance
  liveScanner: true, // F1 Advanced Intelligent Live Guided Camera Scanner
  diseaseSeverity: true, // F31 Disease Severity Scoring & Quantitative Impact Assessment
  copilot: true, // F30 AI-Powered Disease Q&A (Voice-First Farmer Copilot)
  user_guided_crop: true, // focus on the diseased leaf (user-guided crop)
};

export const PRODUCTION_HOST = 'agroleaf-ai.pages.dev';
const STORAGE_KEY = 'agroleaf_features';

function previewOverrides() {
  if (typeof window === 'undefined' || window.location.hostname === PRODUCTION_HOST) {
    return { enabled: [], disabled: [] };
  }
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('features');
    if (fromUrl !== null) localStorage.setItem(STORAGE_KEY, fromUrl);
    const raw = (localStorage.getItem(STORAGE_KEY) || '').split(',').map((s) => s.trim()).filter(Boolean);
    const enabled = [];
    const disabled = [];
    for (const item of raw) {
      if (item.startsWith('!') || item.startsWith('-')) {
        disabled.push(item.slice(1));
      } else {
        enabled.push(item);
      }
    }
    return { enabled, disabled };
  } catch {
    return { enabled: [], disabled: [] };
  }
}

export function isFeatureOn(name) {
  if (!(name in FEATURES)) return false;
  const { enabled, disabled } = previewOverrides();
  if (disabled.includes(name)) return false;
  return Boolean(FEATURES[name] || enabled.includes(name));
}
