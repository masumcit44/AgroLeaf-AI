// Feature flags for the F8–F23 work (documentation/feature_plan/). Owned by the lead.
// Everything is OFF in production until the lead turns it on after review and live tests.
// Testers can switch features on in a preview with ?features=history,weather (remembered in
// localStorage); this never works on the production host.
export const FEATURES = {
  pwa: false, // F9
  reliability: false, // F14
  history: false, // F16
  profile: false, // F21
  weather: false, // F8
  actionPlan: false, // F10
  feedback: false, // F20
  help: false, // F22
  areaMap: false, // F23
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
