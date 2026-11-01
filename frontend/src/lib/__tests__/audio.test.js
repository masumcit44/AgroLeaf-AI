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
