import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '../../i18n/I18nProvider.jsx';
import TabBar from '../TabBar.jsx';
import { visibleTabs, TABS } from '../tabs.js';
import { FEATURES } from '../../features/flags.js';
import { FEATURE_ROUTES } from '../../features/slotLayout.js';
import bn from '../../i18n/bn.js';
import en from '../../i18n/en.js';

const SHIPPED = { ...FEATURES };
afterEach(() => Object.assign(FEATURES, SHIPPED));
const render = (route, lang = 'bn') => renderToString(
  <I18nProvider initialLang={lang}><TabBar currentRoute={route} onNavigate={() => {}} /></I18nProvider>,
);

describe('feature tabs', () => {
  it('every feature tab points to a real feature page and has texts in both languages', () => {
    for (const tab of TABS) {
      if (tab.feature) expect(FEATURE_ROUTES[tab.route]?.[0], tab.route).toBe(tab.feature);
      expect(typeof bn[tab.labelKey], tab.labelKey).toBe('string');
      expect(typeof en[tab.labelKey], tab.labelKey).toBe('string');
    }
  });

  it('shows Home plus one tab per released feature page', () => {
    expect(visibleTabs().map((t) => t.route)).toEqual(['#/', '#/reminders', '#/history', '#/weather', '#/profile']);
  });

  it('hides the tab of a feature that is off, and the whole bar when only Home is left', () => {
    FEATURES.weather = false;
    expect(visibleTabs().map((t) => t.route)).not.toContain('#/weather');
    FEATURES.history = false;
    FEATURES.profile = false;
    FEATURES.reminders = false;
    expect(render('#/')).toBe('');
  });

  it('marks the current tab for screen readers', () => {
    const html = render('#/history');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain(bn.navHistory);
    expect(render('#/history', 'en')).toContain(en.navWeather);
  });
});
