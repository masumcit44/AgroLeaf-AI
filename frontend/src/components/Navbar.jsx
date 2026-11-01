import React from 'react';
import useT from '../i18n/useT.js';
import LanguageToggle from './LanguageToggle.jsx';
import { ROUTES } from '../routes/useHashRoute.js';

export default function Navbar({ currentRoute, onNavigate }) {
  const { t } = useT();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-gray-200/80 shadow-xs">
      <div className="max-w-xl mx-auto px-3 py-2 flex items-center justify-between gap-2">
        {/* Left: AIgnite Sticker (44-52px height, always visible) */}
        <a
          href={ROUTES.HOME}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(ROUTES.HOME);
          }}
          className="flex items-center gap-2 shrink-0 rounded-lg p-0.5 focus-visible:outline-2 focus-visible:outline-leaf-700"
          aria-label={t('navHome')}
        >
          <img
            src="/brand/aignite-sticker.png"
            alt="Built for Ostad Presents YUNet AIgnite Buildathon 2026"
            className="h-11 sm:h-12 w-auto object-contain shrink-0"
            width="124"
            height="44"
          />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-leaf-700 text-base sm:text-lg tracking-tight">
              {t('appName')}
            </span>
            <span className="text-[11px] sm:text-xs text-gray-500 font-medium -mt-0.5">
              {t('appSubtitle')}
            </span>
          </div>
        </a>

        {/* Right: Navigation items & Language Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <nav className="flex items-center gap-1" aria-label="Main Navigation">
            <a
              href={ROUTES.ACCURACY}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(ROUTES.ACCURACY);
              }}
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                currentRoute === ROUTES.ACCURACY
                  ? 'bg-leaf-700 text-white'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
              aria-label={t('navAccuracy')}
            >
              <span>{t('navAccuracy')}</span>
            </a>

            <a
              href={ROUTES.ABOUT}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(ROUTES.ABOUT);
              }}
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                currentRoute === ROUTES.ABOUT
                  ? 'bg-leaf-700 text-white'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
              aria-label={t('navAbout')}
            >
              <span>{t('navAbout')}</span>
            </a>
          </nav>

          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
