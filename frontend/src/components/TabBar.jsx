// Feature tabs under the header: Home plus one tab per released feature page. A tab appears only
// when its feature flag is on, so unbuilt features never show an empty tab.
import React from 'react';
import useT from '../i18n/useT.js';
import { visibleTabs } from './tabs.js';

export default function TabBar({ currentRoute, onNavigate }) {
  const { t } = useT();
  const tabs = visibleTabs();
  if (tabs.length < 2) return null; // only Home: no tab bar

  return (
    <nav
      aria-label={t('navFeatureTabs')}
      className="w-full border-t border-gray-200/80"
      data-testid="feature-tabs"
    >
      <ul className="max-w-xl mx-auto flex items-stretch justify-between px-1">
        {tabs.map((tab) => {
          const active = currentRoute === tab.route;
          return (
            <li key={tab.route} className="flex-1 min-w-0">
              <a
                href={tab.route}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(tab.route);
                }}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 text-[11px] sm:text-xs font-semibold border-b-[3px] transition-colors ${
                  active
                    ? 'border-leaf-700 text-leaf-800'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } focus-visible:outline-2 focus-visible:outline-leaf-700`}
              >
                <span className="text-base leading-none" aria-hidden="true">{tab.icon}</span>
                <span className="mt-0.5 truncate max-w-full">{t(tab.labelKey)}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
