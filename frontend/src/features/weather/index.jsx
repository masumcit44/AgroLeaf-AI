// F8 Seasonal disease and weather awareness.
// Citations: BAMIS Boro Crop Calendars (Faridpur: 5102.pdf, Sylhet: 5108.pdf).
// Wording constraint: 'favourable conditions — check your field', never a risk %, never 'will occur'.
// Attribution: 'Weather data by Open-Meteo.com (CC BY 4.0)'. Link: https://www.bamis.gov.bd/

import React, { useEffect, useState } from 'react';
import useT from '../../i18n/useT.js';
import { getProfileLocation, getWeatherData } from './weatherStore.js';
import { evaluateWeatherRules } from './weatherRules.js';

function getChipText(ruleId, _lang, t) {
  if (ruleId === 'blast') return t('weather.blastFavourable');
  if (ruleId === 'sheath_blight') return t('weather.sheathBlightFavourable');
  if (ruleId === 'bacterial_leaf_blight') return t('weather.blightFavourable');
  return `${t('weather.favourablePrefix')} ${ruleId}`;
}

/**
 * [home|result] 'favourable conditions — check your field' chips; props.context tells where it is shown.
 */
export function WeatherChips({ scan, context, initialLocation, initialWeather }) {
  const { t, lang } = useT();
  const [hasCheckedProfile, setHasCheckedProfile] = useState(initialLocation !== undefined);
  const [location, setLocation] = useState(initialLocation ?? null);
  const [weather, setWeather] = useState(initialWeather ?? null);
  const [favourable, setFavourable] = useState(
    initialWeather?.hourly ? evaluateWeatherRules(initialWeather.hourly) : []
  );

  useEffect(() => {
    if (initialLocation !== undefined) return;
    let active = true;

    async function load() {
      try {
        const loc = await getProfileLocation();
        if (!active) return;
        setLocation(loc);
        setHasCheckedProfile(true);

        if (!loc) return;

        const w = await getWeatherData(loc);
        if (!active) return;
        setWeather(w);

        if (w && w.hourly) {
          const rules = evaluateWeatherRules(w.hourly);
          if (active) setFavourable(rules);
        }
      } catch (err) {
        console.error('Weather load error:', err);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [initialLocation]);

  if (!hasCheckedProfile) return null;

  // On Home screen
  if (!context || context === 'home') {
    // 1. No profile: prompt user to set area (linking to #/profile, NO GPS)
    if (!location) {
      return (
        <div className="w-full max-w-sm rounded-xl border border-leaf-700/20 bg-leaf-50/70 p-3 text-xs">
          <p className="text-gray-700 font-medium mb-1.5">{t('weather.setAreaPrompt')}</p>
          <a
            href="#/profile"
            className="inline-block font-semibold text-leaf-700 hover:text-leaf-800 underline"
          >
            {t('weather.setAreaAction')} →
          </a>
        </div>
      );
    }

    // 2. Profile exists, but weather could not be loaded and no cache
    if (!weather) {
      return null;
    }

    // 3. Weather loaded: if no rules favourable, show no chips
    if (favourable.length === 0) {
      return null;
    }

    // 4. Show chips for favourable diseases in next 3 days
    return (
      <div className="w-full max-w-sm space-y-2">
        {weather.isOffline && (
          <div className="text-[11px] text-amber-800 bg-amber-50 rounded-lg px-2.5 py-1 border border-amber-200">
            {t('weather.offlineNotice')}
          </div>
        )}
        {favourable.map((r) => (
          <div
            key={r.ruleId}
            className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 shadow-sm space-y-1.5"
          >
            <div className="flex items-start gap-2.5">
              <span className="text-base leading-none select-none" aria-hidden="true">
                ⚠️
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-semibold block">{getChipText(r.ruleId, lang, t)}</span>
                {r.sourceUrl && (
                  <a
                    href={r.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-leaf-700 hover:text-leaf-800 underline font-medium inline-flex items-center gap-1 mt-1"
                  >
                    {t('weather.howItWorks')} ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-0.5 px-0.5">
          <span>{t('weather.attribution')}</span>
          <a
            href="https://www.bamis.gov.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-leaf-700 hover:text-leaf-800 underline font-medium"
          >
            {t('weather.bamisBulletin')}
          </a>
        </div>
      </div>
    );
  }

  // On Result screen: only show the chip for the diagnosed disease, if favourable
  if (context === 'result' && scan) {
    if (!location || !weather || favourable.length === 0) return null;

    // Check if the diagnosed disease matches any favourable weather rule
    const classKey = scan.classKey;
    const matchedRule = favourable.find((r) => {
      if (r.diseaseKey === classKey) return true;
      if (classKey === 'other_rice' && r.ruleId === 'bacterial_leaf_blight') return true;
      return false;
    });

    if (!matchedRule) return null;

    return (
      <div className="w-full max-w-sm rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 shadow-sm space-y-2">
        <div className="flex items-start gap-2.5">
          <span className="text-base leading-none select-none" aria-hidden="true">
            ⚠️
          </span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold block">{getChipText(matchedRule.ruleId, lang, t)}</span>
            {matchedRule.sourceUrl && (
              <a
                href={matchedRule.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-leaf-700 hover:text-leaf-800 underline font-medium inline-flex items-center gap-1 mt-1"
              >
                {t('weather.howItWorks')} ↗
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1.5 border-t border-amber-200">
          <span>{t('weather.attribution')}</span>
          <a
            href="https://www.bamis.gov.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-leaf-700 hover:text-leaf-800 underline font-medium"
          >
            {t('weather.bamisBulletin')}
          </a>
        </div>
      </div>
    );
  }

  return null;
}
