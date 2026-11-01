import React from 'react';
import useT from '../i18n/useT.js';
import LanguageToggle from './LanguageToggle.jsx';
import { ROUTES } from '../routes/useHashRoute.js';

export default function Navbar({ currentRoute, onNavigate }) {
  const { t } = useT();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-gray-200/80 shadow-xs w-full">
      <div className="max-w-xl mx-auto px-2 sm:px-3 py-2 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
        {/* Left: AIgnite Sticker (height strictly >= 40px and <= 52px, never shrinks below 40px) */}
        <a
          href={ROUTES.HOME}
          onClick={(e) => {
            e.preventDefault();
            onNavigate(ROUTES.HOME);
          }}
          className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 rounded-lg p-0.5 focus-visible:outline-2 focus-visible:outline-leaf-700"
          aria-label={`${t('appName')} - ${t('navHome')}`}
        >
          <img
            src="/brand/aignite-sticker.png"
            alt="Built for Ostad Presents YUNet AIgnite Buildathon 2026"
            className="h-10 sm:h-11 md:h-12 w-auto object-contain shrink-0"
            width="124"
            height="44"
            fetchpriority="high"
          />
          <div className="flex flex-col leading-tight min-w-0 overflow-hidden">
            <span className="font-bold text-leaf-700 text-xs min-[370px]:text-sm sm:text-base tracking-tight truncate">
              {t('appName')}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 font-medium -mt-0.5 truncate hidden sm:block">
              {t('appSubtitle')}
            </span>
          </div>
        </a>

        {/* Right: Navigation items & Language Toggle */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <nav className="flex items-center gap-1" aria-label="Main Navigation">
            <a
              href={ROUTES.ACCURACY}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(ROUTES.ACCURACY);
              }}
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                currentRoute === ROUTES.ACCURACY
                  ? 'bg-leaf-700 text-white'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
              aria-label={t('navAccuracy')}
            >
              <span className="sm:hidden text-sm" aria-hidden="true">📊</span>
              <span className="hidden sm:inline">{t('navAccuracy')}</span>
            </a>

            <a
              href={ROUTES.ABOUT}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(ROUTES.ABOUT);
              }}
              className={`inline-flex items-center justify-center min-w-[44px] min-h-[44px] px-2 sm:px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                currentRoute === ROUTES.ABOUT
                  ? 'bg-leaf-700 text-white'
                  : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
              }`}
              aria-label={t('navAbout')}
            >
              <span className="sm:hidden text-sm" aria-hidden="true">ℹ️</span>
              <span className="hidden sm:inline">{t('navAbout')}</span>
            </a>
          </nav>

          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
