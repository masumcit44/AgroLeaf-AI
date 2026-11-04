// Feature tabs: Home plus one tab per released feature page (see TabBar.jsx).
import { ROUTES } from '../routes/useHashRoute.js';
import { isFeatureOn } from '../features/flags.js';

export const TABS = [
  { route: ROUTES.HOME, icon: '🏠', labelKey: 'navHome', feature: null },
  { route: ROUTES.HISTORY, icon: '🗂️', labelKey: 'navHistory', feature: 'history' },
  { route: ROUTES.WEATHER, icon: '🌦️', labelKey: 'navWeather', feature: 'weather' },
  { route: ROUTES.MAP, icon: '🗺️', labelKey: 'navMap', feature: 'areaMap' },
  { route: ROUTES.PROFILE, icon: '📍', labelKey: 'navProfile', feature: 'profile' },
];

export function visibleTabs() {
  return TABS.filter((tab) => !tab.feature || isFeatureOn(tab.feature));
}

