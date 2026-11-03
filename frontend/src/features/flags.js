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
  actionPlan: false, // F10
  feedback: false, // F20
  help: true, // F22
  areaMap: false, // F23
  user_guided_crop: true, // focus on the diseased leaf (user-guided crop)
};

export const PRODUCTION_HOST = 'agroleaf-ai.pages.dev';
const STORAGE_KEY = 'agroleaf_features';

function previewOverrides() {
  if (typeof window === 'undefined' || window.location.hostname === PRODUCTION_HOST) return [];
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('features');
    if (fromUrl !== null) localStorage.setItem(STORAGE_KEY, fromUrl);
    return (localStorage.getItem(STORAGE_KEY) || '').split(',').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function isFeatureOn(name) {
  if (!(name in FEATURES)) return false;
  return FEATURES[name] || previewOverrides().includes(name);
}
