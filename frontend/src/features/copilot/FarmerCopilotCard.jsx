import React, { useState, useEffect, useRef, useCallback } from 'react';
import { queryAgriculturalCopilot } from './copilotEngine.js';
import {
  createSpeechRecognizer,
  speakUtterance,
  stopSpeech,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
} from './voiceService.js';
import useT from '../../i18n/useT.js';

export default function FarmerCopilotCard({ scan }) {
  const { lang } = useT();

  // Active scan disease context
  const activeDisease = scan?.classKey || null;

  // State
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [transcript, setTranscript] = useState('');
  const [queryText, setQueryText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copilotResponse, setCopilotResponse] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // References
  const recognizerRef = useRef(null);
  const stopPlaybackRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
      stopSpeech();
    };
  }, []);

  // Answer handler
  const handleProcessQuery = useCallback(
    (question) => {
      if (!question || !question.trim()) return;

      setVoiceState('processing');
      setErrorMessage(null);

      // Deterministic Local RAG Query
      const answer = queryAgriculturalCopilot(question, activeDisease);
      setCopilotResponse(answer);

      // Auto-read response aloud if synthesis is supported
      if (isSpeechSynthesisSupported() && answer?.voiceBn) {
        setVoiceState('speaking');
        setIsAudioPlaying(true);

        stopPlaybackRef.current = speakUtterance(answer.voiceBn, {
          onStart: () => {
            setIsAudioPlaying(true);
            setVoiceState('speaking');
          },
          onEnd: () => {
            setIsAudioPlaying(false);
            setVoiceState('idle');
          },
          onError: () => {
            setIsAudioPlaying(false);
            setVoiceState('idle');
          },
        });
      } else {
        setVoiceState('idle');
      }
    },
    [activeDisease]
  );

  // Voice recognition trigger
  const handleToggleMic = () => {
    // If speaking, stop playback
    if (isAudioPlaying || voiceState === 'speaking') {
      stopSpeech();
      setIsAudioPlaying(false);
      setVoiceState('idle');
      return;
    }

    // If already listening, stop
    if (voiceState === 'listening') {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setVoiceState('idle');
      return;
    }

    setErrorMessage(null);
    setTranscript('');

    // Check browser support
    if (!isSpeechRecognitionSupported()) {
      setShowTextInput(true);
      setErrorMessage(
        lang === 'en'
          ? 'Voice recognition is not supported on this browser. Please type your question.'
          : 'আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই। দয়া করে লিখে প্রশ্ন করুন।'
      );
      return;
    }

    try {
      recognizerRef.current = createSpeechRecognizer({
        onResult: (text, isFinal) => {
          setTranscript(text);
          setQueryText(text);
          if (isFinal) {
            handleProcessQuery(text);
          }
        },
        onError: (errBn) => {
          setErrorMessage(errBn);
          setVoiceState('idle');
        },
        onStateChange: (st) => {
          setVoiceState(st);
        },
      });

      recognizerRef.current.start();
    } catch {
      setVoiceState('idle');
      setShowTextInput(true);
    }
  };

  // Replay speech response
  const handleReplayAudio = () => {
    if (!copilotResponse?.voiceBn) return;

    if (isAudioPlaying) {
      stopSpeech();
      setIsAudioPlaying(false);
      setVoiceState('idle');
      return;
    }

    setIsAudioPlaying(true);
    setVoiceState('speaking');

    stopPlaybackRef.current = speakUtterance(copilotResponse.voiceBn, {
      onStart: () => {
        setIsAudioPlaying(true);
        setVoiceState('speaking');
      },
      onEnd: () => {
        setIsAudioPlaying(false);
        setVoiceState('idle');
      },
      onError: () => {
        setIsAudioPlaying(false);
        setVoiceState('idle');
      },
    });
  };

  // Submit typed query
  const handleSubmitTypedQuery = (e) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setTranscript(queryText);
    handleProcessQuery(queryText);
  };

  // Quick suggestion chips
  const quickQuestions = [
    'কী ওষুধ দেব?',
    'সার দেওয়া যাবে?',
    'পানি ব্যবস্থাপনা কেমন হবে?',
    'জৈব প্রতিকার কী?',
  ];

  return (
    <div
      className="bg-white rounded-2xl shadow-md border border-leaf-200 overflow-hidden my-4"
      data-testid="farmer-copilot-card"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-leaf-700 via-leaf-800 to-leaf-900 px-4 py-3 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-2xl" role="img" aria-label="assistant">
            🌾
          </span>
          <div>
            <h3 className="font-bold text-base leading-tight">
              {lang === 'en' ? 'AgroLeaf Voice Copilot' : 'এগ্রোলিফ ভয়েস সহকারী'}
            </h3>
            <p className="text-xs text-leaf-100">
              {lang === 'en'
                ? 'Ask questions in spoken Bangla'
                : 'মুখে বাংলায় প্রশ্ন করুন, উত্তর শুনুন'}
            </p>
          </div>
        </div>

        {activeDisease && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-leaf-100 text-leaf-900">
            {activeDisease}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Main Voice Button Section */}
        <div className="flex flex-col items-center justify-center my-2 text-center">
          <div className="relative">
            {/* Pulsing ring when listening */}
            {voiceState === 'listening' && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            )}
            {voiceState === 'speaking' && (
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-leaf-400 opacity-50" />
            )}

            <button
              type="button"
              onClick={handleToggleMic}
              aria-label={
                voiceState === 'listening'
                  ? 'রেকর্ডিং বন্ধ করুন'
                  : voiceState === 'speaking'
                  ? 'কথা থামান'
                  : 'কথা বলতে চাপুন'
              }
              className={`relative z-10 flex items-center justify-center w-20 h-20 rounded-full shadow-lg transition-all transform active:scale-95 focus:outline-none focus:ring-4 ${
                voiceState === 'listening'
                  ? 'bg-red-600 text-white ring-red-300 animate-pulse'
                  : voiceState === 'speaking'
                  ? 'bg-amber-600 text-white ring-amber-300'
                  : 'bg-leaf-700 hover:bg-leaf-800 text-white ring-leaf-300'
              }`}
            >
              {voiceState === 'listening' ? (
                <svg className="w-10 h-10 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              ) : voiceState === 'speaking' ? (
                <span className="text-3xl" role="img" aria-label="speaker">
                  🔊
                </span>
              ) : (
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          </div>

          {/* Status Label */}
          <p className="mt-3 text-sm font-semibold text-gray-800">
            {voiceState === 'listening'
              ? '🎙️ শুনছি... এখন কথা বলুন'
              : voiceState === 'processing'
              ? '⏳ উত্তর প্রস্তুত হচ্ছে...'
              : voiceState === 'speaking'
              ? '🔊 উত্তর বলা হচ্ছে... (থামাতে বাটনে চাপুন)'
              : '👉 মাইকে চাপ দিয়ে বাংলায় প্রশ্ন করুন'}
          </p>

          {/* Transcript feedback while speaking */}
          {transcript && (
            <p className="mt-1 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 italic max-w-xs truncate">
              "{transcript}"
            </p>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Response Card */}
        {copilotResponse && (
          <div
            className={`mt-4 p-4 rounded-xl border transition-all ${
              copilotResponse.isAbstention
                ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                : 'bg-leaf-50/60 border-leaf-300 text-gray-900'
            }`}
            data-testid="copilot-response-container"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-sm text-leaf-950 flex items-center space-x-1.5">
                <span>🌾</span>
                <span>{copilotResponse.titleBn}</span>
              </h4>

              {/* Listen / Stop audio controls */}
              {copilotResponse.voiceBn && isSpeechSynthesisSupported() && (
                <button
                  type="button"
                  onClick={handleReplayAudio}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-leaf-700 hover:bg-leaf-800 text-white flex items-center space-x-1 shadow-sm transition-colors"
                >
                  <span>{isAudioPlaying ? '⏹️ থামান' : '🔊 শুনুন'}</span>
                </button>
              )}
            </div>

            <p className="text-sm leading-relaxed text-gray-800 font-medium">
              {copilotResponse.textBn}
            </p>

            {/* Safety Caution Note */}
            {copilotResponse.safetyNote && (
              <div className="mt-2.5 p-2 bg-amber-100/90 rounded-lg border border-amber-300 text-xs text-amber-900 font-semibold flex items-center space-x-1.5">
                <span>🛡️</span>
                <span>{copilotResponse.safetyNote}</span>
              </div>
            )}

            {/* Emergency Helpline Prompt */}
            {copilotResponse.helplinePrompt && (
              <div className="mt-3 pt-2 border-t border-amber-200 flex items-center justify-between">
                <span className="text-xs text-amber-950 font-bold">
                  কৃষি কল সেন্টার (বিনামূল্যে):
                </span>
                <a
                  href="tel:16123"
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors"
                >
                  📞 ১৬১২৩ কল করুন
                </a>
              </div>
            )}
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            💡 {lang === 'en' ? 'Suggested questions:' : 'সরাসরি প্রশ্ন বেছে নিন:'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickQuestions.map((chipText) => (
              <button
                key={chipText}
                type="button"
                onClick={() => {
                  setTranscript(chipText);
                  setQueryText(chipText);
                  handleProcessQuery(chipText);
                }}
                className="px-2.5 py-1 rounded-full text-xs bg-gray-100 hover:bg-leaf-100 hover:text-leaf-800 text-gray-700 border border-gray-200 transition-colors font-medium text-left"
              >
                {chipText}
              </button>
            ))}
          </div>
        </div>

        {/* Typed Input Fallback Drawer */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowTextInput(!showTextInput)}
              className="text-xs text-leaf-800 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>{showTextInput ? '▲ টাইপ বন্ধ করুন' : '⌨️ লিখে প্রশ্ন করতে চান?'}</span>
            </button>

            {copilotResponse && (
              <button
                type="button"
                onClick={() => {
                  setCopilotResponse(null);
                  setTranscript('');
                  setQueryText('');
                  stopSpeech();
                  setIsAudioPlaying(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                🔄 নতুন প্রশ্ন
              </button>
            )}
          </div>

          {showTextInput && (
            <form onSubmit={handleSubmitTypedQuery} className="mt-2.5 flex space-x-2">
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="এখানে প্রশ্ন লিখুন (যেমন: কী ওষুধ দেব?)"
                className="flex-1 px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-leaf-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-leaf-700 hover:bg-leaf-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                পাঠান
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
