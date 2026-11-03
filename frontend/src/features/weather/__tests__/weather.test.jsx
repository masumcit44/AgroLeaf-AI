import 'fake-indexeddb/auto';
import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { getDb, STORES, resetDbForTests, DB_NAME } from '../../../lib/store/db.js';
import { I18nProvider } from '../../../i18n/I18nProvider.jsx';
import { groupHourlyByDay, isDayFavourable, evaluateWeatherRules } from '../weatherRules.js';
import { getProfileLocation, getWeatherData, CACHE_KEY } from '../weatherStore.js';
import { WeatherChips } from '../index.jsx';

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

// Helper to generate 24 hourly timestamps for day N (0, 1, 2)
function makeDayHourly(dayOffset = 0, { dayTemp = 28, nightTemp = 18, rh = 92, cloud = 60, precip = 0 } = {}) {
  const times = [];
  const temps = [];
  const rhs = [];
  const clouds = [];
  const precips = [];

  const baseDate = new Date(2026, 10, 3 + dayOffset);
  const dateStr = baseDate.toISOString().slice(0, 10);

  for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    times.push(`${dateStr}T${hh}:00`);
    const isDay = h >= 7 && h <= 18;
    temps.push(isDay ? dayTemp : nightTemp);
    rhs.push(rh);
    clouds.push(cloud);
    precips.push(precip);
  }

  return { times, temps, rhs, clouds, precips };
}

describe('F8 weatherRules engine', () => {
  it('groups hourly series into day summaries', () => {
    const day0 = makeDayHourly(0, { dayTemp: 28, nightTemp: 18, rh: 95, cloud: 70 });
    const hourly = {
      time: day0.times,
      temperature_2m: day0.temps,
      relative_humidity_2m: day0.rhs,
      cloud_cover: day0.clouds,
      precipitation: day0.precips,
    };

    const days = groupHourlyByDay(hourly);
    expect(days.length).toBe(1);
    expect(days[0].dayMaxTemp).toBe(28);
    expect(days[0].nightMinTemp).toBe(18);
    expect(days[0].maxRh).toBe(95);
    expect(days[0].meanCloud).toBe(70);
  });

  it('detects favourable conditions for blast based on BAMIS rule', () => {
    // Blast rule: Night 16-20°C, Day 25-30°C, RH > 90%, cloudy (cloud >= 50%)
    const day = {
      date: '2026-11-03',
      dayMinTemp: 26,
      dayMaxTemp: 29,
      nightMinTemp: 17,
      nightMaxTemp: 19,
      maxRh: 94,
      meanCloud: 65,
      minTemp: 17,
      maxTemp: 29,
    };

    expect(isDayFavourable(day, 'blast')).toBe(true);
    expect(isDayFavourable(day, 'sheath_blight')).toBe(false);
  });

  it('returns false for blast when night temperature is too cold (<16°C)', () => {
    const day = {
      date: '2026-11-03',
      dayMinTemp: 26,
      dayMaxTemp: 29,
      nightMinTemp: 12,
      nightMaxTemp: 14,
      maxRh: 94,
      meanCloud: 65,
      minTemp: 12,
      maxTemp: 29,
    };

    expect(isDayFavourable(day, 'blast')).toBe(false);
  });

  it('detects favourable conditions for sheath blight (28-32°C, RH >= 80%, cloudy)', () => {
    const day = {
      date: '2026-11-03',
      minTemp: 28,
      maxTemp: 31,
      maxRh: 88,
      meanCloud: 55,
      dayMaxTemp: 31,
      dayMinTemp: 29,
      nightMinTemp: 28,
      nightMaxTemp: 29,
    };

    expect(isDayFavourable(day, 'sheath_blight')).toBe(true);
  });

  it('evaluates 3-day series and returns matching rules', () => {
    const d0 = makeDayHourly(0, { dayTemp: 28, nightTemp: 18, rh: 95, cloud: 60 });
    const d1 = makeDayHourly(1, { dayTemp: 30, nightTemp: 28, rh: 85, cloud: 55 });
    const d2 = makeDayHourly(2, { dayTemp: 20, nightTemp: 10, rh: 50, cloud: 10 });

    const hourly = {
      time: [...d0.times, ...d1.times, ...d2.times],
      temperature_2m: [...d0.temps, ...d1.temps, ...d2.temps],
      relative_humidity_2m: [...d0.rhs, ...d1.rhs, ...d2.rhs],
      cloud_cover: [...d0.clouds, ...d1.clouds, ...d2.clouds],
      precipitation: [...d0.precips, ...d1.precips, ...d2.precips],
    };

    const rules = evaluateWeatherRules(hourly);
    const ruleIds = rules.map((r) => r.ruleId);
    expect(ruleIds).toContain('blast');
    expect(ruleIds).toContain('sheath_blight');
  });

  it('returns empty array when weather data is missing or empty', () => {
    expect(evaluateWeatherRules(null)).toEqual([]);
    expect(evaluateWeatherRules({})).toEqual([]);
    expect(evaluateWeatherRules({ time: [] })).toEqual([]);
  });
});

describe('F8 weatherStore & cache', () => {
  it('returns null if profile location is missing', async () => {
    const loc = await getProfileLocation();
    expect(loc).toBeNull();
  });

  it('retrieves saved location from STORES.PROFILE', async () => {
    const db = await getDb();
    await db.put(
      STORES.PROFILE,
      {
        district_name_en: 'Dhaka',
        district_name_bn: 'ঢাকা',
        lat: 23.71,
        lon: 90.41,
      },
      'self'
    );

    const loc = await getProfileLocation();
    expect(loc).toEqual({
      district_code: null,
      district_name_en: 'Dhaka',
      district_name_bn: 'ঢাকা',
      lat: 23.71,
      lon: 90.41,
    });
  });

  it('fetches Open-Meteo forecast and caches in STORES.WEATHER for 3 hours', async () => {
    const d0 = makeDayHourly(0);
    const mockPayload = {
      hourly: {
        time: d0.times,
        temperature_2m: d0.temps,
        relative_humidity_2m: d0.rhs,
        cloud_cover: d0.clouds,
        precipitation: d0.precips,
      },
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPayload,
    });

    const loc = { lat: 23.71, lon: 90.41, district_name_en: 'Dhaka', district_name_bn: 'ঢাকা' };
    const res = await getWeatherData(loc, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.isOffline).toBe(false);
    expect(res.fromCache).toBe(false);

    // Second call should hit the cache without calling fetch
    const res2 = await getWeatherData(loc, fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res2.fromCache).toBe(true);

    // Check DB directly
    const db = await getDb();
    const stored = await db.get(STORES.WEATHER, CACHE_KEY);
    expect(stored.lat).toBe(23.71);
    expect(stored.hourly.time.length).toBe(24);
  });

  it('serves stale cache when network fetch fails (offline mode)', async () => {
    const db = await getDb();
    const d0 = makeDayHourly(0);
    await db.put(
      STORES.WEATHER,
      {
        lat: 23.71,
        lon: 90.41,
        district_name_en: 'Dhaka',
        district_name_bn: 'ঢাকা',
        fetched_at: '2026-11-03T06:00:00.000Z',
        expires_at: Date.now() - 1000,
        hourly: {
          time: d0.times,
          temperature_2m: d0.temps,
          relative_humidity_2m: d0.rhs,
          cloud_cover: d0.clouds,
          precipitation: d0.precips,
        },
      },
      CACHE_KEY
    );

    const failingFetch = vi.fn().mockRejectedValue(new Error('Network error (offline)'));
    const loc = { lat: 23.71, lon: 90.41 };
    const res = await getWeatherData(loc, failingFetch);

    expect(res).not.toBeNull();
    expect(res.isOffline).toBe(true);
    expect(res.fromCache).toBe(true);
  });
});

describe('F8 WeatherChips UI Component', () => {
  it('renders "Set your area to see weather" when no profile exists', () => {
    const htmlEn = renderMarkup(<WeatherChips scan={null} context="home" initialLocation={null} />, 'en');
    expect(htmlEn).toContain('href="#/profile"');
    expect(htmlEn).toContain('Set your area to see weather');

    const htmlBn = renderMarkup(<WeatherChips scan={null} context="home" initialLocation={null} />, 'bn');
    expect(htmlBn).toContain('href="#/profile"');
    expect(htmlBn).toContain('আবহাওয়া ও রোগ সতর্কতা দেখতে আপনার এলাকা নির্বাচন করুন');
  });

  it('renders favourable disease chip and attribution on home screen', () => {
    const d0 = makeDayHourly(0, { dayTemp: 28, nightTemp: 18, rh: 95, cloud: 70 });
    const weather = {
      isOffline: false,
      hourly: {
        time: d0.times,
        temperature_2m: d0.temps,
        relative_humidity_2m: d0.rhs,
        cloud_cover: d0.clouds,
        precipitation: d0.precips,
      },
    };

    const loc = { lat: 23.71, lon: 90.41, district_name_en: 'Dhaka', district_name_bn: 'ঢাকা' };
    const htmlEn = renderMarkup(
      <WeatherChips scan={null} context="home" initialLocation={loc} initialWeather={weather} />,
      'en'
    );

    expect(htmlEn).toContain('Weather favourable for blast — check your field');
    expect(htmlEn).toContain('Weather data by Open-Meteo.com (CC BY 4.0)');
    expect(htmlEn).toContain('https://www.bamis.gov.bd/');

    const htmlBn = renderMarkup(
      <WeatherChips scan={null} context="home" initialLocation={loc} initialWeather={weather} />,
      'bn'
    );
    expect(htmlBn).toContain('ব্লাস্ট রোগের জন্য অনুকূল আবহাওয়া — জমি পর্যবেক্ষণ করুন');
    expect(htmlBn).toContain('Weather data by Open-Meteo.com (CC BY 4.0)');
  });

  it('on result screen: only shows chip if diagnosed disease matches favourable condition', () => {
    const d0 = makeDayHourly(0, { dayTemp: 28, nightTemp: 18, rh: 95, cloud: 70 });
    const weather = {
      isOffline: false,
      hourly: {
        time: d0.times,
        temperature_2m: d0.temps,
        relative_humidity_2m: d0.rhs,
        cloud_cover: d0.clouds,
        precipitation: d0.precips,
      },
    };
    const loc = { lat: 23.71, lon: 90.41, district_name_en: 'Dhaka' };

    // 1. Diagnosed with 'blast' (favourable) -> renders chip
    const blastScan = { classKey: 'blast', decision: { status: 'confident' } };
    const htmlBlast = renderMarkup(
      <WeatherChips scan={blastScan} context="result" initialLocation={loc} initialWeather={weather} />
    );
    expect(htmlBlast).toContain('Weather favourable for blast — check your field');
    expect(htmlBlast).toContain('https://www.bamis.gov.bd/');

    // 2. Diagnosed with 'tungro' (unsupported by weather rules) -> renders nothing
    const tungroScan = { classKey: 'tungro', decision: { status: 'confident' } };
    const htmlTungro = renderMarkup(
      <WeatherChips scan={tungroScan} context="result" initialLocation={loc} initialWeather={weather} />
    );
    expect(htmlTungro).toBe('');
  });
});
