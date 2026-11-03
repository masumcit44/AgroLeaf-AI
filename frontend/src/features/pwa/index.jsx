// F9 Offline PWA. Owner: OpenCode.
// Every slot component receives { scan, context }:
//   scan = { canvas, probs, decision, calibration, classKey, isConfident } on result slots, null elsewhere.
// Rendering is already gated by features/flags.js and wrapped in an error boundary (features/slots.jsx).
// The service worker is registered here only, and only while the 'pwa' flag is on.
import React, { useEffect, useRef, useState } from 'react';
import useT from '../../i18n/useT.js';
import { isFeatureOn } from '../flags.js';
import { loadModel } from '../../ml/loadModel.js';
import { MODEL_PARTS, CALIBRATION_URL } from '../../ml/config.js';
import { getAudioManifest } from '../../lib/audioManifest.js';
import { AUDIO_CACHE_NAME, MODEL_CACHE_NAME, ORT_ASSETS } from './cacheConfig.js';

const BACK_ONLINE_MS = 4000;
const OFFLINE_READY_MS = 6000;

function isStandalone() {
  if (typeof window === 'undefined') return false;
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
}

/**
 * Make sure the large model/wasm responses are in the runtime cache even when
 * the first page load was not yet controlled by the service worker.
 */
async function warmModelCache() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  let cache;
  try {
    cache = await caches.open(MODEL_CACHE_NAME);
  } catch {
    return;
  }

  const urls = [...MODEL_PARTS, ...ORT_ASSETS];
  try {
    const res = await fetch(CALIBRATION_URL);
    if (res.ok) {
      const calibration = await res.json();
      if (calibration?.nonrice_gate?.model) urls.push(calibration.nonrice_gate.model);
    }
  } catch {
    // Offline or a broken calibration file: the app itself will report it.
  }

  const controlled = Boolean(navigator.serviceWorker?.controller);
  for (const url of urls) {
    if (await cache.match(url)) continue;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1000));
        const res = await fetch(url);
        if (!res.ok) continue;
        if (controlled) {
          // The worker's CacheFirst route writes this response to the cache.
          // Draining the body lets that write finish; a second cache.put() in
          // the page aborts large gzip responses with a network error. The
          // first fetch right after activation can miss the worker cache, so
          // check and fetch once more before giving up.
          await res.arrayBuffer();
          if (await cache.match(url)) break;
        } else {
          await cache.put(url, res.clone());
          break;
        }
      } catch {
        // Offline or a transient failure: the app itself will report it.
      }
    }
  }
}

/**
 * Chrome answers fetch('/audio/x.mp3') with a synthetic 204, so cache.add() and
 * Workbox precache cannot store voice clips. A Range request is served normally;
 * turn that full response into a plain 200 so RangeRequestsPlugin can slice it.
 */
async function warmAudioCache() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  let cache;
  try {
    cache = await caches.open(AUDIO_CACHE_NAME);
  } catch {
    return;
  }

  let manifest;
  try {
    manifest = await getAudioManifest();
  } catch {
    return;
  }

  const urls = [
    ...new Set(
      Object.values(manifest || {})
        .map((entry) => entry?.file)
        .filter((url) => typeof url === 'string' && /\.mp3(?:$|\?)/.test(url)),
    ),
  ];

  for (const url of urls) {
    try {
      if (await cache.match(url)) continue;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { Range: 'bytes=0-' },
      });
      if (!res.ok && res.status !== 206) continue;

      const body = await res.arrayBuffer();
      const contentRange = res.headers.get('content-range');
      const total = contentRange ? Number(contentRange.split('/').pop()) : Number(res.headers.get('content-length'));
      if (Number.isFinite(total) && total > 0 && body.byteLength !== total) continue;

      await cache.put(
        url,
        new Response(body, {
          status: 200,
          headers: {
            'Content-Type': res.headers.get('content-type') || 'audio/mpeg',
            'Content-Length': String(body.byteLength),
            'Accept-Ranges': 'bytes',
          },
        }),
      );
    } catch (err) {
      console.debug('[pwa] could not cache audio', url, err.message);
    }
  }
}

/**
 * On the first visit the worker activates and claims this page while the page
 * is already fetching. Chrome aborts those in-flight fetches, so wait for the
 * claim before warming (with a short fallback for browsers that never claim).
 */
function waitForController(timeoutMs = 5000) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return Promise.resolve();
  if (navigator.serviceWorker.controller) return Promise.resolve();

  return new Promise((resolve) => {
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      navigator.serviceWorker.removeEventListener('controllerchange', onChange);
    };
    const onChange = () => {
      if (!navigator.serviceWorker.controller) return;
      cleanup();
      resolve();
    };
    timer = setTimeout(() => {
      cleanup();
      resolve();
    }, timeoutMs);
    navigator.serviceWorker.addEventListener('controllerchange', onChange);
  });
}

function Banner({ tone, children }) {
  const tones = {
    offline: 'bg-amber-50 text-amber-900 border-amber-300',
    online: 'bg-leaf-50 text-leaf-800 border-leaf-300',
    ready: 'bg-leaf-50 text-leaf-800 border-leaf-300',
    update: 'bg-sky-50 text-sky-900 border-sky-300',
  };
  return (
    <div className={`w-full border-b px-3 py-2 text-xs sm:text-sm font-semibold ${tones[tone] || tones.online}`}>
      <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-center">
        {children}
      </div>
    </div>
  );
}

function PwaStatusBanner() {
  const { t } = useT();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine !== false,
  );
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [showOfflineReady, setShowOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const updateRequestedRef = useRef(false);
  const firstInstallRef = useRef(false);

  // Register the service worker here, and only here. VitePWA is built with
  // injectRegister: false, so production has no worker until this component is
  // mounted (that is, until the lead turns the 'pwa' flag on).
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return undefined;

    let cancelled = false;
    let removeVisibilityListener = null;

    const showWaitingUpdate = (worker) => {
      if (cancelled || !worker) return;
      setWaitingWorker(worker);
      setNeedRefresh(true);
    };

    const trackInstalling = (worker) => {
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (cancelled || worker.state !== 'installed') return;
        if (navigator.serviceWorker.controller) showWaitingUpdate(worker);
        else firstInstallRef.current = true;
      });
    };

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (cancelled) return;
        if (registration.waiting && navigator.serviceWorker.controller) {
          showWaitingUpdate(registration.waiting);
        }
        registration.addEventListener('updatefound', () => trackInstalling(registration.installing));

        // Check for a new build now and whenever the app comes back to the foreground.
        registration.update().catch(() => {});
        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') registration.update().catch(() => {});
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        removeVisibilityListener = () => document.removeEventListener('visibilitychange', onVisibilityChange);
      })
      .catch((err) => {
        console.warn('[pwa] service worker registration failed:', err);
      });

    const onControllerChange = () => {
      // The first worker claims this page after activation; only reload when the
      // farmer asked for the waiting update.
      if (updateRequestedRef.current) window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    return () => {
      cancelled = true;
      if (removeVisibilityListener) removeVisibilityListener();
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!showBackOnline) return undefined;
    const id = setTimeout(() => setShowBackOnline(false), BACK_ONLINE_MS);
    return () => clearTimeout(id);
  }, [showBackOnline]);

  useEffect(() => {
    if (!showOfflineReady) return undefined;
    const id = setTimeout(() => setShowOfflineReady(false), OFFLINE_READY_MS);
    return () => clearTimeout(id);
  }, [showOfflineReady]);

  // Ask the browser to keep the caches instead of evicting them under pressure.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return;
    const persisted = navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(false);
    persisted
      .then((alreadyPersisted) => (alreadyPersisted ? true : navigator.storage.persist()))
      .catch(() => false);
  }, []);

  // Opening the app offline: start loading the cached model immediately so the
  // "first visit needs internet" guard in useScanFlow does not block analysis
  // that the service worker can serve from cache.
  useEffect(() => {
    if (typeof navigator === 'undefined' || navigator.onLine !== false) return;
    loadModel().catch((err) => {
      console.debug('[pwa] cached model not available yet:', err.message);
    });
  }, []);

  // Runtime-cache the model and wasm after the worker is active. The first
  // fetch right after activation can miss the worker cache, so warmModelCache
  // checks the cache and fetches once more.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !('caches' in window)) {
      return undefined;
    }
    let cancelled = false;
    navigator.serviceWorker.ready
      .then(async () => {
        if (cancelled) return;
        await waitForController();
        if (cancelled) return;
        // Warm the runtime caches; only the small audio cache gates the
        // "offline ready" notice, so the model download keeps running.
        warmModelCache();
        await warmAudioCache();
        if (!cancelled && firstInstallRef.current) setShowOfflineReady(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = () => {
    if (!waitingWorker) {
      window.location.reload();
      return;
    }
    updateRequestedRef.current = true;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  };

  if (isOnline && !showBackOnline && !showOfflineReady && !needRefresh) return null;

  return (
    <div role="status" aria-live="polite">
      {!isOnline && <Banner tone="offline">{t('pwa.offline')}</Banner>}
      {isOnline && showBackOnline && <Banner tone="online">{t('pwa.backOnline')}</Banner>}
      {showOfflineReady && <Banner tone="ready">{t('pwa.offlineReady')}</Banner>}
      {needRefresh && (
        <Banner tone="update">
          <span>{t('pwa.updateAvailable')}</span>
          <button
            type="button"
            onClick={applyUpdate}
            className="min-h-[32px] px-3 py-1 rounded-lg bg-sky-700 text-white font-bold cursor-pointer"
          >
            {t('pwa.reload')}
          </button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            className="min-h-[32px] px-2 py-1 text-sky-800 underline font-semibold cursor-pointer"
          >
            {t('pwa.later')}
          </button>
        </Banner>
      )}
    </div>
  );
}

/** [app] Offline/online banner and update notice, rendered once in the app frame. */
// eslint-disable-next-line no-unused-vars
export function PwaStatus({ scan, context }) {
  if (!isFeatureOn('pwa')) return null;
  return <PwaStatusBanner />;
}

function InstallPromptButton() {
  const { t } = useT();
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (installed || !installEvent) return null;

  const handleInstall = async () => {
    try {
      installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice?.outcome === 'accepted') setInstalled(true);
    } catch (err) {
      console.warn('[pwa] install prompt failed:', err);
    }
    setInstallEvent(null);
  };

  return (
    <div className="w-full max-w-sm mb-6">
      <button
        type="button"
        onClick={handleInstall}
        className="w-full min-h-[48px] px-5 py-3 bg-white hover:bg-leaf-50 text-leaf-700 border border-leaf-700/40 font-bold rounded-xl flex items-center justify-center gap-2.5 shadow-xs transition-all cursor-pointer"
      >
        <span className="text-xl" aria-hidden="true">📲</span>
        <span>{t('pwa.install')}</span>
      </button>
      <p className="mt-1.5 text-[11px] text-gray-500 text-center">{t('pwa.installHint')}</p>
    </div>
  );
}

/** [home] 'Install app' prompt on the home page. */
// eslint-disable-next-line no-unused-vars
export function InstallPrompt({ scan, context }) {
  if (!isFeatureOn('pwa')) return null;
  return <InstallPromptButton />;
}
