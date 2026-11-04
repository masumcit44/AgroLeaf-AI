// F1 Advanced: Intelligent Live Guided Camera Scanner
// Full-Screen Immersive Viewfinder with Exact Preview-to-Capture Framing
// Non-blocking real-time mobile viewfinder with live framing, blur, and lighting advisory.
// Farmer is always free to capture at any moment once the camera stream is active.

import React, { useEffect, useRef, useState, useCallback } from 'react';
import useT from '../../i18n/useT.js';
import {
  extractPlantMask,
  computeLeafMoments,
  classifyLeafFraming,
} from './leafGeometry.js';
import { LiveGuidanceEngine } from './guidanceEngine.js';
import { meanLuminance, laplacianVariance } from '../../lib/imageQuality.js';
import { captureVisibleFrameToCanvas } from './cameraFraming.js';

export function LiveCameraScanner({ onCapture, onClose }) {
  const { t } = useT();

  const videoRef = useRef(null);
  const viewfinderRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const engineRef = useRef(new LiveGuidanceEngine());

  // Discrete state machines
  const [cameraState, setCameraState] = useState('INITIALIZING'); // 'INITIALIZING' | 'ACTIVE' | 'ERROR'
  const [captureState, setCaptureState] = useState('AVAILABLE'); // 'AVAILABLE' | 'CAPTURING'
  const [guidanceHidden, setGuidanceHidden] = useState(false);

  const [guidance, setGuidance] = useState({
    state: 'ANALYZING',
    isReady: false,
    consecutiveCount: 0,
  });
  const [cameraError, setCameraError] = useState(null);

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
    setCameraState('STOPPED');
  }, []);

  // Initialize camera stream with iOS-friendly constraints
  useEffect(() => {
    let isMounted = true;
    setCameraError(null);
    setCameraState('INITIALIZING');

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('CAMERA_UNSUPPORTED');
        }

        const isPortrait = typeof window !== 'undefined' && window.innerHeight > window.innerWidth;
        // Safe, non-overconstrained constraints for iOS Safari & Android
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: isPortrait ? 1080 : 1920 },
            height: { ideal: isPortrait ? 1920 : 1080 },
          },
        });

        if (!isMounted) {
          stream.getTracks().forEach((trk) => trk.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          // Set iPhone inline playback properties
          video.setAttribute('playsinline', '');
          video.setAttribute('webkit-playsinline', '');
          video.playsInline = true;
          video.muted = true;
          video.autoplay = true;

          video.onloadedmetadata = () => {
            if (isMounted) {
              setCameraState('ACTIVE');
              video.play().catch(() => {});
            }
          };
        }
      } catch (err) {
        if (isMounted) {
          setCameraState('ERROR');
          setCameraError(err.name === 'NotAllowedError' ? 'PERMISSION_DENIED' : 'CAMERA_UNAVAILABLE');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [stopCamera]);

  // Frame analysis loop (downsampled offscreen canvas at 6-8 FPS for guidance suggestions)
  useEffect(() => {
    if (cameraState !== 'ACTIVE' || cameraError) return;

    let lastSampleTime = 0;
    const SAMPLE_INTERVAL_MS = 140; // ~7 FPS
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

          // 1. Plant leaf pixel extraction & centroid moments
          const mask = extractPlantMask(imgData);
          const moments = computeLeafMoments(mask);

          // 2. Optical quality evaluation
          const lum = meanLuminance(sampleCanvas);
          const blurVar = laplacianVariance(sampleCanvas);

          const isDark = lum < 35;
          const isBright = lum > 225;
          const isBlurry = blurVar < 14;

          // 3. Raw heuristic framing classification
          const rawCandidate = classifyLeafFraming(moments, {
            isDark,
            isBright,
            isBlurry,
            minLeafAreaFraction: 0.08,
            maxLeafAreaFraction: 0.72,
          });

          // 4. Update guidance state machine
          const decision = engineRef.current.update(rawCandidate);
          setGuidance(decision);
        } catch {
          // Non-blocking analysis failure
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
  }, [cameraState, cameraError]);

  // Exact preview-to-capture matching: captures the visible crop of the camera viewfinder
  const handleCapture = useCallback(() => {
    if (cameraState !== 'ACTIVE' || captureState === 'CAPTURING') return;

    const video = videoRef.current;
    if (!video) return;

    setCaptureState('CAPTURING');

    // Use authoritative framing utility to crop exactly what the user sees in the viewfinder
    const container = viewfinderRef.current || video;
    const captureCanvas = captureVisibleFrameToCanvas(video, container, { fit: 'cover' });

    if (!captureCanvas) {
      setCaptureState('AVAILABLE');
      return;
    }

    captureCanvas.toBlob(
      (blob) => {
        setCaptureState('AVAILABLE');
        if (!blob) return;
        const file = new File([blob], `rice_leaf_${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        stopCamera();
        onCapture(file);
      },
      'image/jpeg',
      0.95
    );
  }, [cameraState, captureState, onCapture, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Directional icon helper
  const getDirectionIcon = (state) => {
    switch (state) {
      case 'MOVE_LEFT':
        return '👈';
      case 'MOVE_RIGHT':
        return '👉';
      case 'MOVE_UP':
        return '👆';
      case 'MOVE_DOWN':
        return '👇';
      case 'MOVE_CLOSER':
        return '🔍+';
      case 'MOVE_AWAY':
        return '🔍-';
      case 'DARK':
        return '💡';
      case 'BRIGHT':
        return '☀️';
      case 'BLURRY':
        return '📸';
      case 'READY':
        return '✅';
      case 'UNCERTAIN':
        return '🌾';
      default:
        return '⏳';
    }
  };

  // Advisory instruction text lookup
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
      case 'UNCERTAIN':
        return t('liveScanner.uncertain');
      default:
        return t('liveScanner.initializing');
    }
  };

  const isCameraLive = cameraState === 'ACTIVE';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('liveScanner.title')}
      data-testid="live-camera-scanner"
      className="fixed inset-0 z-50 bg-black overflow-hidden select-none"
      style={{
        height: '100dvh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* 1. Full-Screen Viewfinder Layer (Bleeds edge-to-edge on iPhone 14) */}
      <div
        ref={viewfinderRef}
        data-testid="scanner-viewfinder"
        className="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center"
      >
        {cameraError ? (
          <div className="relative z-30 p-6 text-center text-white space-y-4 max-w-sm">
            <span className="text-4xl" aria-hidden="true">
              📷
            </span>
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
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            data-testid="scanner-video"
            className="w-full h-full object-cover"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        )}
      </div>

      {/* 2. Top Header Bar (Floats translucently over viewfinder with Safe Area insets) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top,0.75rem))] pb-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">
            🌾
          </span>
          <span className="text-sm font-bold tracking-tight">
            {t('liveScanner.title')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Optional Guidance Visibility Toggle */}
          {isCameraLive && (
            <button
              type="button"
              onClick={() => setGuidanceHidden(!guidanceHidden)}
              data-testid="toggle-guidance-btn"
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition cursor-pointer"
            >
              {guidanceHidden ? t('liveScanner.showGuidance') : t('liveScanner.hideGuidance')}
            </button>
          )}

          {/* Close button */}
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] min-w-[44px] p-2 text-white/90 hover:text-white rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-all flex items-center justify-center cursor-pointer"
            aria-label={t('liveScanner.closeBtn')}
          >
            ✕
          </button>
        </div>
      </div>

      {/* 3. Central Advisory Framing Reticle (Hidden if user toggles guidance off) */}
      {!cameraError && !guidanceHidden && (
        <div
          data-testid="scanner-reticle"
          className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-8 transition-opacity duration-300"
        >
          <div
            className={`w-64 h-80 rounded-3xl border-3 transition-colors duration-300 flex flex-col justify-between p-3 ${
              guidance.isReady
                ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(52,211,153,0.35)]'
                : 'border-white/50 border-dashed bg-black/10'
            }`}
          >
            <div className="flex justify-between w-full opacity-70">
              <div className="w-4 h-4 border-t-2 border-l-2 border-white" />
              <div className="w-4 h-4 border-t-2 border-r-2 border-white" />
            </div>
            <div className="flex justify-between w-full opacity-70">
              <div className="w-4 h-4 border-b-2 border-l-2 border-white" />
              <div className="w-4 h-4 border-b-2 border-r-2 border-white" />
            </div>
          </div>
        </div>
      )}

      {/* 4. Floating Advisory Guidance Pill */}
      {!cameraError && !guidanceHidden && (
        <div className="absolute top-[max(4.5rem,calc(env(safe-area-inset-top,0rem)+3.8rem))] left-4 right-4 z-20 pointer-events-none flex justify-center">
          <div
            data-testid="scanner-guidance-pill"
            className={`max-w-xs px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-lg border text-center flex items-center gap-2.5 transition-all duration-300 ${
              guidance.isReady
                ? 'bg-emerald-600/95 border-emerald-400 text-white font-bold'
                : 'bg-black/75 border-white/25 text-white font-medium'
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
      )}

      {/* 5. Bottom Controls — Floating over viewfinder with Safe Area insets */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pt-6 pb-[max(1.75rem,env(safe-area-inset-bottom,1.75rem))] bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-3">
        {/* Shutter Capture Button — Always Available once camera is live */}
        <div className="flex items-center justify-center gap-6 w-full">
          <button
            type="button"
            disabled={!isCameraLive || captureState === 'CAPTURING'}
            onClick={handleCapture}
            data-testid="scanner-capture-btn"
            className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              !isCameraLive
                ? 'border-white/30 bg-white/5 opacity-40 cursor-not-allowed'
                : guidance.isReady
                ? 'border-emerald-300 bg-emerald-500 hover:bg-emerald-400 scale-105 shadow-[0_0_25px_rgba(52,211,153,0.6)]'
                : 'border-white/90 bg-white/25 hover:bg-white/35 active:scale-95 shadow-md'
            }`}
            aria-label={t('liveScanner.captureBtn')}
          >
            <div
              className={`w-14 h-14 rounded-full transition-all ${
                guidance.isReady ? 'bg-white' : 'bg-white/85'
              }`}
            />
          </button>
        </div>

        {/* Advisory subtitle: Capture anytime */}
        <p className="text-[11px] text-white/80 text-center font-medium drop-shadow-sm">
          {t('liveScanner.captureAnytime')}
        </p>
      </div>
    </div>
  );
}

export default LiveCameraScanner;
