let cachedManifest = null;
let manifestFetchPromise = null;

/**
 * Fetch and cache the audio manifest if available.
 * Returns null or empty object if manifest is missing (audio not generated yet).
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
      const res = await fetch('/audio/manifest.json');
      if (!res.ok) {
        cachedManifest = {};
        return cachedManifest;
      }
      const data = await res.json();
      cachedManifest = data || {};
      return cachedManifest;
    } catch {
      cachedManifest = {};
      return cachedManifest;
    } finally {
      manifestFetchPromise = null;
    }
  })();

  return manifestFetchPromise;
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
