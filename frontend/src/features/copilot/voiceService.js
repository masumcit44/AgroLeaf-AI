// Browser-native Free-Only Speech Recognition (STT) and Speech Synthesis (TTS) service
// Uses standard W3C Web Speech API with 'bn-BD' dialect.
// Zero external paid APIs, zero tracking, ephemeral client-side lifecycle.
// Adheres strictly to the Bangla Response Language Policy (never falls back to English speech).

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== 'undefined');
}

/**
 * Selects the best genuine Bengali voice from the browser's available voice list.
 * Priority: 1. bn-BD (Bangladeshi Bangla) -> 2. bn-IN (Indian Bangla) -> 3. starts with 'bn'.
 * If no Bengali voice is found, returns null (never falls back to English!).
 *
 * @param {SpeechSynthesisVoice[]} [voices]
 * @returns {SpeechSynthesisVoice|null}
 */
export function selectBestBengaliVoice(voices = null) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voiceList = voices || window.speechSynthesis.getVoices() || [];
  if (voiceList.length === 0) return null;

  // 1. Exact Bangladeshi Bengali
  const bnBd = voiceList.find(
    (v) => v.lang === 'bn-BD' || v.lang === 'bn_BD'
  );
  if (bnBd) return bnBd;

  // 2. Indian Bengali (phonetically standard for agricultural terms)
  const bnIn = voiceList.find(
    (v) => v.lang === 'bn-IN' || v.lang === 'bn_IN'
  );
  if (bnIn) return bnIn;

  // 3. General Bengali prefix
  const bnGeneral = voiceList.find(
    (v) => v.lang && v.lang.toLowerCase().startsWith('bn')
  );
  if (bnGeneral) return bnGeneral;

  return null;
}

/**
 * Creates and wraps an accessible Bengali speech recognizer instance.
 *
 * @param {Object} options
 * @param {Function} options.onResult - (transcript, isFinal) => void
 * @param {Function} options.onError - (errorMessageBn, errorCode) => void
 * @param {Function} options.onStateChange - (state: 'idle'|'listening'|'processing') => void
 * @returns {Object} { start, stop, abort }
 */
export function createSpeechRecognizer({ onResult, onError, onStateChange } = {}) {
  if (!isSpeechRecognitionSupported()) {
    return {
      start: () => {
        if (onError) onError('আপনার ব্রাউজারে ভয়েস রেকর্ডিং সাপোর্ট নেই। নিচে লিখে প্রশ্ন করুন।', 'unsupported');
      },
      stop: () => {},
      abort: () => {},
    };
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.lang = 'bn-BD';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {
    if (onStateChange) onStateChange('listening');
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      if (item.isFinal) {
        finalTranscript += item[0].transcript;
      } else {
        interimTranscript += item[0].transcript;
      }
    }

    if (finalTranscript && onResult) {
      if (onStateChange) onStateChange('processing');
      onResult(finalTranscript.trim(), true);
    } else if (interimTranscript && onResult) {
      onResult(interimTranscript.trim(), false);
    }
  };

  recognition.onerror = (event) => {
    let messageBn = 'কথা বুঝতে সমস্যা হয়েছে। বাটনে চাপ দিয়ে আবার বলুন।';
    const code = event.error;

    if (code === 'not-allowed' || code === 'service-not-allowed') {
      messageBn = 'মাইক্রোফোনের অনুমতি বন্ধ আছে। ব্রাউজার সেটিংসে অনুমতি চালু করুন অথবা নিচে লিখে প্রশ্ন করুন।';
    } else if (code === 'no-speech') {
      messageBn = 'কোনো কথা শোনা যায়নি। বাটনে চাপ দিয়ে আবার স্পষ্ট করে বলুন।';
    } else if (code === 'network') {
      messageBn = 'ইন্টারনেট সংযোগে সমস্যা হচ্ছে। সংযোগ চেক করুন অথবা নিচে লিখে প্রশ্ন করুন।';
    } else if (code === 'audio-capture') {
      messageBn = 'মাইক্রোফোন পাওয়া যায়নি। অনুগ্রহ করে অডিও ডিভাইস চেক করুন।';
    }

    if (onError) onError(messageBn, code);
    if (onStateChange) onStateChange('idle');
  };

  recognition.onend = () => {
    if (onStateChange) onStateChange('idle');
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch {
        if (onStateChange) onStateChange('listening');
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // Safe no-op
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch {
        // Safe no-op
      }
    },
  };
}

/**
 * Speaks Bengali text using native SpeechSynthesis.
 * Enforces Bengali voice lock: if no genuine Bengali voice is available on device,
 * gracefully cancels speech and invokes onVoiceUnavailable callback rather than
 * outputting garbled English phonemes.
 *
 * @param {string} text - Bengali text to read aloud
 * @param {Object} options
 * @param {Function} [options.onStart] - Callback when speech begins
 * @param {Function} [options.onEnd] - Callback when speech concludes
 * @param {Function} [options.onError] - Callback on synthesis failure
 * @param {Function} [options.onVoiceUnavailable] - Callback if Bengali voice is missing
 * @returns {Function} Stop audio playback function
 */
export function speakUtterance(text, { onStart, onEnd, onError, onVoiceUnavailable } = {}) {
  const chunks = splitForSpeech(cleanTextForSpeech(text));
  if (!isSpeechSynthesisSupported() || chunks.length === 0) {
    if (onEnd) onEnd();
    return () => {};
  }

  let stopped = false;
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    if (onEnd) onEnd();
  };

  window.speechSynthesis.cancel(); // never overlap with an earlier answer

  // The voice list loads asynchronously (empty on the first call in Chrome and on many
  // Android phones). Speaking before it loads, or without an explicit Bengali voice, makes the
  // browser use its default voice: Bengali text read with English pronunciation. So wait for
  // the list, and speak only with a genuine Bengali voice.
  waitForVoices().then((voices) => {
    if (stopped) return;
    const bnVoice = selectBestBengaliVoice(voices);
    if (!bnVoice) {
      if (onVoiceUnavailable) onVoiceUnavailable();
      finish();
      return;
    }

    chunks.forEach((chunk, i) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.voice = bnVoice;
      utterance.lang = bnVoice.lang;
      utterance.rate = 0.90; // Slightly measured pace for rural farmer comprehension
      utterance.pitch = 1.0;
      if (i === 0) utterance.onstart = () => onStart && onStart();
      if (i === chunks.length - 1) utterance.onend = finish;
      utterance.onerror = (e) => {
        if (stopped || e?.error === 'interrupted' || e?.error === 'canceled') return finish();
        if (onError) onError(e);
        finish();
      };
      window.speechSynthesis.speak(utterance);
    });
  }).catch((err) => {
    if (onError) onError(err);
    finish();
  });

  return () => {
    stopped = true;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Safe no-op
    }
    finish();
  };
}

/** Resolves with the browser's voice list, waiting up to `timeoutMs` for it to load. */
export function waitForVoices(timeoutMs = 2000) {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const now = synth.getVoices();
    if (now && now.length > 0) return resolve(now);
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      synth.removeEventListener?.('voiceschanged', settle);
      resolve(synth.getVoices() || []);
    };
    synth.addEventListener?.('voiceschanged', settle);
    setTimeout(settle, timeoutMs);
  });
}

/**
 * Text as it should be heard: no URLs, markdown symbols, source/citation lines or bracketed
 * references. The written answer on screen is not changed.
 */
export function cleanTextForSpeech(text) {
  if (!text) return '';
  return String(text)
    .split('\n')
    .filter((line) => !/^\s*(উৎস|তথ্যসূত্র|সূত্র|source|sources|reference)s?\s*[:：]/i.test(line))
    .join('\n')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[*_#>`|~]+/g, ' ')
    .replace(/\[(\d+|[০-৯]+)\]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/**
 * Chrome stops a single utterance after ~15 s, so long answers are split at sentence ends
 * (।, ?, !, ., new line) into pieces of at most `maxLen` characters, spoken one after another.
 */
export function splitForSpeech(text, maxLen = 180) {
  if (!text) return [];
  const sentences = text.split(/(?<=[।?!.\n])\s*/).map((s) => s.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if (current && (current + ' ' + s).length > maxLen) {
      chunks.push(current);
      current = s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Safe no-op
    }
  }
}
