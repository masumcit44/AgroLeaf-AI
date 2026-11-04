import React, { useState, useEffect, useRef, useCallback } from 'react';
import { queryAgriculturalCopilot } from './copilotEngine.js';
import { runAgriculturalResearch, parseFarmingPlannerSlots } from './researchPlannerEngine.js';
import { savePlan } from './plannerStore.js';
import { saveReminder } from '../reminders/remindersStore.js';
import { getProfile } from '../profile/profileStore.js';
import {
  createSpeechRecognizer,
  playAnswerAudio,
  stopAnswerAudio,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  needsTranscriptConfirmation,
  isPlanningRequest,
} from './voiceService.js';
import useT from '../../i18n/useT.js';

export default function FarmerCopilotCard({ scan, initialPlan = null }) {
  const { lang } = useT();

  // Active scan disease context
  const activeDisease = scan?.classKey || null;

  // Voice & Planner State
  const [voiceState, setVoiceState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [transcript, setTranscript] = useState('');
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [queryText, setQueryText] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [ttsUnavailable, setTtsUnavailable] = useState(false);

  // Research & Plan State
  const [researchStage, setResearchStage] = useState(null); // { stage, message_bn }
  const [copilotResponse, setCopilotResponse] = useState(null);
  const [activePlan, setActivePlan] = useState(initialPlan);
  const [clarificationState, setClarificationState] = useState(null); // { slotNeeded, titleBn, textBn, chips }
  const [planSavedSuccess, setPlanSavedSuccess] = useState(false);
  const [activeReminders, setActiveReminders] = useState({}); // taskId -> reminderId
  const [expandedStages, setExpandedStages] = useState({ 0: true }); // Open first stage by default

  // Sync initialPlan if provided or updated externally
  useEffect(() => {
    if (initialPlan) {
      setActivePlan(initialPlan);
      // scroll to plan
    }
  }, [initialPlan]);

  // References
  const recognizerRef = useRef(null);
  const stopPlaybackRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      stopAnswerAudio();
    };
  }, []);

  // Voice synthesis helper
  const speakText = useCallback((textToSpeak) => {
    if (!isSpeechSynthesisSupported() || !textToSpeak) return;

    setVoiceState('speaking');
    setIsAudioPlaying(true);
    setTtsUnavailable(false);

    stopPlaybackRef.current = playAnswerAudio(textToSpeak, {
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
      onVoiceUnavailable: () => {
        setIsAudioPlaying(false);
        setVoiceState('idle');
        setTtsUnavailable(true);
      },
    });
  }, []);

  // Main Query Handler (supports both single-turn Q&A and A-to-Z Research Planning)
  const handleProcessQuery = useCallback(
    async (question, extraSlots = {}) => {
      if (!question || !question.trim()) return;

      setVoiceState('processing');
      setErrorMessage(null);
      setPendingConfirmation(null);
      setClarificationState(null);
      setPlanSavedSuccess(false);

      // Fetch saved profile for automatic context hydration
      let profile = {};
      try {
        profile = (await getProfile()) || {};
      } catch {
        profile = {};
      }

      // Check if the query is a cultivation roadmap or agricultural research question
      const slots = parseFarmingPlannerSlots(question, { ...profile, ...extraSlots });

      // The planner only for explicit plan/schedule requests: its slot parser labels almost every
      // question 'crop_roadmap', which sent disease questions to a "choose your variety" prompt.
      if (isPlanningRequest(question) && ['crop_roadmap', 'fertilizer_planning', 'nutrient_education'].includes(slots.category)) {
        abortControllerRef.current = new AbortController();

        try {
          const researchResult = await runAgriculturalResearch(question, {
            profile: { ...profile, ...extraSlots },
            scan: { classKey: activeDisease },
            lang,
            onProgress: (prog) => {
              setResearchStage(prog);
            },
            abortSignal: abortControllerRef.current.signal,
          });

          setResearchStage(null);

          if (researchResult.isClarification) {
            setClarificationState(researchResult);
            setVoiceState('idle');
            if (researchResult.voiceBn) speakText(researchResult.voiceBn);
            return;
          }

          if (researchResult.isPlan) {
            setActivePlan(researchResult.plan);
            setCopilotResponse(null);
            setVoiceState('idle');
            if (researchResult.plan.overview.voice_summary_bn) {
              speakText(researchResult.plan.overview.voice_summary_bn);
            }
            return;
          }

          if (researchResult.isEducational || researchResult.isAbstention) {
            setCopilotResponse(researchResult);
            setActivePlan(null);
            setVoiceState('idle');
            if (researchResult.voiceBn) speakText(researchResult.voiceBn);
            return;
          }
        } catch (err) {
          console.error('[Copilot Research Error]', err);
          setResearchStage(null);
        }
      }

      // Fallback: Immediate Deterministic RAG Query
      const answer = queryAgriculturalCopilot(question, activeDisease);
      setCopilotResponse(answer);
      setActivePlan(answer?.plan || null);
      setVoiceState('idle');

      // Speak the same answer that is shown on screen
      const spoken = answer?.textBn || answer?.voiceBn;
      if (spoken) {
        speakText(spoken);
      }
    },
    [activeDisease, lang, speakText]
  );

  // Voice recognition trigger
  const handleToggleMic = () => {
    if (isAudioPlaying || voiceState === 'speaking') {
      stopAnswerAudio();
      setIsAudioPlaying(false);
      setVoiceState('idle');
      return;
    }

    if (voiceState === 'listening') {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setVoiceState('idle');
      return;
    }

    setErrorMessage(null);
    setTranscript('');
    setPendingConfirmation(null);

    if (!isSpeechRecognitionSupported()) {
      setErrorMessage(
        lang === 'en'
          ? 'Voice recognition is not supported on this browser. Please type your question.'
          : 'আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই। দয়া করে নিচে লিখে প্রশ্ন করুন।'
      );
      return;
    }

    try {
      const recognizer = createSpeechRecognizer({
        lang: 'bn-BD',
        onStart: () => {
          setVoiceState('listening');
        },
        onResult: (text, isFinal) => {
          setTranscript(text);
          setQueryText(text);

          if (isFinal) {
            const clean = text.trim();
            if (needsTranscriptConfirmation(clean)) {
              setPendingConfirmation(clean);
              setVoiceState('idle');
            } else {
              handleProcessQuery(clean);
            }
          }
        },
        onError: (errBn) => {
          setVoiceState('idle');
          setErrorMessage(errBn);
        },
        onEnd: () => {
          if (voiceState === 'listening') {
            setVoiceState('idle');
          }
        },
      });

      recognizerRef.current = recognizer;
      recognizer.start();
    } catch {
      setVoiceState('idle');
      setErrorMessage('ভয়েস রেকর্ডার চালু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  // Replay speech
  const handleReplayVoice = () => {
    // The same button stops playback while audio is playing
    if (isAudioPlaying) {
      if (stopPlaybackRef.current) stopPlaybackRef.current();
      stopAnswerAudio();
      setIsAudioPlaying(false);
      setVoiceState('idle');
      return;
    }
    // Read the answer the farmer sees, not a separate shorter script
    const textToSpeak = activePlan?.overview?.voice_summary_bn || copilotResponse?.textBn || copilotResponse?.voiceBn;
    if (textToSpeak) {
      speakText(textToSpeak);
    }
  };

  // Submit typed query
  const handleSubmitTypedQuery = (e) => {
    e.preventDefault();
    if (queryText.trim()) {
      handleProcessQuery(queryText.trim());
    }
  };

  // Toggle stage accordion
  const toggleStage = (idx) => {
    setExpandedStages((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Activate F24 reminder for a specific task
  const handleActivateReminder = async (task) => {
    if (!task || !task.due_date) return;

    if (activeReminders[task.task_id]) {
      // Toggle off
      const copy = { ...activeReminders };
      delete copy[task.task_id];
      setActiveReminders(copy);
      return;
    }

    try {
      const saved = await saveReminder({
        title: task.title_bn,
        description: task.description_bn || task.title_bn,
        due_date: task.due_date,
        due_time: '09:00',
        source: 'crop_plan',
        disease_id: null,
      });

      setActiveReminders((prev) => ({ ...prev, [task.task_id]: saved.id }));
    } catch (err) {
      console.error('[Reminder Error]', err);
    }
  };

  // Save full plan to IndexedDB
  const handleSaveCurrentPlan = async () => {
    if (!activePlan) return;
    try {
      await savePlan(activePlan);
      setPlanSavedSuccess(true);
    } catch (err) {
      console.error('[Save Plan Error]', err);
    }
  };

  // Quick suggestion chips
  const quickQuestions = [
    'আমি আজ BRRI dhan28 রোপণ করেছি, এখন কী করব?',
    'পটাশ আর ইউরিয়ার কাজ কী?',
    'আমি কোন পর্যায়ে কী সার দেব?',
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
      <div className="bg-gradient-to-r from-leaf-700 via-leaf-800 to-leaf-900 px-4 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
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
          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white/20 text-white backdrop-blur-xs flex items-center space-x-1">
            <span>🔍</span>
            <span>{activeDisease}</span>
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Prominent Microphone Center Target */}
        <div className="flex flex-col items-center justify-center my-3 text-center">
          <div className="relative">
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
              className={`relative z-10 flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-lg transition-all transform active:scale-95 focus:outline-none focus:ring-4 ${
                voiceState === 'listening'
                  ? 'bg-red-600 text-white ring-red-300 animate-pulse'
                  : voiceState === 'speaking'
                  ? 'bg-amber-600 text-white ring-amber-300'
                  : 'bg-leaf-700 hover:bg-leaf-800 text-white ring-leaf-300'
              }`}
            >
              {voiceState === 'listening' ? (
                <svg className="w-10 h-10 sm:w-12 sm:h-12 animate-bounce" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              ) : voiceState === 'speaking' ? (
                <span className="text-3xl sm:text-4xl" role="img" aria-label="speaker">
                  🔊
                </span>
              ) : (
                <svg className="w-10 h-10 sm:w-12 sm:h-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              )}
            </button>
          </div>

          <p className="mt-3.5 text-sm font-bold text-gray-800">
            {voiceState === 'listening'
              ? '🎙️ শুনছি... আপনার প্রশ্ন বলুন'
              : voiceState === 'processing'
              ? '⏳ আপনার প্রশ্ন বুঝে নিচ্ছি...'
              : voiceState === 'speaking'
              ? '🔊 উত্তর বলা হচ্ছে... (থামাতে বাটনে চাপুন)'
              : '👉 মাইকে চাপ দিয়ে বাংলায় কথা বলুন'}
          </p>

          {transcript && (
            <p className="mt-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700 italic max-w-sm truncate border border-gray-200">
              "{transcript}"
            </p>
          )}
        </div>

        {/* Permanently Visible Text Input Bar */}
        <form onSubmit={handleSubmitTypedQuery} className="mt-3 mb-2 flex space-x-2">
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="আপনার ধান চাষ বা সমস্যার কথা লিখুন বা বলুন..."
            className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-leaf-500 shadow-xs"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-leaf-700 hover:bg-leaf-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors flex items-center space-x-1"
          >
            <span>পাঠান</span>
            <span>➔</span>
          </button>
        </form>

        {/* Single Ambiguous Token Confirmation */}
        {pendingConfirmation && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
            <p className="font-semibold">
              ⚠️ আপনি বলেছেন: <span className="font-bold underline">"{pendingConfirmation}"</span>। পুরো প্রশ্নটি কি
              সম্পন্ন হয়েছে?
            </p>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleProcessQuery(pendingConfirmation)}
                className="px-3 py-1.5 rounded-lg bg-leaf-700 text-white text-xs font-bold hover:bg-leaf-800"
              >
                হ্যাঁ, উত্তর দিন
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingConfirmation(null);
                  setTranscript('');
                  handleToggleMic();
                }}
                className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-800 text-xs font-bold hover:bg-gray-300"
              >
                🔄 আবার বলুন
              </button>
            </div>
          </div>
        )}

        {/* Progressive Clarification Drawer */}
        {clarificationState && (
          <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 space-y-2">
            <p className="font-bold text-sm text-emerald-900">🌾 {clarificationState.titleBn}</p>
            <p className="text-xs text-gray-700 font-medium">{clarificationState.textBn}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {clarificationState.chips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    handleProcessQuery(`${queryText || 'ধান চাষ'} ${chip}`, {
                      variety_id: chip.toLowerCase().replace(/\s+/g, '_'),
                    });
                  }}
                  className="px-3 py-1.5 rounded-full text-xs bg-white text-leaf-800 font-bold border border-emerald-400 hover:bg-emerald-100 shadow-2xs"
                >
                  👉 {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Asynchronous Research Progress Bar */}
        {researchStage && (
          <div className="mt-3 p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center space-x-1.5">
                <span className="animate-spin inline-block">⏳</span>
                <span>{researchStage.message_bn}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (abortControllerRef.current) abortControllerRef.current.abort();
                  setResearchStage(null);
                  setVoiceState('idle');
                }}
                className="text-xs text-red-600 hover:underline font-bold"
              >
                বাতিল করুন
              </button>
            </div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TTS Unavailable Notification */}
        {ttsUnavailable && (
          <div className="mt-2.5 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-xs flex items-center space-x-2">
            <span>ℹ️</span>
            <span>
              এই ফোন/ব্রাউজারে বাংলা কণ্ঠ নেই, তাই ইংরেজি উচ্চারণে না পড়ে শোনানো বন্ধ রাখা হয়েছে। উত্তরটি নিচে পড়ে নিন।
              অ্যান্ড্রয়েডে: সেটিংস → ভাষা ও ইনপুট → টেক্সট-টু-স্পিচ → Google → বাংলা ভয়েস ডাউনলোড করুন।
            </span>
          </div>
        )}

        {/* Standard Single-turn Q&A Response Card */}
        {copilotResponse && !activePlan && (
          <div className="mt-4 p-4 bg-leaf-50/70 border border-leaf-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-leaf-900">
                {copilotResponse.titleBn || 'এগ্রোলিফ পরামর্শ'}
              </span>
              {isSpeechSynthesisSupported() && (
                <button
                  type="button"
                  onClick={handleReplayVoice}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-leaf-700 hover:bg-leaf-800 text-white flex items-center space-x-1 shadow-sm transition-colors"
                >
                  <span>{isAudioPlaying ? '⏹️ থামান' : '🔊 শুনুন'}</span>
                </button>
              )}
            </div>

            <p className="text-sm leading-relaxed text-gray-800 font-medium whitespace-pre-line">
              {copilotResponse.textBn}
            </p>

            {copilotResponse.safetyNote && (
              <div className="mt-2.5 p-2 bg-amber-100/90 rounded-lg border border-amber-300 text-xs text-amber-900 font-semibold flex items-center space-x-1.5">
                <span>🛡️</span>
                <span>{copilotResponse.safetyNote}</span>
              </div>
            )}

            {copilotResponse.helplinePrompt && (
              <div className="mt-3 pt-2.5 border-t border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-xs text-amber-950 font-bold">
                  কৃষি কল সেন্টার ১৬১২৩-এ যোগাযোগ করতে পারেন (কলের বর্তমান চার্জ আগে যাচাই করুন):
                </span>
                <a
                  href="tel:16123"
                  className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white hover:bg-green-700 shadow-sm transition-colors w-max"
                >
                  📞 ১৬১২৩ কল করুন
                </a>
              </div>
            )}
          </div>
        )}

        {/* Full Rich Interactive A-to-Z Crop Roadmap & Planner Presentation */}
        {activePlan && (
          <div className="mt-4 space-y-4">
            {/* Plan Header Card */}
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-200 text-emerald-900 uppercase">
                    ব্যক্তিগত ফসল পরিকল্পনা
                  </span>
                  <h4 className="text-base font-bold text-emerald-950 mt-1 leading-snug">
                    {activePlan.title_bn}
                  </h4>
                </div>
                {isSpeechSynthesisSupported() && (
                  <button
                    type="button"
                    onClick={handleReplayVoice}
                    className="shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg bg-leaf-700 hover:bg-leaf-800 text-white flex items-center space-x-1"
                  >
                    <span>{isAudioPlaying ? '⏹️ থামান' : '🔊 শুনুন'}</span>
                  </button>
                )}
              </div>

              {/* Field Profile Overview Pills */}
              <div className="flex flex-wrap gap-2 text-xs text-emerald-900 pt-1">
                <span className="px-2 py-1 bg-white rounded-lg border border-emerald-200 font-medium">
                  🌾 জাত: <strong>{activePlan.field_profile.variety_name}</strong>
                </span>
                <span className="px-2 py-1 bg-white rounded-lg border border-emerald-200 font-medium">
                  ⏳ জীবনকাল: <strong>{activePlan.field_profile.duration_days} দিন</strong>
                </span>
                <span className="px-2 py-1 bg-white rounded-lg border border-emerald-200 font-medium">
                  📐 জমির পরিমাণ: <strong>{activePlan.fertilizer_plan.area_display}</strong>
                </span>
                <span className="px-2 py-1 bg-white rounded-lg border border-emerald-200 font-medium">
                  🌾 সম্ভাব্য ফসল কাটা: <strong>{activePlan.field_profile.estimated_harvest_date}</strong>
                </span>
              </div>

              {/* Immediate Action Alert */}
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-950 font-semibold flex items-start space-x-2">
                <span className="text-base leading-none">👉</span>
                <span>{activePlan.overview.immediate_action_bn}</span>
              </div>
            </div>

            {/* Save & Management Bar */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <button
                type="button"
                onClick={handleSaveCurrentPlan}
                disabled={planSavedSuccess}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                  planSavedSuccess
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-leaf-700 hover:bg-leaf-800 text-white'
                }`}
              >
                {planSavedSuccess ? '✓ পরিকল্পনাটি সংরক্ষিত আছে' : '💾 পরিকল্পনাটি সংরক্ষণ করুন'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePlan(null);
                  setCopilotResponse(null);
                  setQueryText('');
                }}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                🔄 নতুন গবেষণা
              </button>
            </div>

            {/* Chronological Roadmap Stages */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                📅 পর্যায়ভিত্তিক চাষাবাদ সময়সূচি:
              </h5>

              {activePlan.roadmap.map((stage, idx) => {
                const isOpen = Boolean(expandedStages[idx]);
                return (
                  <div
                    key={stage.stage_id}
                    className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleStage(idx)}
                      className="w-full px-3.5 py-3 text-left bg-gray-50/80 hover:bg-gray-100 flex items-center justify-between text-xs sm:text-sm font-bold text-gray-900"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-leaf-100 text-leaf-800">
                          {idx + 1}
                        </span>
                        <span>{stage.stage_name_bn}</span>
                        <span className="text-2xs font-normal text-gray-500">
                          ({stage.start_date} হতে {stage.end_date})
                        </span>
                      </div>
                      <span>{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="p-3.5 space-y-3 text-xs bg-white">
                        <p className="text-2xs text-gray-500 font-semibold italic">
                          মূল নজর: {stage.key_focus_bn}
                        </p>

                        <div className="space-y-2">
                          {stage.tasks.map((task) => {
                            const isRemindActive = Boolean(activeReminders[task.task_id]);
                            return (
                              <div
                                key={task.task_id}
                                className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                              >
                                <div>
                                  <p className="font-bold text-gray-900">{task.title_bn}</p>
                                  <p className="text-2xs text-gray-600 mt-0.5">{task.description_bn}</p>
                                  <span className="inline-block mt-1 text-2xs font-semibold text-leaf-700">
                                    সম্ভাব্য তারিখ: {task.due_date}
                                  </span>
                                </div>

                                {task.can_remind && (
                                  <button
                                    type="button"
                                    onClick={() => handleActivateReminder(task)}
                                    className={`shrink-0 px-2.5 py-1 rounded-md text-2xs font-bold transition-colors ${
                                      isRemindActive
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-leaf-100 hover:bg-leaf-200 text-leaf-900 border border-leaf-300'
                                    }`}
                                  >
                                    {isRemindActive ? '✓ স্মরণবার্তা সক্রিয়' : '⏰ স্মরণবার্তা চালু করুন'}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Fertilizer Schedule Matrix */}
            <div className="p-3.5 bg-leaf-50/60 border border-leaf-200 rounded-xl space-y-2 text-xs">
              <h5 className="font-bold text-leaf-950 flex items-center space-x-1.5">
                <span>🌱</span>
                <span>সারের সঠিক মাত্রা ও প্রয়োগের সময় (বার্ক FRG-2024 নির্দেশিকা):</span>
              </h5>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-2xs">
                  <thead>
                    <tr className="border-b border-leaf-200 text-leaf-900 font-bold">
                      <th className="py-1">সারের নাম</th>
                      <th className="py-1">পরিমাণ (কেজি)</th>
                      <th className="py-1">প্রয়োগের সময়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-leaf-100 text-gray-800">
                    {activePlan.fertilizer_plan.basal_dose.map((item) => (
                      <tr key={item.fertilizer_name_bn}>
                        <td className="py-1 font-medium">{item.fertilizer_name_bn}</td>
                        <td className="py-1 font-bold">{item.amount_kg} কেজি</td>
                        <td className="py-1">{item.application_time_bn}</td>
                      </tr>
                    ))}
                    {activePlan.fertilizer_plan.split_doses.map((split) => (
                      <tr key={split.split_number} className="bg-leaf-100/30">
                        <td className="py-1 font-medium">{split.fertilizer_name_bn}</td>
                        <td className="py-1 font-bold">{split.amount_kg} কেজি</td>
                        <td className="py-1">{split.conditions_bn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-1.5 space-y-1 text-2xs text-amber-900 font-medium">
                {activePlan.risks_and_cautions.prohibited_actions_bn.map((rule) => (
                  <p key={rule}>• {rule}</p>
                ))}
              </div>
            </div>

            {/* Authoritative Evidence Citations */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-2xs text-gray-600 space-y-1">
              <p className="font-bold text-gray-800">🏛️ যাচাইকৃত সরকারি ও আন্তর্জাতিক তথ্যসূত্র:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {activePlan.research_metadata.sources.map((src) => (
                  <li key={src.name_bn || src.name_en}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-leaf-800 font-semibold hover:underline"
                    >
                      {src.name_bn || src.name_en}
                    </a>
                    {src.handbook && ` (${src.handbook})`}
                  </li>
                ))}
              </ul>
            </div>
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

        {/* Typed Input Fallback Option Label for Accessibility */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>⌨️ অথবা বাংলায়/Banglish-এ লিখুন</span>
            {copilotResponse && (
              <button
                type="button"
                onClick={() => {
                  setCopilotResponse(null);
                  setActivePlan(null);
                  setTranscript('');
                  setQueryText('');
                  setPendingConfirmation(null);
                  stopAnswerAudio();
                  setIsAudioPlaying(false);
                }}
                className="hover:text-gray-700"
              >
                🔄 নতুন প্রশ্ন
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
