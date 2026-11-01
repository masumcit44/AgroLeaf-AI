import { describe, it, expect } from 'vitest';
import { gateSaysNotRice } from '../nonriceGate.js';

describe('gateSaysNotRice', () => {
  it('rejects only when not_rice is the top output', () => {
    expect(gateSaysNotRice([0.1, 0.2, 0, 0, 0, 0, 0.3, 2.5], 7)).toBe(true);
    expect(gateSaysNotRice([3.0, 0.2, 0, 0, 0, 0, 0.3, 2.5], 7)).toBe(false);
    expect(gateSaysNotRice([0, 0, 0, 0, 0, 0, 4.0, 2.5], 7)).toBe(false); // other_rice is not "not a leaf"
  });
  it('never rejects on malformed output', () => {
    expect(gateSaysNotRice([], 7)).toBe(false);
    expect(gateSaysNotRice(null, 7)).toBe(false);
    expect(gateSaysNotRice([1, 2, 3], 7)).toBe(false);
  });
});
