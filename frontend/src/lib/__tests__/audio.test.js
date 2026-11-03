import { describe, it, expect, vi } from 'vitest';
import { getAudioManifest } from '../audioManifest.js';

describe('Audio Manifest Loader', () => {
  it('returns empty object gracefully when fetch fails or 404s without throwing', async () => {
    // Mock global fetch to return 404
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    try {
      const manifest = await getAudioManifest();
      expect(manifest).toBeDefined();
      expect(typeof manifest).toBe('object');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe('resolveAudioEntry (QA E3)', () => {
  it('returns null when the manifest is missing or has no entry, so no dead play button is shown', async () => {
    const { resolveAudioEntry } = await import('../audioManifest.js');
    expect(resolveAudioEntry({}, 'blast')).toBeNull();
    expect(resolveAudioEntry(null, 'blast')).toBeNull();
    expect(resolveAudioEntry({ blast: { voice: 'ai' } }, 'blast')).toBeNull();
  });

  it('returns the generated clip and its voice type', async () => {
    const { resolveAudioEntry } = await import('../audioManifest.js');
    expect(resolveAudioEntry({ blast: { file: '/audio/blast-v1.mp3', voice: 'ai' } }, 'blast')).toEqual({ url: '/audio/blast-v1.mp3', isHuman: false });
    expect(resolveAudioEntry({ healthy: { file: '/audio/healthy-v1.mp3', voice: 'human' } }, 'healthy')).toEqual({ url: '/audio/healthy-v1.mp3', isHuman: true });
  });
});

describe('getAudioManifest retries instead of caching a failure', () => {
  it('a network failure is not cached: the next call loads the voice list', async () => {
    vi.useFakeTimers();
    const { getAudioManifest: get, resetAudioManifestCache } = await import('../audioManifest.js');
    resetAudioManifestCache();
    const originalFetch = globalThis.fetch;
    const good = { blast: { file: '/audio/blast-v1.mp3', voice: 'ai' } };
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    try {
      const first = get();
      await vi.runAllTimersAsync();
      expect(await first).toEqual({});
      expect(globalThis.fetch).toHaveBeenCalledTimes(3); // one try + two retries
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => good });
      expect(await get()).toEqual(good);
    } finally {
      globalThis.fetch = originalFetch;
      vi.useRealTimers();
      resetAudioManifestCache();
    }
  });

  it('recovers within one call when a retry succeeds', async () => {
    vi.useFakeTimers();
    const { getAudioManifest: get, resetAudioManifestCache } = await import('../audioManifest.js');
    resetAudioManifestCache();
    const originalFetch = globalThis.fetch;
    const good = { healthy: { file: '/audio/healthy-v1.mp3', voice: 'ai' } };
    globalThis.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValue({ ok: true, status: 200, json: async () => good });
    try {
      const p = get();
      await vi.runAllTimersAsync();
      expect(await p).toEqual(good);
    } finally {
      globalThis.fetch = originalFetch;
      vi.useRealTimers();
      resetAudioManifestCache();
    }
  });
});
