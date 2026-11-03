let cachedManifest = null;
let manifestFetchPromise = null;
const RETRY_DELAYS_MS = [800, 2500];

async function fetchManifestOnce() {
  const res = await fetch('/audio/manifest.json', { cache: 'no-cache' });
  if (res.status === 404) return {}; // no clips generated: a real answer, cached
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) || {};
}

/**
 * Fetch and cache the audio manifest.
 * Only a real answer is cached. A network error or server error is retried, and
 * if it still fails the next call tries again. Caching that failure made every
 * class lose its voice for the rest of the visit (slow connections while the
 * model downloads).
 *
 * @returns {Promise<Record<string, { file: string, voice: string, chars: number, generated_at: string }>>}
 */
export async function getAudioManifest() {
  if (cachedManifest !== null) {
    return cachedManifest;
  }

  if (manifestFetchPromise) {
    return manifestFetchPromise;
  }

  manifestFetchPromise = (async () => {
    try {
      for (let attempt = 0; ; attempt += 1) {
        try {
          cachedManifest = await fetchManifestOnce();
          return cachedManifest;
        } catch {
          if (attempt >= RETRY_DELAYS_MS.length) return {};
          await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
        }
      }
    } finally {
      manifestFetchPromise = null;
    }
  })();

  return manifestFetchPromise;
}

/** Test hook: forget the cached manifest. */
export function resetAudioManifestCache() {
  cachedManifest = null;
  manifestFetchPromise = null;
}

/**
 * Which clip to play for a class, or null when none was generated.
 * Pure function. Only manifest entries count: a guessed URL for a missing
 * file is answered with index.html by the SPA fallback, which made the play
 * button silently fail (QA E3).
 *
 * @param {Record<string, { file?: string, voice?: string }>|null|undefined} manifest
 * @param {string} classKey
 * @returns {{ url: string, isHuman: boolean } | null}
 */
export function resolveAudioEntry(manifest, classKey) {
  const entry = manifest && typeof manifest === 'object' ? manifest[classKey] : null;
  if (!entry || typeof entry.file !== 'string' || entry.file.length === 0) return null;
  return { url: entry.file, isHuman: entry.voice === 'human' };
}
