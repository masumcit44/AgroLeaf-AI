import React, { useState, useEffect, useRef } from 'react';
import useT from '../i18n/useT.js';
import { getAudioManifest } from '../lib/audioManifest.js';
import { setActiveAudio, stopActiveAudio } from '../lib/audioManager.js';

export default function AudioExplain({
  classKey,
  voiceScriptBn = '',
  className = '',
}) {
  const { t } = useT();
  const [audioUrl, setAudioUrl] = useState(null);
  const [isHumanVoice, setIsHumanVoice] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showScript, setShowScript] = useState(false);

  const audioRef = useRef(null);
  const warnedRef = useRef(false);

  // Discover audio file from manifest or fallback
  useEffect(() => {
    let isMounted = true;

    getAudioManifest()
      .then((manifest) => {
        if (!isMounted) return;
        const entry = manifest[classKey];
        if (entry && entry.file) {
          setAudioUrl(entry.file);
          setIsHumanVoice(entry.voice === 'human');
        } else {
          // If no manifest entry, check for default convention /audio/<key>-v1.mp3
          setAudioUrl(`/audio/${classKey}-v1.mp3`);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAudioUrl(`/audio/${classKey}-v1.mp3`);
      });

    return () => {
      isMounted = false;
      stopActiveAudio();
    };
  }, [classKey]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleTogglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      stopActiveAudio();
      setActiveAudio(audioRef.current);
      audioRef.current.play().catch((err) => {
        if (!warnedRef.current) {
          console.warn(`[AudioExplain] Audio playback unavailable for ${classKey}:`, err.message);
          warnedRef.current = true;
        }
        setHasError(true);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    stopActiveAudio();
    activeAudioElement = audioRef.current;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (el && el.duration) {
      const pct = (el.currentTime / el.duration) * 100;
      setProgress(pct);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleError = () => {
    if (!warnedRef.current) {
      console.warn(`[AudioExplain] Audio file missing or failed to load for ${classKey}. Hiding player silently.`);
      warnedRef.current = true;
    }
    setHasError(true);
  };

  // Graceful degradation: If audio fails to load or is missing, render nothing
  if (hasError || !audioUrl) {
    return null;
  }

  return (
    <div className={`w-full p-3.5 bg-leaf-50/60 border border-leaf-700/20 rounded-2xl mb-4 text-center ${className}`}>
      {/* Hidden Audio Tag (preload=none per spec) */}
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="none"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
      />

      {/* Main Controls Row */}
      <div className="flex items-center justify-center gap-4 mb-2">
        {/* Big Circular Play/Pause Button (64px) */}
        <button
          type="button"
          onClick={handleTogglePlay}
          className="w-16 h-16 rounded-full bg-leaf-700 hover:bg-leaf-800 active:scale-95 text-white font-bold text-sm shadow-md flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-4 focus:ring-leaf-400"
          aria-label={isPlaying ? t('audioAriaPause') : t('audioAriaPlay')}
        >
          <span>{isPlaying ? t('audioPause') : t('audioListen')}</span>
        </button>

        {/* Replay Button */}
        {progress > 5 && (
          <button
            type="button"
            onClick={handleReplay}
            className="p-2 text-xs font-semibold text-leaf-700 hover:text-leaf-800 cursor-pointer"
            aria-label={t('audioReplay')}
          >
            {t('audioReplay')}
          </button>
        )}
      </div>

      {/* Thin Progress Bar */}
      <div className="w-full max-w-[200px] mx-auto bg-gray-200 h-1.5 rounded-full overflow-hidden mb-2">
        <div
          className="bg-leaf-700 h-1.5 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Voice Attribution Note */}
      <div className="text-[11px] text-gray-500 font-medium mb-1">
        {isHumanVoice ? t('audioHumanVoice') : t('audioAiVoice')}
      </div>

      {/* Transcript Text Toggle */}
      {voiceScriptBn && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowScript((prev) => !prev)}
            className="text-[11px] font-semibold text-leaf-700 hover:underline cursor-pointer"
          >
            {showScript ? t('audioHideText') : t('audioShowText')}
          </button>
          {showScript && (
            <p className="mt-2 p-2.5 bg-white rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed text-left font-serif">
              "{voiceScriptBn}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
