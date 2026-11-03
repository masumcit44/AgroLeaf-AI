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
function makeDayHourly(dayOffset = 0, { dayTemp = 29, nightTemp = 18, rh = 92, cloud = 60, precip = 0 } = {}) {
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
    precips.push(precip / 24);
  }

  return { times, temps, rhs, clouds, precips };
}

describe('F8 weatherRules engine', () => {
  it('groups hourly series into day summaries with duration counts', () => {
    const day0 = makeDayHourly(0, { dayTemp: 29, nightTemp: 18, rh: 95, cloud: 70, precip: 36 });
    const hourly = {
      time: day0.times,
      temperature_2m: day0.temps,
      relative_humidity_2m: day0.rhs,
      cloud_cover: day0.clouds,
      precipitation: day0.precips,
    };

    const days = groupHourlyByDay(hourly);
    expect(days.length).toBe(1);
    expect(days[0].dayMaxTemp).toBe(29);
    expect(days[0].nightMinTemp).toBe(18);
    expect(days[0].nightRangeHours).toBe(12);
    expect(days[0].dayRangeHours).toBe(12);
    expect(days[0].diurnalRange).toBe(11);
    expect(days[0].maxRh).toBe(95);
    expect(days[0].meanCloud).toBe(70);
    expect(Math.round(days[0].totalPrecip)).toBe(36);
  });

  it('detects favourable conditions for blast based on exact BAMIS quote', () => {
    // Quote: "Blast Night temperature 16-20oC, for 7.30 hours day temperature 25-30oC, for 7.30 hours day night temperature >10oC Relative Humidity >90%, cloudy weather"
    const day = {
      date: '2026-11-03',
      dayMinTemp: 26,
      dayMaxTemp: 29,
      nightMinTemp: 17,
      nightMaxTemp: 19,
      nightRangeHours: 9,
      dayRangeHours: 10,
      diurnalRange: 12,
      maxRh: 94,
      meanCloud: 65,
    };

    expect(isDayFavourable(day, 'blast')).toBe(true);
    expect(isDayFavourable(day, 'sheath_blight')).toBe(false);
  });

  it('rejects blast when diurnal temperature difference is <= 10°C', () => {
    const day = {
      date: '2026-11-03',
      dayMinTemp: 25,
      dayMaxTemp: 27,
      nightMinTemp: 18,
      nightMaxTemp: 19,
      nightRangeHours: 9,
      dayRangeHours: 10,
      diurnalRange: 9, // <= 10°C
      maxRh: 94,
      meanCloud: 65,
    };

    expect(isDayFavourable(day, 'blast')).toBe(false);
  });

  it('rejects blast when night temperature duration is insufficient (<7 hours)', () => {
    const day = {
      date: '2026-11-03',
      dayMinTemp: 26,
      dayMaxTemp: 29,
      nightMinTemp: 17,
      nightMaxTemp: 19,
      nightRangeHours: 4, // < 7 hours
      dayRangeHours: 10,
      diurnalRange: 12,
      maxRh: 94,
      meanCloud: 65,
    };

    expect(isDayFavourable(day, 'blast')).toBe(false);
  });

  it('detects favourable conditions for sheath blight (28-32°C, RH >= 80%, cloudy)', () => {
    const day = {
      date: '2026-11-03',
      minTemp: 28,
      maxTemp: 31,
      dayMaxTemp: 31,
      maxRh: 88,
      meanCloud: 55,
    };

    expect(isDayFavourable(day, 'sheath_blight')).toBe(true);
  });

  it('detects favourable conditions for bacterial leaf blight (28-30°C, RH 80-90%, rain >= 30mm, cloudy)', () => {
    const day = {
      date: '2026-11-03',
      minTemp: 28,
      maxTemp: 29,
      dayMaxTemp: 29,
      maxRh: 85,
      meanCloud: 65,
      totalPrecip: 35, // > 30mm
    };

    expect(isDayFavourable(day, 'bacterial_leaf_blight')).toBe(true);
  });

  it('must NOT trigger bacterial leaf blight at 31°C (temp_max is 30°C)', () => {
    const dayAt31 = {
      date: '2026-11-03',
      minTemp: 28,
      maxTemp: 31,
      dayMaxTemp: 31, // Exceeds 30°C ceiling
      maxRh: 85,
      meanCloud: 65,
      totalPrecip: 35,
    };

    expect(isDayFavourable(dayAt31, 'bacterial_leaf_blight')).toBe(false);
  });

  it('must NOT trigger bacterial leaf blight when rainfall is missing or < 30mm', () => {
    // Missing rain case
    const dayNoRain = {
      date: '2026-11-03',
      minTemp: 28,
      maxTemp: 29,
      dayMaxTemp: 29,
      maxRh: 85,
      meanCloud: 65,
      totalPrecip: 0,
    };
    expect(isDayFavourable(dayNoRain, 'bacterial_leaf_blight')).toBe(false);

    // Rain below 30mm threshold
    const dayLowRain = {
      date: '2026-11-03',
      minTemp: 28,
      maxTemp: 29,
      dayMaxTemp: 29,
      maxRh: 85,
      meanCloud: 65,
      totalPrecip: 18,
    };
    expect(isDayFavourable(dayLowRain, 'bacterial_leaf_blight')).toBe(false);
  });

  it('must NOT trigger bacterial leaf blight when RH exceeds 90% (range is 80-90%)', () => {
    const dayHighRh = {
      date: '2026-11-03',
      minTemp: 28,
      maxTemp: 29,
      dayMaxTemp: 29,
      maxRh: 96, // Exceeds 90%
      meanCloud: 65,
      totalPrecip: 35,
    };
    expect(isDayFavourable(dayHighRh, 'bacterial_leaf_blight')).toBe(false);
  });

  it('evaluates 3-day series and returns matching rules with assumptions', () => {
    // Day 0: Blast conditions (day 29, night 18, RH 95, cloud 60)
    const d0 = makeDayHourly(0, { dayTemp: 29, nightTemp: 18, rh: 95, cloud: 60 });
    // Day 1: Sheath blight conditions (day 30, night 28, RH 85, cloud 55)
    const d1 = makeDayHourly(1, { dayTemp: 30, nightTemp: 28, rh: 85, cloud: 55 });
    // Day 2: Cold/dry day (no disease)
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
    expect(rules[0].assumptions.length).toBeGreaterThan(0);
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

  it('renders favourable disease chip, How this works PDF link, and attribution on home screen', () => {
    const d0 = makeDayHourly(0, { dayTemp: 29, nightTemp: 18, rh: 95, cloud: 70 });
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

    expect(htmlEn).toContain('favourable conditions — check your field');
    expect(htmlEn).toContain('Blast: favourable conditions — check your field');
    expect(htmlEn).toContain('How this works (BAMIS PDF)');
    expect(htmlEn).toContain('https://bamis.gov.bd/res/public/calendars/2019/08/23/5102.pdf');
    expect(htmlEn).toContain('Weather data by Open-Meteo.com (CC BY 4.0)');
    expect(htmlEn).toContain('https://www.bamis.gov.bd/');

    const htmlBn = renderMarkup(
      <WeatherChips scan={null} context="home" initialLocation={loc} initialWeather={weather} />,
      'bn'
    );
    expect(htmlBn).toContain('অনুকূল আবহাওয়া — জমি পর্যবেক্ষণ করুন');
    expect(htmlBn).toContain('ব্লাস্ট: অনুকূল আবহাওয়া — জমি পর্যবেক্ষণ করুন');
    expect(htmlBn).toContain('কীভাবে কাজ করে (বামিস পিডিএফ)');
    expect(htmlBn).toContain('Weather data by Open-Meteo.com (CC BY 4.0)');
  });

  it('on result screen: only shows chip if diagnosed disease matches favourable condition', () => {
    const d0 = makeDayHourly(0, { dayTemp: 29, nightTemp: 18, rh: 95, cloud: 70 });
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

    // 1. Diagnosed with 'blast' (favourable) -> renders chip and PDF link
    const blastScan = { classKey: 'blast', decision: { status: 'confident' } };
    const htmlBlast = renderMarkup(
      <WeatherChips scan={blastScan} context="result" initialLocation={loc} initialWeather={weather} />
    );
    expect(htmlBlast).toContain('Blast: favourable conditions — check your field');
    expect(htmlBlast).toContain('https://bamis.gov.bd/res/public/calendars/2019/08/23/5102.pdf');
    expect(htmlBlast).toContain('https://www.bamis.gov.bd/');

    // 2. Diagnosed with 'tungro' (unsupported by weather rules) -> renders nothing
    const tungroScan = { classKey: 'tungro', decision: { status: 'confident' } };
    const htmlTungro = renderMarkup(
      <WeatherChips scan={tungroScan} context="result" initialLocation={loc} initialWeather={weather} />
    );
    expect(htmlTungro).toBe('');

    // 3. Diagnosed with 'other_rice' while bacterial_leaf_blight is favourable -> renders nothing
    // bacterial_leaf_blight is home-screen only; the app never names it on the result screen.
    const otherRiceScan = { classKey: 'other_rice', decision: { status: 'confident' } };
    const htmlOtherRice = renderMarkup(
      <WeatherChips scan={otherRiceScan} context="result" initialLocation={loc} initialWeather={weather} />
    );
    expect(htmlOtherRice).not.toContain('Bacterial leaf blight');
    expect(htmlOtherRice).not.toContain('ব্যাকটেরিয়াজনিত পাতা পোড়া');
  });
});
