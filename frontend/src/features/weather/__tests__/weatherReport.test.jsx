import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { getDb, STORES, resetDbForTests, DB_NAME } from '../../../lib/store/db.js';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import { roundCoord, searchLocations, findNearestDistrict } from '../geoUtils.js';
import {
  getWeatherReportData,
  computePastSummary,
  computeForecastDays,
  evaluateAllDiseases,
  getWindCardinal,
  FRESH_TTL_MS,
  STALE_THRESHOLD_MS,
} from '../weatherReportStore.js';
import WeatherReportPage from '../WeatherReportPage.jsx';
import weatherTexts from '../i18n.js';

function renderMarkup(ui, lang = 'en') {
  return renderToString(<I18nProvider initialLang={lang}>{ui}</I18nProvider>);
}

beforeEach(async () => {
  await resetDbForTests();
  await new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB_NAME);
    r.onsuccess = r.onerror = r.onblocked = resolve;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('F8 v2 Privacy & Coordinate Rounding', () => {
  it('rounds any coordinate to at most 2 decimal places (~1 km precision)', () => {
    expect(roundCoord(23.8341940)).toBe(23.83);
    expect(roundCoord(90.2591560)).toBe(90.26);
    expect(roundCoord('23.8477000')).toBe(23.85);
    expect(roundCoord(null)).toBeNull();
    expect(roundCoord(undefined)).toBeNull();
    expect(roundCoord('invalid')).toBeNull();
  });

  it('guarantees that all fetch requests to Open-Meteo contain at most 2 decimal places in lat/lon', async () => {
    let capturedUrl = null;
    const fetchMock = vi.fn().mockImplementation(async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        json: async () => ({
          current: { time: '2026-11-03T12:00', temperature_2m: 28 },
          hourly: { time: [] },
          daily: { time: [] },
        }),
      };
    });

    const highPrecisionLocation = {
      lat: 23.834194038472,
      lon: 90.259156093847,
      name: 'High Precision Test',
    };

    await getWeatherReportData(highPrecisionLocation, { forceRefresh: true }, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const parsedUrl = new URL(capturedUrl);
    const latParam = parsedUrl.searchParams.get('latitude');
    const lonParam = parsedUrl.searchParams.get('longitude');

    expect(latParam).toBe('23.83');
    expect(lonParam).toBe('90.26');

    // Decimal places check: must be <= 2
    const latDecimals = (latParam.split('.')[1] || '').length;
    const lonDecimals = (lonParam.split('.')[1] || '').length;
    expect(latDecimals).toBeLessThanOrEqual(2);
    expect(lonDecimals).toBeLessThanOrEqual(2);
  });
});

describe('F8 v2 Geocoding & Search Fallback', () => {
  it('returns formatted results and rounds coordinates from proxy', async () => {
    const mockNominatimData = {
      results: [
        {
          name: 'Savar',
          display_name: 'Savar Upazila, Dhaka Division, Bangladesh',
          lat: '23.8485800',
          lon: '90.2500200',
          addresstype: 'subdistrict',
        },
      ],
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNominatimData,
    });

    const results = await searchLocations('Savar', fetchMock);
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Savar');
    expect(results[0].lat).toBe(23.85);
    expect(results[0].lon).toBe(90.25);
    expect(results[0].level).toBe('upazila');
  });

  it('falls back to local districts on proxy error (502 / 429 / offline)', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error (offline)'));

    const results = await searchLocations('Dhaka', fetchMock);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].displayName).toContain('Dhaka');
    expect(results[0].lat).toBe(23.79);
    expect(results[0].lon).toBe(90.21);
    expect(results[0].level).toBe('district');
  });

  it('returns empty array on empty or nonsense queries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });

    const emptyRes = await searchLocations('', fetchMock);
    expect(emptyRes).toEqual([]);

    const nonsenseRes = await searchLocations('xyzqwe999notaplace', fetchMock);
    expect(nonsenseRes).toEqual([]);
  });

  it('finds nearest district centroid accurately', () => {
    // Near Dhaka center
    const d = findNearestDistrict(23.80, 90.30);
    expect(d).not.toBeNull();
    expect(d.district_name_en).toBe('Dhaka');
  });
});

describe('F8 v2 Weather Report Store & Caching', () => {
  it('serves fresh data from IndexedDB cache within 60 minutes without refetching', async () => {
    const mockData = {
      current: { time: '2026-11-03T12:00', temperature_2m: 29.5, relative_humidity_2m: 85 },
      hourly: { time: ['2026-11-03T12:00'], temperature_2m: [29.5], relative_humidity_2m: [85] },
      daily: {
        time: ['2026-11-03'],
        temperature_2m_max: [31],
        temperature_2m_min: [22],
        precipitation_sum: [0],
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const loc = { lat: 23.85, lon: 90.25, name: 'Savar' };

    // 1st call -> network fetch
    const res1 = await getWeatherReportData(loc, {}, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res1.fromCache).toBe(false);

    // 2nd call within 60 min -> from cache
    const res2 = await getWeatherReportData(loc, {}, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res2.fromCache).toBe(true);
    expect(res2.isStale).toBe(false);

    // 3rd call with forceRefresh: true -> refetches
    const res3 = await getWeatherReportData(loc, { forceRefresh: true }, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(res3.fromCache).toBe(false);
  });

  it('serves stale cache and marks isStale: true if cached data is older than 3 hours', async () => {
    const db = await getDb();
    const fourHoursAgo = Date.now() - (4 * 60 * 60 * 1000);

    const oldEntry = {
      lat: 23.85,
      lon: 90.25,
      fetched_at: new Date(fourHoursAgo).toISOString(),
      expires_at: fourHoursAgo + FRESH_TTL_MS,
      stale_at: fourHoursAgo + STALE_THRESHOLD_MS,
      report: {
        lat: 23.85,
        lon: 90.25,
        locationName: 'Savar',
        current: { temp: 28 },
        forecastDays: [],
        diseaseEvaluations: [],
      },
    };

    await db.put(STORES.WEATHER, oldEntry, 'report_23.85_90.25');

    // Failing network call
    const failingFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    const loc = { lat: 23.85, lon: 90.25 };

    const res = await getWeatherReportData(loc, {}, failingFetch);
    expect(res).not.toBeNull();
    expect(res.fromCache).toBe(true);
    expect(res.isOffline).toBe(true);
    expect(res.isStale).toBe(true);
  });

  it('computes past summary (ERA5 reanalysis) and forecast days accurately', () => {
    const daily = {
      time: ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04'],
      temperature_2m_max: [30, 31, 29, 28, 27],
      temperature_2m_min: [20, 21, 19, 18, 17],
      precipitation_sum: [0, 5.2, 0, 1.0, 0],
      precipitation_probability_max: [10, 80, 20, 40, 10],
      wind_speed_10m_max: [12, 15, 10, 8, 9],
      wind_direction_10m_dominant: [340, 320, 310, 350, 330],
      sunshine_duration: [28800, 14400, 28800, 25200, 28800],
    };

    const hourly = {
      time: ['2026-11-01T12:00', '2026-11-02T12:00'],
      relative_humidity_2m: [80, 70],
    };

    const pastSummary = computePastSummary(daily, hourly, '2026-11-03');
    expect(pastSummary).not.toBeNull();
    expect(pastSummary.totalRainfall).toBe(5.2);
    expect(pastSummary.rainyDays).toBe(1);
    expect(pastSummary.minTemp).toBe(19);
    expect(pastSummary.maxTemp).toBe(31);
    expect(pastSummary.isReanalysis).toBe(true);

    const forecast = computeForecastDays(daily, '2026-11-03');
    expect(forecast.length).toBe(2);
    expect(forecast[0].date).toBe('2026-11-03');
    expect(forecast[0].minTemp).toBe(18);
    expect(forecast[0].maxTemp).toBe(28);
    expect(forecast[0].sunshineHours).toBe(7);
  });

  it('correctly uses the local place date for "today" at 00:30 Bangladesh time (18:30 UTC)', () => {
    // At 00:30 Bangladesh time on 4 Nov 2026, UTC is 18:30 on 3 Nov 2026.
    // Open-Meteo with timezone=auto returns data.current.time in local time: "2026-11-04T00:30"
    const daily = {
      time: ['2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06'],
      temperature_2m_min: [19, 20, 21, 22],
      temperature_2m_max: [29, 30, 31, 32],
      precipitation_sum: [0, 0, 5, 0],
      precipitation_probability_max: [10, 20, 80, 10],
      wind_speed_10m_max: [10, 12, 15, 10],
      wind_direction_10m_dominant: [90, 100, 110, 90],
      sunshine_duration: [28800, 28800, 14400, 28800],
    };

    const currentTimeLocal = '2026-11-04T00:30';
    const localTodayStr = currentTimeLocal.slice(0, 10);
    expect(localTodayStr).toBe('2026-11-04');

    const forecast = computeForecastDays(daily, localTodayStr);
    expect(forecast.length).toBe(3);
    // First forecast row MUST be local today (4 Nov), which UI maps to "আজ"
    expect(forecast[0].date).toBe('2026-11-04');
    expect(forecast[0].minTemp).toBe(20);
    expect(forecast[0].maxTemp).toBe(30);
  });
});

describe('F8 v2 Missing Variables & Formatting Honesty', () => {
  it('renders "Data not available" instead of "0" when weather variables are missing', () => {
    const incompleteReport = {
      lat: 23.85,
      lon: 90.25,
      locationName: 'Test Area',
      current: {
        temp: null, // missing!
        feelsLike: null,
        rh: null, // missing!
        precip: null,
        windSpeed: null,
        windDirection: null,
        cloudCover: null,
      },
      forecastDays: [],
      diseaseEvaluations: [],
    };

    const loc = { lat: 23.85, lon: 90.25, name: 'Test Area' };
    const htmlEn = renderMarkup(
      <WeatherReportPage initialLocation={loc} initialData={incompleteReport} />,
      'en'
    );

    expect(htmlEn).toContain('Data not available');
    expect(htmlEn).not.toContain('0 °C');
    expect(htmlEn).not.toContain('0%');

    const htmlBn = renderMarkup(
      <WeatherReportPage initialLocation={loc} initialData={incompleteReport} />,
      'bn'
    );
    expect(htmlBn).toContain('তথ্য পাওয়া যায়নি');
  });

  it('correctly maps wind degrees to cardinal words in BN and EN', () => {
    expect(getWindCardinal(0, 'en')).toBe('North');
    expect(getWindCardinal(0, 'bn')).toBe('উত্তর');
    expect(getWindCardinal(90, 'en')).toBe('East');
    expect(getWindCardinal(90, 'bn')).toBe('পূর্ব');
    expect(getWindCardinal(225, 'en')).toBe('South-West');
    expect(getWindCardinal(225, 'bn')).toBe('দক্ষিণ-পশ্চিম');
    expect(getWindCardinal(315, 'en')).toBe('North-West');
    expect(getWindCardinal(315, 'bn')).toBe('উত্তর-পশ্চিম');
    expect(getWindCardinal(null, 'en')).toBe('Unknown');
  });
});

describe('F8 v2 Disease Rules & Honest Gaps', () => {
  it('evaluates all 5 diseases and marks Brown Spot & Tungro as qualitative advisories without fake numbers', () => {
    const hourly = {
      time: ['2026-11-03T12:00'],
      temperature_2m: [28],
      relative_humidity_2m: [85],
      cloud_cover: [50],
      precipitation: [0],
    };

    const evals = evaluateAllDiseases(hourly, '2026-11-03');
    expect(evals.length).toBe(5);

    const brownSpot = evals.find((d) => d.id === 'brown_spot');
    expect(brownSpot).toBeDefined();
    expect(brownSpot.isFavourable).toBeNull();
    expect(brownSpot.isUnsupported).toBe(true);
    expect(brownSpot.reasonEn).toContain('No validated weather-only threshold');

    const tungro = evals.find((d) => d.id === 'tungro');
    expect(tungro).toBeDefined();
    expect(tungro.isFavourable).toBeNull();
    expect(tungro.isUnsupported).toBe(true);
    expect(tungro.reasonEn).toContain('transmitted by the Green Leafhopper');
  });
});

describe('F8 v2 Chemical Dose & Treatment Prohibition', () => {
  it('strictly contains ZERO pesticide names, chemical doses, or mixing ratios in i18n texts', () => {
    const doseRegex = /\d+\s*(ml|g|গ্রাম|লিটার|L|%\/লিটার|মিগ্রা|mg)\b/i;

    for (const [lang, table] of Object.entries(weatherTexts)) {
      for (const [key, text] of Object.entries(table)) {
        const match = doseRegex.exec(text);
        if (match) {
          throw new Error(
            `Chemical dose violation in ${lang}.${key}: found "${match[0]}". Full text: "${text}"`
          );
        }
        expect(text).not.toMatch(/\b(কার্বেনডাজিম|ম্যানকোজেব|কার্বোফিউরান|হেক্সাকোনাজল|Carbendazim|Mancozeb|Hexaconazole)\b/i);
      }
    }
  });

  it('guarantees all keys start with "weather." and exist symmetrically in bn and en', () => {
    const bnKeys = Object.keys(weatherTexts.bn).sort();
    const enKeys = Object.keys(weatherTexts.en).sort();

    expect(bnKeys).toEqual(enKeys);
    for (const key of bnKeys) {
      expect(key.startsWith('weather.')).toBe(true);
    }
  });
});
