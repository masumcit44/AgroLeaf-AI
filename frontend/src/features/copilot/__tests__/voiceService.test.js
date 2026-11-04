import { describe, it, expect, beforeEach, vi } from 'vitest';
import { speakUtterance, cleanTextForSpeech, splitForSpeech, selectBestBengaliVoice } from '../voiceService.js';

const EN = { lang: 'en-US', name: 'Google US English' };
const BN = { lang: 'bn-BD', name: 'Google বাংলা' };

// Minimal Web Speech fake: voices can arrive late through 'voiceschanged', like Chrome/Android
function installSpeech(initialVoices) {
  let voices = initialVoices;
  const listeners = new Set();
  const spoken = [];
  const synth = {
    getVoices: () => voices,
    speak: vi.fn((u) => spoken.push(u)),
    cancel: vi.fn(),
    addEventListener: (ev, fn) => ev === 'voiceschanged' && listeners.add(fn),
    removeEventListener: (ev, fn) => listeners.delete(fn),
    loadVoices: (v) => { voices = v; listeners.forEach((fn) => fn()); },
  };
  globalThis.window = globalThis;
  globalThis.speechSynthesis = synth;
  globalThis.SpeechSynthesisUtterance = function (text) { this.text = text; };
  return { synth, spoken };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('Bengali speech', () => {
  beforeEach(() => vi.useRealTimers());

  it('waits for late-loading voices and speaks with the Bengali voice, never the default', async () => {
    const { synth, spoken } = installSpeech([]);
    speakUtterance('ধানের পাতায় ব্লাস্ট রোগ হয়েছে।');
    await flush();
    expect(spoken).toHaveLength(0); // nothing spoken while the list is still empty
    synth.loadVoices([EN, BN]);
    await flush();
    expect(spoken).toHaveLength(1);
    expect(spoken[0].voice).toBe(BN);
    expect(spoken[0].lang).toBe('bn-BD');
  });

  it('with only English voices it does not speak at all and reports it', async () => {
    const { spoken } = installSpeech([EN]);
    const onVoiceUnavailable = vi.fn();
    const onEnd = vi.fn();
    speakUtterance('বাংলা উত্তর', { onVoiceUnavailable, onEnd });
    await flush();
    expect(spoken).toHaveLength(0);
    expect(onVoiceUnavailable).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('when the voice list never loads, it gives up silently instead of using the default voice', async () => {
    vi.useFakeTimers();
    const { spoken } = installSpeech([]);
    const onVoiceUnavailable = vi.fn();
    speakUtterance('বাংলা উত্তর', { onVoiceUnavailable });
    await vi.advanceTimersByTimeAsync(2100);
    expect(spoken).toHaveLength(0);
    expect(onVoiceUnavailable).toHaveBeenCalled();
  });

  it('stop before voices load prevents any speech', async () => {
    const { synth, spoken } = installSpeech([]);
    const stop = speakUtterance('বাংলা উত্তর');
    stop();
    synth.loadVoices([BN]);
    await flush();
    expect(spoken).toHaveLength(0);
  });

  it('cancels earlier speech so answers never overlap', () => {
    const { synth } = installSpeech([BN]);
    speakUtterance('প্রথম');
    expect(synth.cancel).toHaveBeenCalled();
  });

  it('prefers bn-BD, then bn-IN, never English', () => {
    expect(selectBestBengaliVoice([EN, { lang: 'bn-IN' }, BN])).toBe(BN);
    expect(selectBestBengaliVoice([EN, { lang: 'bn-IN' }]).lang).toBe('bn-IN');
    expect(selectBestBengaliVoice([EN])).toBeNull();
  });

  it('does not read URLs, markdown or source lines aloud', () => {
    const t = cleanTextForSpeech('**কী করবেন:** জমি দেখুন।\nউৎস: BRRI https://brri.gov.bd [1]');
    expect(t).toBe('কী করবেন: জমি দেখুন।');
  });

  it('splits long answers at sentence ends', () => {
    const long = Array.from({ length: 12 }, (_, i) => `এটি বাক্য নম্বর ${i + 1} যা বেশ লম্বা।`).join(' ');
    const parts = splitForSpeech(long, 120);
    expect(parts.length).toBeGreaterThan(1);
    parts.forEach((p) => expect(p.length).toBeLessThanOrEqual(120));
    expect(parts.join(' ')).toBe(long);
  });
});
