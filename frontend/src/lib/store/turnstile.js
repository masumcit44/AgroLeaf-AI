// Turnstile widget loader: loads the script only when needed, renders a managed widget in a modal.
let turnstilePromise = null;
let widgetId = null;
let widgetContainer = null;

function loadTurnstileScript() {
  if (turnstilePromise) return turnstilePromise;
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if (!siteKey) return Promise.resolve(null);
  turnstilePromise = new Promise((resolve) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
  return turnstilePromise;
}

function createWidgetContainer() {
  if (widgetContainer) return widgetContainer;
  widgetContainer = document.createElement('div');
  widgetContainer.style.position = 'fixed';
  widgetContainer.style.inset = '0';
  widgetContainer.style.background = 'rgba(0,0,0,0.5)';
  widgetContainer.style.display = 'flex';
  widgetContainer.style.alignItems = 'center';
  widgetContainer.style.justifyContent = 'center';
  widgetContainer.style.zIndex = '10000';
  widgetContainer.innerHTML = `
    <div style="background:white;padding:24px;border-radius:16px;max-width:360px;width:90%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
      <div id="turnstile-widget"></div>
      <p style="margin:12px 0 0;font-size:14px;color:#6b7280;">Verifying you are human…</p>
    </div>
  `;
  document.body.appendChild(widgetContainer);
  return widgetContainer;
}

function removeWidgetContainer() {
  if (widgetContainer) {
    widgetContainer.remove();
    widgetContainer = null;
  }
}

/**
 * Opens a Turnstile challenge modal and returns the token, or null if no site key / cancelled.
 */
export async function getTurnstileToken() {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  const turnstile = await loadTurnstileScript();
  if (!turnstile) return null;

  const container = createWidgetContainer();
  const widgetDiv = container.querySelector('#turnstile-widget');

  return new Promise((resolve) => {
    let resolved = false;
    const cleanup = () => {
      if (widgetId) {
        try { turnstile.remove(widgetId); } catch {}
        widgetId = null;
      }
      removeWidgetContainer();
    };

    widgetId = turnstile.render(widgetDiv, {
      sitekey: siteKey,
      theme: 'light',
      callback: (token) => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(token);
        }
      },
      'expired-callback': () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(null);
        }
      },
      'error-callback': () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(null);
        }
      },
    });

    // Allow closing by clicking backdrop
    container.onclick = (e) => {
      if (e.target === container && !resolved) {
        resolved = true;
        cleanup();
        resolve(null);
      }
    };
    // Escape key closes
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !resolved) {
        resolved = true;
        cleanup();
        resolve(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    // Cleanup listener on resolve
    const originalResolve = resolve;
    resolve = (val) => {
      document.removeEventListener('keydown', onKeyDown);
      originalResolve(val);
    };
  });
}

/** Reset internal state (for tests). */
export function resetTurnstile() {
  turnstilePromise = null;
  widgetId = null;
  if (widgetContainer) {
    widgetContainer.remove();
    widgetContainer = null;
  }
}