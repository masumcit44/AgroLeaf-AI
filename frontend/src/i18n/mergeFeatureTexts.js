/** App texts plus every feature's texts for one language (feature keys are prefixed, see the foundation test). */
export function mergeFeatureTexts(base, featureModules, lang) {
  return Object.values(featureModules).reduce((acc, mod) => ({ ...acc, ...(mod?.[lang] || {}) }), { ...base });
}
