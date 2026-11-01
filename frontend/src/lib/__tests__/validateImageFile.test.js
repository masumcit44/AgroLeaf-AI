import { describe, it, expect } from 'vitest';
import { validateImageFile } from '../validateImageFile.js';

describe('validateImageFile', () => {
  it('accepts standard JPEG, PNG, and WebP files', () => {
    const validJpg = new File([new Uint8Array(100)], 'leaf.jpg', { type: 'image/jpeg' });
    const validPng = new File([new Uint8Array(100)], 'leaf.png', { type: 'image/png' });
    const validWebp = new File([new Uint8Array(100)], 'leaf.webp', { type: 'image/webp' });

    expect(validateImageFile(validJpg)).toEqual({ ok: true });
    expect(validateImageFile(validPng)).toEqual({ ok: true });
    expect(validateImageFile(validWebp)).toEqual({ ok: true });
  });

  it('accepts files with empty mime type if extension is supported (Android workaround)', () => {
    const androidFile = new File([new Uint8Array(100)], 'IMG_20261101_070000.jpg', { type: '' });
    expect(validateImageFile(androidFile)).toEqual({ ok: true });
  });

  it('rejects unsupported types like PDF or text files', () => {
    const pdfFile = new File([new Uint8Array(100)], 'report.pdf', { type: 'application/pdf' });
    const textFile = new File([new Uint8Array(100)], 'notes.txt', { type: 'text/plain' });

    expect(validateImageFile(pdfFile)).toEqual({ ok: false, errorKey: 'errUnsupportedType' });
    expect(validateImageFile(textFile)).toEqual({ ok: false, errorKey: 'errUnsupportedType' });
  });

  it('rejects files exceeding 10 MB limit', () => {
    const bigBytes = 10 * 1024 * 1024 + 1; // 10MB + 1 byte
    const largeFile = {
      name: 'large.jpg',
      type: 'image/jpeg',
      size: bigBytes,
    };

    expect(validateImageFile(largeFile)).toEqual({ ok: false, errorKey: 'errTooLarge' });
  });

  it('handles null or missing file safely', () => {
    expect(validateImageFile(null)).toEqual({ ok: false, errorKey: 'errDecodeFailed' });
  });
});
