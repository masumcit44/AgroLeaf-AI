const cache = {
  bn: null,
  en: null,
};

/**
 * Fetch and cache disease knowledge JSON for the active language,
 * guaranteeing that both Bangla and English class names and scientific names
 * are available regardless of the active language.
 *
 * @param {'bn'|'en'} lang
 * @returns {Promise<Object>}
 */
export async function getDiseaseKnowledge(lang = 'bn') {
  const normalized = lang === 'en' ? 'en' : 'bn';

  if (!cache.bn) {
    const resBn = await fetch('/data/disease_information_bn.json');
    if (!resBn.ok) throw new Error(`HTTP ${resBn.status} fetching BN disease info`);
    cache.bn = await resBn.json();
  }

  if (!cache.en) {
    const resEn = await fetch('/data/disease_information_en.json');
    if (!resEn.ok) throw new Error(`HTTP ${resEn.status} fetching EN disease info`);
    cache.en = await resEn.json();
  }

  const bn = cache.bn;
  const en = cache.en;

  const base = normalized === 'en' ? en : bn;

  const mergedClasses = {};
  const allKeys = new Set([
    ...Object.keys(bn.classes || {}),
    ...Object.keys(en.classes || {}),
  ]);

  for (const k of allKeys) {
    const bnItem = bn.classes?.[k] || {};
    const enItem = en.classes?.[k] || {};

    mergedClasses[k] = {
      ...(normalized === 'en' ? bnItem : enItem),
      ...(normalized === 'en' ? enItem : bnItem),
      name_bn: bnItem.name_bn,
      name_en: enItem.name_en,
      scientific_name: enItem.scientific_name,
    };
  }

  return {
    ...base,
    classes: mergedClasses,
    _enClasses: en.classes,
    _bnClasses: bn.classes,
  };
}
