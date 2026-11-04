// Pre-recorded Bengali copilot answers: the build output really exists and matches what the app
// shows, and playback picks the clip for the displayed answer (no English voice path).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { collectCopilotTexts, audioKey } from '../../../../scripts/collect_copilot_texts.mjs';
import { audioKeyFor, playAnswerAudio, stopAnswerAudio } from '../voiceService.js';
import { queryAgriculturalCopilot } from '../copilotEngine.js';
import { AUDIO_URL_PATTERN } from '../../pwa/cacheConfig.js';

const AUDIO_DIR = fileURLToPath(new URL('../../../../public/audio/copilot/', import.meta.url));
const manifest = JSON.parse(readFileSync(AUDIO_DIR + 'manifest.json', 'utf8'));

describe('recorded copilot audio (real files)', () => {
  const texts = collectCopilotTexts();

  it('every fixed Bengali answer has a manifest entry and a real MP3 under 25 MiB', () => {
    expect(texts.length).toBeGreaterThan(100);
    const missing = texts.filter(({ key }) => !manifest[key]);
    expect(missing.map((m) => m.text.slice(0, 40))).toEqual([]);
    for (const { key } of texts) {
      const file = AUDIO_DIR + key + '.mp3';
      expect(existsSync(file)).toBe(true);
      const size = statSync(file).size;
      expect(size).toBeGreaterThan(1000);
      expect(size).toBeLessThan(25 * 2 ** 20);
    }
  });

  it('the browser key equals the build key (same cleaning + SHA-256)', async () => {
    for (const { text } of texts.slice(0, 10)) expect(await audioKeyFor(text)).toBe(audioKey(text));
  });

  it.each([
    'আমার ধানে ব্লাস্ট হয়েছে, এখন কী করব?',
    'আমার ধানের পাতায় বাদামি দাগ দেখা যাচ্ছে।',
    'টুংরো হলে কী করব?',
    'ইউরিয়া সার কখন দেব?',
    'আম সম্পর্কে জানতে চাই।',
    'আলু চাষ সম্পর্কে বলুন',
  ])('the answer the engine shows for "%s" has a recorded clip', async (q) => {
    const { textBn } = queryAgriculturalCopilot(q);
    expect(manifest[await audioKeyFor(textBn)]).toBeTruthy();
  });

  it('copilot clips are runtime-cached by the service worker (offline after first play)', () => {
    expect(AUDIO_URL_PATTERN.test('https://x.pages.dev/audio/copilot/0123456789abcdef.mp3')).toBe(true);
    expect(AUDIO_URL_PATTERN.test('https://x.pages.dev/audio/blast-v1.mp3')).toBe(true);
  });
});

describe('playAnswerAudio', () => {
  let played;
  class FakeAudio {
    constructor(url) { this.url = url; played.push(this); }
    play() { this.playing = true; return Promise.resolve(); }
    pause() { this.playing = false; }
  }
  const tick = () => new Promise((r) => setTimeout(r, 0));

  beforeEach(() => {
    played = [];
    stopAnswerAudio();
    globalThis.window = globalThis;
    globalThis.speechSynthesis = { getVoices: () => [{ lang: 'en-US' }], speak: vi.fn(), cancel: vi.fn(),
      addEventListener() {}, removeEventListener() {} };
    globalThis.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });

  async function playFor(text, fetchManifest, extra = {}) {
    const fetchImpl = async () => ({ ok: true, json: async () => fetchManifest });
    const stop = playAnswerAudio(text, { fetchImpl, AudioImpl: FakeAudio, ...extra });
    await tick(); await tick();
    return stop;
  }

  it('plays the clip for the displayed answer; a second answer stops the first; stop + replay work', async () => {
    const a = 'ব্লাস্ট হলে জমি দেখুন।';
    const b = 'টুংরো হলে পাতাফড়িং দেখুন।';
    const m = { [await audioKeyFor(a)]: '/audio/copilot/a.mp3', [await audioKeyFor(b)]: '/audio/copilot/b.mp3' };
    await playFor(a, m); // first call loads the manifest (cached for the page after that)
    expect(played.at(-1).url).toBe('/audio/copilot/a.mp3');
    await playFor(b, m);
    expect(played.at(-2).playing).toBe(false); // first one stopped, no overlap
    expect(played.at(-1).url).toBe('/audio/copilot/b.mp3');
    const stop = await playFor(a, m);
    stop();
    expect(played.at(-1).playing).toBe(false);
    await playFor(a, m); // replay
    expect(played.at(-1).playing).toBe(true);
  });

  it('a dynamic answer with no clip never uses an English voice', async () => {
    const onVoiceUnavailable = vi.fn();
    await playFor('আপনার জমির জন্য বিশেষ পরিকল্পনা ১২৩।', {}, { onVoiceUnavailable });
    await new Promise((r) => setTimeout(r, 30));
    expect(globalThis.speechSynthesis.speak).not.toHaveBeenCalled();
    expect(onVoiceUnavailable).toHaveBeenCalled();
  });
});
