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
