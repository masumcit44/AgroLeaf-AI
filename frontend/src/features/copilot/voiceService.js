// Browser-native Free-Only Speech Recognition (STT) and Speech Synthesis (TTS) service
// Uses standard W3C Web Speech API with 'bn-BD' dialect.
// Zero external paid APIs, zero tracking, ephemeral client-side lifecycle.

export function isSpeechRecognitionSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.speechSynthesis && typeof window.SpeechSynthesisUtterance !== 'undefined');
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
        if (onError) onError('আপনার ব্রাউজারে ভয়েস রেকর্ডিং সাপোর্ট নেই। লিখে প্রশ্ন করুন।', 'unsupported');
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
    let messageBn = 'কথা বুঝতে সমস্যা হয়েছে। আবার চেষ্টা করুন।';
    const code = event.error;

    if (code === 'not-allowed' || code === 'service-not-allowed') {
      messageBn = 'মাইক্রোফোনের অনুমতি বন্ধ আছে। ব্রাউজার সেটিংসে অনুমতি চালু করুন অথবা লিখে প্রশ্ন করুন।';
    } else if (code === 'no-speech') {
      messageBn = 'কোনো কথা শোনা যায়নি। বাটনে চাপ দিয়ে আবার স্পষ্ট করে বলুন।';
    } else if (code === 'network') {
      messageBn = 'ইন্টারনেট সমস্যা। নেটওয়ার্ক চেক করুন অথবা নিচে লিখে প্রশ্ন করুন।';
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
        // Can throw if already active
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
 * Speaks Bengali text using native SpeechSynthesis
 *
 * @param {string} text - Bengali text to read aloud
 * @param {Object} options
 * @param {Function} options.onStart - Callback when speech begins
 * @param {Function} options.onEnd - Callback when speech concludes
 * @param {Function} options.onError - Callback on synthesis failure
 * @returns {Function} Stop audio playback function
 */
export function speakUtterance(text, { onStart, onEnd, onError } = {}) {
  if (!isSpeechSynthesisSupported() || !text) {
    if (onEnd) onEnd();
    return () => {};
  }

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(
      (v) => v.lang === 'bn-BD' || v.lang === 'bn_BD' || v.lang.startsWith('bn')
    );
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
