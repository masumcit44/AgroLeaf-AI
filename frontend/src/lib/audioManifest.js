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
