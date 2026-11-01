import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import DevParityPage from '../DevParityPage.jsx';
import { decodeTensorData, runParityCheckA } from '../../lib/parityVerification.js';
import parityFixture from './fixtures/parity-fixture.json';

describe('DevParityPage & Parity Tools', () => {
  it('decodeTensorData handles array format', () => {
    const sample = { preprocessed_tensor: [0.1, 0.2, 0.3] };
    const arr = decodeTensorData(sample);
    expect(arr).toBeInstanceOf(Float32Array);
    expect(arr.length).toBe(3);
    expect(arr[0]).toBeCloseTo(0.1);
  });

  it('decodeTensorData handles base64 format', () => {
    const original = new Float32Array([1.5, -2.5, 3.0]);
    const bytes = new Uint8Array(original.buffer);
    let binStr = '';
    for (let i = 0; i < bytes.length; i++) {
      binStr += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binStr);
    const sample = { preprocessed_tensor_b64: b64 };
    const decoded = decodeTensorData(sample);
    expect(decoded).toBeInstanceOf(Float32Array);
    expect(decoded.length).toBe(3);
    expect(decoded[0]).toBeCloseTo(1.5);
    expect(decoded[1]).toBeCloseTo(-2.5);
  });

  it('runParityCheckA matches within 1e-3 on parity fixture', async () => {
    const sample = parityFixture[0];
    const mockSession = {
      inputNames: ['input'],
      outputNames: ['logits'],
      run: async () => {
        // Return logits matching expected probabilities closely:
        // p = [0.169129, 0.166647, 0.163595, 0.168476, 0.170159, 0.161994]
        // log(p) = [-1.77709, -1.79188, -1.81036, -1.78096, -1.77102, -1.82020]
        const mockLogits = [-1.77709, -1.79188, -1.81036, -1.78096, -1.77102, -1.8202];
        return {
          logits: { data: new Float32Array(mockLogits) },
        };
      },
    };
    const mockBundle = {
      session: mockSession,
      calibration: { temperature: 1.0 },
    };

    const res = await runParityCheckA(sample, mockBundle);
    expect(res.pass).toBe(true);
    expect(res.maxDiff).toBeLessThan(1e-3);
  });

  it('renders "no-parity-samples" when samples list is empty or null', () => {
    const html = renderToString(
      <DevParityPage initialSamples={[]} />
    );
    expect(html).toContain('data-testid="no-parity-samples"');
    expect(html).toContain('নমুনা নেই');
  });

  it('renders table when initialSamples are provided', () => {
    const html = renderToString(
      <DevParityPage initialSamples={parityFixture} />
    );
    expect(html).toContain('data-testid="parity-table"');
    expect(html).toContain('Sample Verification Records');
    expect(html).toContain('sample_tungro.jpg');
    expect(html).toContain('tungro');
  });
});
