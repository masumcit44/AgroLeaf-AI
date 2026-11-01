const cache = {
  bn: null,
  en: null,
};

/**
 * Fetch and cache disease knowledge JSON for the active language.
 *
 * @param {'bn'|'en'} lang
 * @returns {Promise<Object>}
 */
export async function getDiseaseKnowledge(lang = 'bn') {
  const normalized = lang === 'en' ? 'en' : 'bn';
  if (cache[normalized]) {
    return cache[normalized];
  }

  const url = `/data/disease_information_${normalized}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const data = await res.json();
  cache[normalized] = data;
  return data;
}
