// F8 v2 Dedicated "Weather & Crop Analysis" Page (#/weather).
// 10-section comprehensive agro-meteorological awareness report.
// Strict compliance: Zero LLM/AI prose, zero chemical doses, 2-decimal rounded coordinates (~1 km privacy).
// Attribution: Open-Meteo (CC BY 4.0), OSM Nominatim (ODbL), BAMIS/DAE, BRRI.

import React, { useState, useEffect, useRef } from 'react';
import useT from '../../i18n/useT.js';
import {
  roundCoord,
  searchLocations,
  findNearestDistrict,
  formatNumber,
  formatTimeAgo,
} from './geoUtils.js';
import { getProfileLocation } from './weatherStore.js';
import {
  getWeatherReportData,
  getWindCardinal,
} from './weatherReportStore.js';
import { getCurrentSeason, CROP_STAGES, getStageAdvisory } from './cropCalendar.js';

export default function WeatherReportPage({ initialLocation, initialData }) {
  const { t, lang } = useT();

  // Location state
  const [location, setLocation] = useState(initialLocation ?? null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Search state
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // Report data state
  const [report, setReport] = useState(initialData ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Season and crop stage state
  const [seasonInfo] = useState(() => getCurrentSeason());
  const [selectedStage, setSelectedStage] = useState(() => seasonInfo.defaultStage || 'ripening');

  // Expanded quotes state
  const [expandedQuotes, setExpandedQuotes] = useState({});

  // 1. Initial Load: Load profile location if not provided
  useEffect(() => {
    if (initialLocation !== undefined) return;
    let active = true;

    async function init() {
      try {
        const profLoc = await getProfileLocation();
        if (!active) return;
        if (profLoc) {
          setLocation({
            name: lang === 'bn' ? profLoc.district_name_bn : profLoc.district_name_en,
            displayName: `${profLoc.district_name_bn} (${profLoc.district_name_en})`,
            lat: roundCoord(profLoc.lat),
            lon: roundCoord(profLoc.lon),
            level: 'district',
            isApproximate: false,
          });
        }
      } catch (err) {
        console.error('Failed to read profile location:', err);
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [initialLocation, lang]);

  // 2. Fetch report when location changes
  useEffect(() => {
    if (!location || location.lat == null || location.lon == null) return;
    let active = true;

    async function loadReport(force = false) {
      if (force) setIsRefreshing(true);
      else setIsLoading(true);
      setFetchError(null);

      try {
        const data = await getWeatherReportData(location, { forceRefresh: force });
        if (!active) return;
        if (!data) {
          setFetchError(t('weather.unavailable'));
        } else {
          setReport(data);
        }
      } catch (err) {
        if (!active) return;
        console.error('Weather report fetch error:', err);
        setFetchError(t('weather.unavailable'));
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadReport();
    return () => {
      active = false;
    };
  }, [location, t]);

  // 3. Close search dropdown on click outside or escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setIsEditingLocation(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsEditingLocation(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Geolocation Handler
  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setGeoError(t('weather.geoUnavailable'));
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const rawLat = pos.coords.latitude;
        const rawLon = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        const rLat = roundCoord(rawLat);
        const rLon = roundCoord(rawLon);
        const isApprox = accuracy > 2000;

        const nearest = findNearestDistrict(rLat, rLon);
        const distName = nearest
          ? lang === 'bn'
            ? nearest.district_name_bn
            : nearest.district_name_en
          : `${rLat}°N, ${rLon}°E`;

        setLocation({
          name: distName,
          displayName: distName,
          lat: rLat,
          lon: rLon,
          level: isApprox ? 'area' : 'upazila',
          isApproximate: isApprox,
          accuracy,
        });
        setIsEditingLocation(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setGeoError(t('weather.geoDenied'));
        } else if (err.code === 2) {
          setGeoError(t('weather.geoUnavailable'));
        } else if (err.code === 3) {
          setGeoError(t('weather.geoTimeout'));
        } else {
          setGeoError(t('weather.geoUnavailable'));
        }
      },
      { timeout: 10000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  }

  // Location Search Handler
  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleSelectLocation(loc) {
    setLocation(loc);
    setIsEditingLocation(false);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setGeoError(null);
  }

  function toggleQuote(id) {
    setExpandedQuotes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  // Stage advisory
  const stageAdvisory = getStageAdvisory(selectedStage);

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 space-y-6 text-gray-900 pb-20">
      {/* ======================================================== */}
      {/* 1. LOCATION BAR */}
      {/* ======================================================== */}
      <section className="bg-white rounded-2xl p-4 border border-leaf-700/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {location ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-base truncate">
                  📍 {location.name}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-leaf-100 text-leaf-800 border border-leaf-200">
                  {location.level === 'village'
                    ? t('weather.levelVillage')
                    : location.level === 'upazila'
                    ? t('weather.levelUpazila')
                    : t('weather.levelDistrict')}
                </span>
                {location.isApproximate && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    {t('weather.approxLocation')}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-600 font-medium">
                {t('weather.setAreaPrompt')}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsEditingLocation((prev) => !prev)}
            className="min-h-[44px] px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition"
          >
            {isEditingLocation ? '✕' : t('weather.changeLocation')}
          </button>
        </div>

        {/* Location Selector / Search Dropdown */}
        {isEditingLocation && (
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-leaf-50 hover:bg-leaf-100 text-leaf-800 border border-leaf-300 transition"
            >
              <span>📍</span>
              <span>{isLocating ? t('weather.locating') : t('weather.useMyLocation')}</span>
            </button>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('weather.searchPlaceholder')}
                className="flex-1 min-h-[44px] px-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-leaf-600 focus:border-leaf-600 bg-white"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold rounded-xl bg-leaf-700 hover:bg-leaf-800 text-white transition disabled:opacity-50"
              >
                {isSearching ? '...' : t('weather.searchAction')}
              </button>
            </form>

            {/* Search Results List */}
            {hasSearched && (
              <div
                ref={searchDropdownRef}
                className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 shadow-lg"
              >
                {searchResults.length === 0 ? (
                  <div className="p-3 text-xs text-gray-500 text-center">
                    {t('weather.noLocationsFound')}
                  </div>
                ) : (
                  searchResults.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectLocation(res)}
                      className="w-full text-left p-2.5 text-xs hover:bg-leaf-50 flex items-start justify-between gap-2 transition"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{res.name}</div>
                        <div className="text-[11px] text-gray-500 truncate">{res.displayName}</div>
                      </div>
                      <span className="text-[10px] text-leaf-700 font-medium shrink-0">
                        {formatNumber(res.lat, lang)}°, {formatNumber(res.lon, lang)}°
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Geolocation Error Alert */}
        {geoError && (
          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            {geoError}
          </div>
        )}
      </section>

      {/* No location prompt */}
      {!location && (
        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200 text-center space-y-3">
          <span className="text-3xl">🌾</span>
          <h2 className="text-base font-bold text-amber-950">{t('weather.setAreaPrompt')}</h2>
          <p className="text-xs text-amber-900 leading-relaxed">{t('weather.pageIntro')}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="min-h-[44px] px-6 py-2.5 text-sm font-semibold rounded-xl bg-leaf-700 hover:bg-leaf-800 text-white shadow-sm transition disabled:opacity-60"
            >
              📍 {isLocating ? t('weather.locating') : t('weather.useMyLocation')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditingLocation(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="min-h-[44px] px-6 py-2.5 text-sm font-semibold rounded-xl bg-white border border-leaf-300 text-leaf-800 hover:bg-leaf-50 transition"
            >
              🔍 {t('weather.setAreaAction')}
            </button>
          </div>
          {geoError && <p className="text-xs text-amber-900">{geoError}</p>}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-2">
          <div className="animate-spin text-2xl">⏳</div>
          <p className="text-xs text-gray-600 font-medium">{t('weather.refreshing')}</p>
        </div>
      )}

      {/* Fetch Error */}
      {fetchError && !report && (
        <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-center text-xs text-rose-800">
          {fetchError}
        </div>
      )}

      {/* Main Report Body */}
      {location && report && !isLoading && (
        <>
          {/* ======================================================== */}
          {/* 2. REPORT HEADER */}
          {/* ======================================================== */}
          <section className="bg-gradient-to-br from-leaf-700 to-leaf-900 rounded-2xl p-5 text-white shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-leaf-200 block">
                  {t('weather.reportTitle')}
                </span>
                <h1 className="text-xl font-bold mt-0.5 leading-snug">
                  {report.locationName}
                </h1>
                <p className="text-[11px] text-leaf-100/90 mt-0.5">
                  {formatNumber(report.lat, lang)}°N, {formatNumber(report.lon, lang)}°E
                </p>
              </div>

              <div className="text-right flex flex-col items-end gap-1.5">
                {report.isOffline || report.isStale ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                    {t('weather.staleBadge')}
                  </span>
                ) : report.fromCache ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-leaf-200 text-leaf-900">
                    {t('weather.cachedBadge')}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-900 animate-pulse"></span>
                    {t('weather.liveBadge')}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (location) {
                      getWeatherReportData(location, { forceRefresh: true }).then((data) => {
                        if (data) setReport(data);
                      });
                    }
                  }}
                  disabled={isRefreshing}
                  className="min-h-[44px] px-3 py-1 text-[11px] font-semibold rounded-lg bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1"
                >
                  <span>🔄</span>
                  <span>{isRefreshing ? t('weather.refreshing') : t('weather.refreshAction')}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-leaf-600/60 flex items-center justify-between text-[11px] text-leaf-100/80">
              <span>{t('weather.dataSource')}</span>
              <span>{formatTimeAgo(report.fetched_at, lang, t)}</span>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 3. NOW (CURRENT CONDITIONS) */}
          {/* ======================================================== */}
          <section className="bg-white rounded-2xl p-4 border border-leaf-700/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span>🌡️</span>
                <span>{t('weather.nowTitle')}</span>
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                {t('weather.observedTag')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* Temperature */}
              <div className="p-3 rounded-xl bg-leaf-50/70 border border-leaf-200/60">
                <span className="text-[11px] text-gray-600 font-medium block">
                  {t('weather.nowTitle')}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {report.current.temp != null
                    ? `${formatNumber(report.current.temp, lang)} ${t('weather.unitC')}`
                    : t('weather.dataNotAvailable')}
                </span>
                {report.current.feelsLike != null && (
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    {t('weather.feelsLike')}: {formatNumber(report.current.feelsLike, lang)} {t('weather.unitC')}
                  </span>
                )}
              </div>

              {/* Relative Humidity */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/60">
                <span className="text-[11px] text-gray-600 font-medium block">
                  {t('weather.humidity')}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {report.current.rh != null
                    ? `${formatNumber(report.current.rh, lang)}${t('weather.unitPercent')}`
                    : t('weather.dataNotAvailable')}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  {report.current.rh >= 80 ? 'আর্দ্রতাপ্রবণ (High)' : 'স্বাভাবিক (Normal)'}
                </span>
              </div>

              {/* Rain Now */}
              <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200/60">
                <span className="text-[11px] text-gray-600 font-medium block">
                  {t('weather.rainNow')}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {report.current.precip != null
                    ? `${formatNumber(report.current.precip, lang)} ${t('weather.unitMm')}`
                    : t('weather.dataNotAvailable')}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  {report.current.precip > 0 ? 'বৃষ্টি হচ্ছে' : 'বৃষ্টি নেই'}
                </span>
              </div>

              {/* Wind Speed & Direction */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
                <span className="text-[11px] text-gray-600 font-medium block">
                  {t('weather.wind')}
                </span>
                <span className="text-sm font-bold text-gray-900 truncate block">
                  {report.current.windSpeed != null
                    ? `${formatNumber(report.current.windSpeed, lang)} ${t('weather.unitKmh')}`
                    : t('weather.dataNotAvailable')}
                </span>
                <span className="text-[10px] text-gray-600 block mt-0.5">
                  {getWindCardinal(report.current.windDirection, lang)}
                </span>
              </div>

              {/* Cloud Cover */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] text-gray-600 font-medium block">
                  {t('weather.cloudCover')}
                </span>
                <span className="text-xl font-bold text-gray-900">
                  {report.current.cloudCover != null
                    ? `${formatNumber(report.current.cloudCover, lang)}${t('weather.unitPercent')}`
                    : t('weather.dataNotAvailable')}
                </span>
                <span className="text-[10px] text-gray-500 block mt-0.5">
                  {report.current.cloudCover >= 50 ? 'মেঘলা (Cloudy)' : 'পরিষ্কার (Clear)'}
                </span>
              </div>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 4. NEXT 7 DAYS FORECAST */}
          {/* ======================================================== */}
          <section className="bg-white rounded-2xl p-4 border border-leaf-700/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span>📅</span>
                <span>{t('weather.next7DaysTitle')}</span>
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {t('weather.forecastTag')}
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {report.forecastDays.map((d, idx) => (
                <div
                  key={d.date}
                  className="py-2.5 flex items-center justify-between text-xs gap-2"
                >
                  <div className="w-24 shrink-0">
                    <span className="font-semibold text-gray-900 block">
                      {idx === 0
                        ? lang === 'bn'
                          ? 'আজ'
                          : 'Today'
                        : new Date(d.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {formatNumber(d.date.slice(5), lang)}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-center gap-2">
                    <span className="text-gray-600 font-medium">
                      {formatNumber(Math.round(d.minTemp), lang)}°
                    </span>
                    <div className="w-16 h-2 rounded-full bg-gray-100 overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-amber-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.max(20, (d.maxTemp - d.minTemp) * 7))}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-900 font-bold">
                      {formatNumber(Math.round(d.maxTemp), lang)}°
                    </span>
                  </div>

                  <div className="w-24 text-right shrink-0">
                    <span className="text-blue-700 font-semibold block">
                      🌧️ {formatNumber(Math.round(d.precipSum * 10) / 10, lang)} {t('weather.unitMm')}
                    </span>
                    {d.precipProb != null && (
                      <span className="text-[10px] text-gray-500">
                        {formatNumber(d.precipProb, lang)}% {t('weather.rainProb')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ======================================================== */}
          {/* 5. LAST 7 DAYS (OBSERVED / REANALYSIS) */}
          {/* ======================================================== */}
          {report.pastSummary && (
            <section className="bg-white rounded-2xl p-4 border border-leaf-700/20 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <span>📊</span>
                  <span>{t('weather.past7DaysTitle')}</span>
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                  {t('weather.reanalysisTag')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[11px] text-gray-600 block">{t('weather.totalRain')}</span>
                  <span className="text-base font-bold text-gray-900">
                    {formatNumber(report.pastSummary.totalRainfall, lang)} {t('weather.unitMm')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    {t('weather.rainyDays')}: {formatNumber(report.pastSummary.rainyDays, lang)} {t('weather.days')}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[11px] text-gray-600 block">{t('weather.meanRh')}</span>
                  <span className="text-base font-bold text-gray-900">
                    {report.pastSummary.meanRh != null
                      ? `${formatNumber(report.pastSummary.meanRh, lang)}${t('weather.unitPercent')}`
                      : t('weather.dataNotAvailable')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    {t('weather.tempRange')}: {formatNumber(report.pastSummary.minTemp, lang)}° - {formatNumber(report.pastSummary.maxTemp, lang)}°
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed italic">
                {t('weather.reanalysisNote')}
              </p>
            </section>
          )}

          {/* ======================================================== */}
          {/* 6. SEASON & CROP CONTEXT */}
          {/* ======================================================== */}
          <section className="bg-leaf-50/70 rounded-2xl p-4 border border-leaf-700/20 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-leaf-950 flex items-center gap-1.5">
              <span>🌾</span>
              <span>{t('weather.seasonContextTitle')}</span>
            </h2>

            <div className="p-3 rounded-xl bg-white border border-leaf-200 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-leaf-900">
                  {lang === 'bn' ? seasonInfo.nameBn : seasonInfo.nameEn}
                </span>
                <span className="text-leaf-700 font-semibold">
                  {lang === 'bn' ? seasonInfo.phaseBn : seasonInfo.phaseEn}
                </span>
              </div>
              <p className="text-[10px] text-gray-500">{seasonInfo.source}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">
                {t('weather.selectStage')}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {CROP_STAGES.map((stg) => {
                  const isSelected = selectedStage === stg.id;
                  return (
                    <button
                      key={stg.id}
                      type="button"
                      onClick={() => setSelectedStage(stg.id)}
                      className={`min-h-[44px] px-3 py-2 text-xs font-semibold rounded-xl border text-center transition ${
                        isSelected
                          ? 'bg-leaf-700 text-white border-leaf-700 shadow-sm'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {lang === 'bn' ? stg.labelBn : stg.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stage Guidance */}
            <div className="p-3 rounded-xl bg-white border border-leaf-200 text-xs text-gray-800 space-y-1 leading-relaxed">
              <p>{lang === 'bn' ? stageAdvisory.bn : stageAdvisory.en}</p>
              <span className="text-[10px] text-leaf-700 font-medium block">
                — {stageAdvisory.source}
              </span>
            </div>
          </section>

          {/* ======================================================== */}
          {/* 7. DISEASE WEATHER CONCERNS */}
          {/* ======================================================== */}
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span>🔬</span>
                <span>{t('weather.diseaseConcernsTitle')}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {t('weather.diseaseDisclaimer')}
              </p>
            </div>

            <div className="space-y-3">
              {report.diseaseEvaluations.map((dis) => {
                const isFavourable = dis.isFavourable === true;
                const isUnsupported = Boolean(dis.isUnsupported);

                return (
                  <div
                    key={dis.id}
                    className={`rounded-2xl p-4 border shadow-sm space-y-2.5 transition ${
                      isFavourable
                        ? 'bg-amber-50/80 border-amber-300'
                        : isUnsupported
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-gray-900">
                          {lang === 'bn' ? dis.nameBn : dis.nameEn}
                        </h3>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                          {isUnsupported ? 'QUALITATIVE ADVISORY' : t('weather.researchRuleTag')}
                        </span>
                      </div>

                      {isFavourable ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-200 text-amber-950 border border-amber-300 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>{t('weather.ruleMatched')}</span>
                        </span>
                      ) : isUnsupported ? (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                          {t('weather.noWeatherRule')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                          {t('weather.ruleNotMatched')}
                        </span>
                      )}
                    </div>

                    {/* Favourable frequency note */}
                    {isFavourable && (
                      <div className="text-xs font-semibold text-amber-900">
                        {t('weather.favourableDaysInNext7').replace(
                          '{n}',
                          formatNumber(dis.favourableDaysCount, lang)
                        )}
                      </div>
                    )}

                    {/* Rule summary & forecast values comparison */}
                    {!isUnsupported && (
                      <div className="text-xs space-y-1 bg-white/70 p-2.5 rounded-xl border border-gray-200/60">
                        <div>
                          <span className="font-semibold text-gray-700">
                            {t('weather.ruleCriteria')}:{' '}
                          </span>
                          <span className="text-gray-800">
                            {lang === 'bn' ? dis.ruleSummaryBn : dis.ruleSummaryEn}
                          </span>
                        </div>
                        {dis.nextDaysSummary && (
                          <div className="text-[11px] text-gray-600 pt-1 border-t border-gray-100">
                            <span className="font-medium text-gray-700">
                              {t('weather.forecastValues')}:{' '}
                            </span>
                            <span>
                              Max {formatNumber(dis.nextDaysSummary.dayMax, lang)}°C, Min{' '}
                              {formatNumber(dis.nextDaysSummary.nightMin, lang)}°C, RH{' '}
                              {formatNumber(dis.nextDaysSummary.maxRh, lang)}%, Cloud{' '}
                              {formatNumber(dis.nextDaysSummary.cloud, lang)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Qualitative reason for brown spot / tungro */}
                    {isUnsupported && (
                      <div className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                        <p>{lang === 'bn' ? dis.reasonBn : dis.reasonEn}</p>
                        <span className="text-[10px] text-slate-500 font-medium block mt-1">
                          — {dis.citation}
                        </span>
                      </div>
                    )}

                    {/* Expandable Quote */}
                    {dis.sourceQuote && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleQuote(dis.id)}
                          className="min-h-[44px] text-[11px] font-semibold text-leaf-700 hover:text-leaf-800 underline flex items-center gap-1"
                        >
                          {expandedQuotes[dis.id]
                            ? t('weather.hideSourceQuote')
                            : t('weather.viewSourceQuote')}
                        </button>
                        {expandedQuotes[dis.id] && (
                          <div className="mt-1.5 p-2.5 rounded-xl bg-white border border-gray-200 text-xs space-y-1.5">
                            <blockquote className="italic text-gray-800 border-l-2 border-leaf-600 pl-2">
                              "{dis.sourceQuote}"
                            </blockquote>
                            {dis.sourceUrl && (
                              <a
                                href={dis.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block text-[11px] text-leaf-700 hover:text-leaf-800 underline font-semibold"
                              >
                                {t('weather.howItWorks')} ↗
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ======================================================== */}
          {/* 8. WHAT TO DO (ACTIONABLE ADVICE) */}
          {/* ======================================================== */}
          <section className="bg-white rounded-2xl p-5 border border-leaf-700/20 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>🛡️</span>
              <span>{t('weather.whatToDoTitle')}</span>
            </h2>

            <p className="text-xs text-gray-600 leading-relaxed font-medium">
              {t('weather.actionNote')}
            </p>

            <ul className="text-xs text-gray-800 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-leaf-700 font-bold">✓</span>
                <span>{t('weather.actionBlast')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-leaf-700 font-bold">✓</span>
                <span>{t('weather.actionSheath')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-leaf-700 font-bold">✓</span>
                <span>{t('weather.actionInspect')}</span>
              </li>
            </ul>

            {/* Strict Non-chemical & Helpline Box */}
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-300 text-xs text-amber-950 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-base select-none">☎️</span>
                <p className="font-semibold">{t('weather.chemicalWarning')}</p>
              </div>
            </div>

            {/* Leaf Scan Action Button */}
            <a
              href="#/"
              className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-xl bg-leaf-700 hover:bg-leaf-800 text-white shadow-sm transition"
            >
              <span>📷</span>
              <span>{t('weather.scanLeafAction')}</span>
            </a>
          </section>

          {/* ======================================================== */}
          {/* 9. SOURCES & ATTRIBUTION */}
          {/* ======================================================== */}
          <section className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs text-gray-600 space-y-2">
            <h2 className="font-bold text-gray-800 text-xs flex items-center gap-1">
              <span>📚</span>
              <span>{t('weather.sourcesTitle')}</span>
            </h2>
            <p className="leading-relaxed">
              • <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="text-leaf-700 underline font-semibold">Open-Meteo</a> (CC BY 4.0): {t('weather.openMeteoAttribution')}
            </p>
            <p className="leading-relaxed">
              • <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-leaf-700 underline font-semibold">OpenStreetMap & Nominatim</a> (ODbL 1.0): {t('weather.osmAttribution')}
            </p>
            <p className="leading-relaxed">
              • <a href="https://bamis.gov.bd" target="_blank" rel="noopener noreferrer" className="text-leaf-700 underline font-semibold">DAE BAMIS</a> & <a href="https://brri.gov.bd" target="_blank" rel="noopener noreferrer" className="text-leaf-700 underline font-semibold">BRRI</a>: {t('weather.agriSources')}
            </p>
          </section>

          {/* ======================================================== */}
          {/* 10. LIMITATIONS & UNCERTAINTY */}
          {/* ======================================================== */}
          <section className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-[11px] text-gray-500 space-y-1.5 leading-relaxed">
            <h2 className="font-bold text-gray-700 text-xs flex items-center gap-1">
              <span>ℹ️</span>
              <span>{t('weather.limitationsTitle')}</span>
            </h2>
            <p>• {t('weather.limitGrid')}</p>
            <p>• {t('weather.limitForecast')}</p>
            <p>• {t('weather.limitDistrictCal')}</p>
          </section>
        </>
      )}
    </div>
  );
}
