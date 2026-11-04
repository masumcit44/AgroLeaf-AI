// F1 Advanced: Intelligent Live Guided Camera Scanner
// Real-time mobile viewfinder with live leaf framing, blur, and lighting guidance.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import useT from '../../i18n/useT.js';
import {
  extractPlantMask,
  computeLeafMoments,
  classifyLeafFraming,
} from './leafGeometry.js';
import { LiveGuidanceEngine } from './guidanceEngine.js';
import { meanLuminance, laplacianVariance } from '../../lib/imageQuality.js';

export function LiveCameraScanner({ onCapture, onClose }) {
  const { lang, t } = useT();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const engineRef = useRef(new LiveGuidanceEngine());

  const [guidance, setGuidance] = useState({
    state: 'INITIALIZING',
    isReady: false,
    consecutiveCount: 0,
  });
  const [cameraError, setCameraError] = useState(null);
  const [allowManualCapture, setAllowManualCapture] = useState(false);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore cleanup error
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Initialize camera stream
  useEffect(() => {
    let isMounted = true;
    setCameraError(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('CAMERA_UNSUPPORTED');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err) {
        if (isMounted) {
          setCameraError(err.name === 'NotAllowedError' ? 'PERMISSION_DENIED' : 'CAMERA_UNAVAILABLE');
        }
      }
    };

    startCamera();

    // After 6 seconds of scanning, permit manual capture override so the farmer is never locked out
    const overrideTimer = setTimeout(() => {
      if (isMounted) setAllowManualCapture(true);
    }, 6000);

    return () => {
      isMounted = false;
      clearTimeout(overrideTimer);
      stopCamera();
    };
  }, [stopCamera]);

  // Frame analysis loop (downsampled offscreen canvas at 6-8 FPS)
  useEffect(() => {
    if (cameraError) return;

    let lastSampleTime = 0;
    const SAMPLE_INTERVAL_MS = 125; // ~8 FPS
    const downW = 160;
    const downH = 160;

    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = downW;
    sampleCanvas.height = downH;
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });

    const processFrame = (timestamp) => {
      const video = videoRef.current;
      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        sampleCtx &&
        timestamp - lastSampleTime >= SAMPLE_INTERVAL_MS
      ) {
        lastSampleTime = timestamp;

        try {
          sampleCtx.drawImage(video, 0, 0, downW, downH);
          const imgData = sampleCtx.getImageData(0, 0, downW, downH);
          const rgba = imgData.data;

          // 1. Quality metrics: Luminance & Blur
          const numPixels = downW * downH;
          const gray = new Uint8ClampedArray(numPixels);
          for (let i = 0; i < numPixels; i++) {
            const off = i * 4;
            gray[i] = Math.round(0.299 * rgba[off] + 0.587 * rgba[off + 1] + 0.114 * rgba[off + 2]);
          }

          const luma = meanLuminance(gray);
          const blurVar = laplacianVariance(gray, downW, downH);

          const quality = {
            isDark: luma < 40,
            isBright: luma > 230,
            isBlurry: blurVar < 45,
          };

          // 2. Leaf spatial localization
          const plantMask = extractPlantMask(rgba, downW, downH);
          const moments = computeLeafMoments(plantMask, downW, downH);

          // 3. Classify framing & smooth temporally
          const rawCandidate = classifyLeafFraming(moments, quality);
          const smoothed = engineRef.current.update(rawCandidate);

          setGuidance(smoothed);
        } catch {
          // Ignore transient frame read error
        }
      }

      animFrameIdRef.current = requestAnimationFrame(processFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraError]);

  // Capture full resolution photo from the live video feed
  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = vWidth;
    captureCanvas.height = vHeight;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, vWidth, vHeight);

    captureCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `rice_leaf_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        stopCamera();
        onCapture(file);
      },
      'image/jpeg',
      0.92
    );
  }, [onCapture, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Directional icon helper
  const getDirectionIcon = (state) => {
    switch (state) {
      case 'MOVE_LEFT':
        return '⬅️';
      case 'MOVE_RIGHT':
        return '➡️';
      case 'MOVE_UP':
        return '⬆️';
      case 'MOVE_DOWN':
        return '⬇️';
      case 'MOVE_CLOSER':
        return '🔍+';
      case 'MOVE_AWAY':
        return '🔍-';
      case 'DARK':
        return '💡';
      case 'BRIGHT':
        return '🕶️';
      case 'BLURRY':
        return '✋';
      case 'READY':
        return '✨';
      default:
        return '🌾';
    }
  };

  // Instruction text lookup
  const getInstructionText = (state) => {
    switch (state) {
      case 'NO_LEAF':
        return t('liveScanner.noLeaf');
      case 'MOVE_LEFT':
        return t('liveScanner.moveLeft');
      case 'MOVE_RIGHT':
        return t('liveScanner.moveRight');
      case 'MOVE_UP':
        return t('liveScanner.moveUp');
      case 'MOVE_DOWN':
        return t('liveScanner.moveDown');
      case 'MOVE_CLOSER':
        return t('liveScanner.moveCloser');
      case 'MOVE_AWAY':
        return t('liveScanner.moveAway');
      case 'DARK':
        return t('liveScanner.dark');
      case 'BRIGHT':
        return t('liveScanner.bright');
      case 'BLURRY':
        return t('liveScanner.blurry');
      case 'READY':
        return t('liveScanner.ready');
      default:
        return t('liveScanner.initializing');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('liveScanner.title')}
      data-testid="live-camera-scanner"
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden"
    >
      {/* 1. Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">📷</span>
          <span className="text-sm font-bold tracking-tight">
            {t('liveScanner.title')}
          </span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="min-h-[44px] min-w-[44px] p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center cursor-pointer"
          aria-label={t('liveScanner.closeBtn')}
        >
          ✕
        </button>
      </div>

      {/* 2. Main Viewport & Reticle Overlay */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-gray-950 overflow-hidden">
        {cameraError ? (
          <div className="p-6 text-center text-white space-y-4 max-w-sm">
            <span className="text-4xl" aria-hidden="true">⚠️</span>
            <p className="text-sm font-medium text-amber-200">
              {t('liveScanner.permissionDenied')}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] px-5 py-2.5 bg-leaf-600 hover:bg-leaf-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {t('liveScanner.fallbackFileBtn')}
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              data-testid="scanner-video"
              className="w-full h-full object-cover"
            />

            {/* Central Framing Alignment Reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div
                className={`w-64 h-80 rounded-3xl border-3 transition-colors duration-300 flex flex-col justify-between p-3 ${
                  guidance.isReady
                    ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(52,211,153,0.4)]'
                    : 'border-white/60 border-dashed bg-black/10'
                }`}
              >
                <div className="flex justify-between w-full opacity-60">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-white" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-white" />
                </div>
                <div className="flex justify-between w-full opacity-60">
                  <div className="w-4 h-4 border-b-2 border-l-2 border-white" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-white" />
                </div>
              </div>
            </div>

            {/* Prominent Floating Guidance Instruction Banner */}
            <div className="absolute top-16 left-4 right-4 pointer-events-none flex justify-center">
              <div
                data-testid="scanner-guidance-pill"
                className={`max-w-xs px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-lg border text-center flex items-center gap-2.5 transition-all duration-300 ${
                  guidance.isReady
                    ? 'bg-emerald-600/90 border-emerald-400 text-white font-bold'
                    : 'bg-black/75 border-white/20 text-white font-medium'
                }`}
              >
                <span className="text-xl shrink-0" aria-hidden="true">
                  {getDirectionIcon(guidance.state)}
                </span>
                <span className="text-xs sm:text-sm leading-snug">
                  {getInstructionText(guidance.state)}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Bottom Controls */}
      <div className="relative z-10 px-6 py-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-3">
        {/* Shutter Capture Button */}
        <div className="flex items-center justify-center gap-6 w-full">
          <button
            type="button"
            disabled={!guidance.isReady && !allowManualCapture}
            onClick={handleCapture}
            data-testid="scanner-capture-btn"
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              guidance.isReady
                ? 'border-white bg-emerald-500 hover:bg-emerald-400 scale-105 shadow-[0_0_20px_rgba(52,211,153,0.6)]'
                : allowManualCapture
                ? 'border-white/80 bg-white/20 hover:bg-white/30'
                : 'border-white/30 bg-white/5 opacity-40 cursor-not-allowed'
            }`}
            aria-label={t('liveScanner.captureBtn')}
          >
            <div
              className={`w-14 h-14 rounded-full transition-all ${
                guidance.isReady ? 'bg-white' : allowManualCapture ? 'bg-white/60' : 'bg-white/20'
              }`}
            />
          </button>
        </div>

        {/* Manual capture warning prompt if overridden */}
        {!guidance.isReady && allowManualCapture && (
          <p className="text-[11px] text-amber-300/80 text-center font-medium">
            {t('liveScanner.overrideWarn')}
          </p>
        )}
      </div>
    </div>
  );
}

export default LiveCameraScanner;
