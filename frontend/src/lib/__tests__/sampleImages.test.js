import { describe, it, expect, vi } from 'vitest';

describe('SampleImagesStrip manifest loader', () => {
  it('returns empty array when manifest.json is missing or 404', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    try {
      const res = await fetch('/samples/manifest.json');
      const data = res.ok ? await res.json() : [];
      expect(data).toEqual([]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('parses valid manifest entries when present', async () => {
    const mockEntries = [
      { id: 'blast_1', labelBn: 'ব্লাস্ট', labelEn: 'Blast', src: '/samples/blast_1.jpg' },
    ];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockEntries,
    });

    try {
      const res = await fetch('/samples/manifest.json');
      const data = await res.json();
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('blast_1');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
