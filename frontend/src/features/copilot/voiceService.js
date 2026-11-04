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
  if (!isSpeechSynthesisSupported() || !text) {
    if (onEnd) onEnd();
    return () => {};
  }

  try {
    window.speechSynthesis.cancel();

    const voices = window.speechSynthesis.getVoices();
    const bnVoice = selectBestBengaliVoice(voices);

    // If voices are empty or no Bengali voice is found, try once to see if getVoices hasn't loaded
    if (!bnVoice && voices.length > 0) {
      // Confirmed voices loaded but zero Bengali voice available
      if (onVoiceUnavailable) {
        onVoiceUnavailable();
      }
      if (onEnd) onEnd();
      return () => {};
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.90; // Slightly measured pace for rural farmer comprehension
    utterance.pitch = 1.0;

    if (bnVoice) {
      utterance.voice = bnVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe no-op
      }
    };
  } catch (err) {
    if (onError) onError(err);
    if (onEnd) onEnd();
    return () => {};
  }
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
