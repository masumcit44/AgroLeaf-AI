import React from 'react';
import useT from '../i18n/useT.js';
import { ROUTES } from '../routes/useHashRoute.js';

export default function Footer({ onNavigate }) {
  const { t } = useT();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/70 text-gray-700 py-6 px-4">
      <div className="max-w-lg mx-auto flex flex-col items-center text-center space-y-3">
        {/* Responsible AI Disclaimer */}
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <span className="font-semibold text-amber-700 block mb-1">
            ⚠️ {t('footerDisclaimer')}
          </span>
        </p>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-leaf-700 font-medium">
          <span aria-hidden="true">🔒</span>
          <span>{t('footerPrivacy')}</span>
        </div>

        {/* Nav link & Copyright */}
        <div className="pt-2 text-xs text-gray-500 flex flex-wrap items-center justify-center gap-3">
          <a
            href={ROUTES.ABOUT}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(ROUTES.ABOUT);
            }}
            className="text-leaf-700 font-semibold hover:underline min-h-[44px] inline-flex items-center"
          >
            {t('footerAboutLink')}
          </a>
          <span>•</span>
          <span>Ostad Presents YUNet AIgnite Buildathon 2026</span>
        </div>
      </div>
    </footer>
  );
}
