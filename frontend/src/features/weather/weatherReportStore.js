// Weather Report Store & Engine for F8 v2.
// Open-Meteo forecast API (free non-commercial, CC BY 4.0).
// Client-side caching in IndexedDB STORES.WEATHER ('weather_cache').
// Privacy guarantee: All coordinates rounded to <= 2 decimals before any network request or storage.

import { getDb, STORES } from '../../lib/store/db.js';
import { roundCoord } from './geoUtils.js';
import { groupHourlyByDay, isDayFavourable } from './weatherRules.js';
import rulesData from '../../../../disease_knowledge/weather_rules.json';

export const FRESH_TTL_MS = 60 * 60 * 1000; // 60 minutes
export const STALE_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 hours

/**
 * Convert wind direction degrees into 8-point cardinal direction.
 */
export function getWindCardinal(degrees, lang = 'bn') {
  if (degrees == null || isNaN(degrees)) return lang === 'bn' ? 'অজানা' : 'Unknown';
  const val = Math.floor((degrees / 45) + 0.5) % 8;
  const directions = [
    { bn: 'উত্তর', en: 'North' },
    { bn: 'উত্তর-পূর্ব', en: 'North-East' },
    { bn: 'পূর্ব', en: 'East' },
    { bn: 'দক্ষিণ-পূর্ব', en: 'South-East' },
    { bn: 'দক্ষিণ', en: 'South' },
    { bn: 'দক্ষিণ-পশ্চিম', en: 'South-West' },
    { bn: 'পশ্চিম', en: 'West' },
    { bn: 'উত্তর-পশ্চিম', en: 'North-West' },
  ];
  return directions[val]?.[lang] || directions[val]?.en || 'North';
}

/**
 * Summarize past 7 days (ERA5 Reanalysis) from Open-Meteo daily and hourly series.
 */
export function computePastSummary(daily, hourly, todayStr) {
  if (!daily || !Array.isArray(daily.time)) return null;

  const pastIndices = [];
  for (let i = 0; i < daily.time.length; i++) {
    if (daily.time[i] < todayStr) {
      pastIndices.push(i);
    }
  }

  // Take the most recent 7 past days
  const recent7 = pastIndices.slice(-7);
  if (recent7.length === 0) return null;

  let totalRain = 0;
  let rainyDays = 0;
  let minTemp = Infinity;
  let maxTemp = -Infinity;

  for (const idx of recent7) {
    const r = daily.precipitation_sum?.[idx] ?? 0;
    totalRain += r;
    if (r >= 1.0) rainyDays++;

    const tMin = daily.temperature_2m_min?.[idx];
    const tMax = daily.temperature_2m_max?.[idx];
    if (tMin != null && tMin < minTemp) minTemp = tMin;
    if (tMax != null && tMax > maxTemp) maxTemp = tMax;
  }

  // Calculate mean RH over past 7 days from hourly
  let rhSum = 0;
  let rhCount = 0;
  if (hourly && Array.isArray(hourly.time) && Array.isArray(hourly.relative_humidity_2m)) {
    for (let i = 0; i < hourly.time.length; i++) {
      const d = hourly.time[i].slice(0, 10);
      if (d < todayStr && d >= daily.time[recent7[0]]) {
        const rh = hourly.relative_humidity_2m[i];
        if (rh != null) {
          rhSum += rh;
          rhCount++;
        }
      }
    }
  }

  return {
    daysCount: recent7.length,
    startDate: daily.time[recent7[0]],
    endDate: daily.time[recent7[recent7.length - 1]],
    totalRainfall: Math.round(totalRain * 10) / 10,
    rainyDays,
    minTemp: minTemp === Infinity ? null : Math.round(minTemp * 10) / 10,
    maxTemp: maxTemp === -Infinity ? null : Math.round(maxTemp * 10) / 10,
    meanRh: rhCount > 0 ? Math.round(rhSum / rhCount) : null,
    isReanalysis: true,
  };
}

/**
 * Format daily forecast rows for next 7 days (today + 6 days).
 */
export function computeForecastDays(daily, todayStr) {
  if (!daily || !Array.isArray(daily.time)) return [];

  const rows = [];
  for (let i = 0; i < daily.time.length; i++) {
    const d = daily.time[i];
    if (d >= todayStr && rows.length < 7) {
      rows.push({
        date: d,
        minTemp: daily.temperature_2m_min?.[i],
        maxTemp: daily.temperature_2m_max?.[i],
        precipSum: daily.precipitation_sum?.[i] ?? 0,
        precipProb: daily.precipitation_probability_max?.[i] ?? null,
        windSpeedMax: daily.wind_speed_10m_max?.[i],
        windDirection: daily.wind_direction_10m_dominant?.[i],
        sunshineHours: daily.sunshine_duration?.[i] != null
          ? Math.round((daily.sunshine_duration[i] / 3600) * 10) / 10
          : null,
      });
    }
  }
  return rows;
}

/**
 * Evaluate all 5 diseases (blast, sheath_blight, bacterial_leaf_blight, brown_spot, tungro)
 * against next 7-day forecast.
 */
export function evaluateAllDiseases(hourly, todayStr) {
  const days = groupHourlyByDay(hourly).filter((d) => d.date >= todayStr).slice(0, 7);

  const results = [];

  // 1. Blast
  const blastDays = days.filter((d) => isDayFavourable(d, 'blast'));
  const blastRule = rulesData.rules.find((r) => r.id === 'blast');
  results.push({
    id: 'blast',
    diseaseKey: 'blast',
    nameBn: 'ব্লাস্ট রোগ',
    nameEn: 'Rice Blast',
    isFavourable: blastDays.length > 0,
    favourableDaysCount: blastDays.length,
    matchingDates: blastDays.map((d) => d.date),
    sourceUrl: blastRule?.source_url,
    sourceQuote: blastRule?.source_quote,
    ruleSummaryEn: 'Night 16-20°C (≥7.5h), Day 25-30°C (≥7.5h), Diurnal diff >10°C, RH ≥90%, Cloudy',
    ruleSummaryBn: 'রাতের তাপমাত্রা ১৬-২০°সে (≥৭.৫ ঘণ্টা), দিনের ২৫-৩০°সে, দিন-রাতের পার্থক্য >১০°সে, আর্দ্রতা ≥৯০%, মেঘলা আকাশ',
    nextDaysSummary: days[0]
      ? {
          nightMin: days[0].nightMinTemp,
          dayMax: days[0].dayMaxTemp,
          diurnal: days[0].diurnalRange,
          maxRh: days[0].maxRh,
          cloud: Math.round(days[0].meanCloud ?? 0),
        }
      : null,
  });

  // 2. Sheath Blight
  const sheathDays = days.filter((d) => isDayFavourable(d, 'sheath_blight'));
  const sheathRule = rulesData.rules.find((r) => r.id === 'sheath_blight');
  results.push({
    id: 'sheath_blight',
    diseaseKey: 'sheath_blight',
    nameBn: 'খোল পোড়া রোগ (শীথ ব্লাইট)',
    nameEn: 'Sheath Blight',
    isFavourable: sheathDays.length > 0,
    favourableDaysCount: sheathDays.length,
    matchingDates: sheathDays.map((d) => d.date),
    sourceUrl: sheathRule?.source_url,
    sourceQuote: sheathRule?.source_quote,
    ruleSummaryEn: 'Temperature 28-32°C, Night min ≥22°C, RH ≥80%, Cloudy',
    ruleSummaryBn: 'তাপমাত্রা ২৮-৩২°সে, রাতের সর্বনিম্ন ≥২২°সে, আপেক্ষিক আর্দ্রতা ≥৮০%, মেঘলা আবহাওয়া',
    nextDaysSummary: days[0]
      ? {
          dayMax: days[0].dayMaxTemp,
          nightMin: days[0].nightMinTemp,
          maxRh: days[0].maxRh,
          cloud: Math.round(days[0].meanCloud ?? 0),
        }
      : null,
  });

  // 3. Bacterial Leaf Blight
  const blbDays = days.filter((d) => isDayFavourable(d, 'bacterial_leaf_blight'));
  const blbRule = rulesData.rules.find((r) => r.id === 'bacterial_leaf_blight');
  results.push({
    id: 'bacterial_leaf_blight',
    diseaseKey: 'bacterial_leaf_blight',
    nameBn: 'ব্যাকটেরিয়াজনিত পাতা পোড়া',
    nameEn: 'Bacterial Leaf Blight',
    isFavourable: blbDays.length > 0,
    favourableDaysCount: blbDays.length,
    matchingDates: blbDays.map((d) => d.date),
    sourceUrl: blbRule?.source_url,
    sourceQuote: blbRule?.source_quote,
    ruleSummaryEn: 'Temperature 28-30°C, Night min ≥22°C, RH 80-90%, Rain >30mm/24h, Cloudy',
    ruleSummaryBn: 'তাপমাত্রা ২৮-৩০°সে, রাতের সর্বনিম্ন ≥২২°সে, আর্দ্রতা ৮০-৯০%, বৃষ্টিপাত >৩০ মিমি, মেঘলা',
    nextDaysSummary: days[0]
      ? {
          dayMax: days[0].dayMaxTemp,
          nightMin: days[0].nightMinTemp,
          maxRh: days[0].maxRh,
          rain: Math.round(days[0].totalPrecip ?? 0),
          cloud: Math.round(days[0].meanCloud ?? 0),
        }
      : null,
  });

  // 4. Brown Spot (Qualitative only - no fake weather score)
  results.push({
    id: 'brown_spot',
    diseaseKey: 'brown_spot',
    nameBn: 'বাদামী দাগ রোগ (ব্রাউন স্পট)',
    nameEn: 'Brown Spot',
    isFavourable: null, // No validated weather rule
    isUnsupported: true,
    reasonBn: 'কোনো সরাসরি আবহাওয়া নিয়ম নেই। এটি মূলত সুষম সারের অভাব (বিশেষ করে পটাশিয়াম/নাইট্রোজেন ঘাটতি) ও মাটির শুষ্কতা বা খরা পীড়নের কারণে বৃদ্ধি পায়।',
    reasonEn: 'No validated weather-only threshold. Brown spot is primarily driven by nutrient stress (potassium/nitrogen deficiency) and dry/unfavourable soil conditions.',
    citation: 'IRRI Rice Knowledge Bank & BRRI Adhunik Dhaner Chash (2020)',
  });

  // 5. Tungro (Vector driven - no fake weather score)
  results.push({
    id: 'tungro',
    diseaseKey: 'tungro',
    nameBn: 'টুংরো রোগ',
    nameEn: 'Rice Tungro Disease',
    isFavourable: null, // Insect vector driven
    isUnsupported: true,
    reasonBn: 'টুংরো একটি ভাইরাসজনিত রোগ যা সবুজ পাতাফড়িং (GLH)-এর মাধ্যমে সংক্রমিত হয়। আবহাওয়া সরাসরি রোগ সৃষ্টি করে না; জমিতে পাতাফড়িংয়ের উপস্থিতি লক্ষ্য করুন।',
    reasonEn: 'Tungro is a viral complex transmitted by the Green Leafhopper (GLH). Weather does not infect rice directly; monitor fields for insect vectors.',
    citation: 'BRRI Adhunik Dhaner Chash (2020) & DAE BAMIS',
  });

  return results;
}

/**
 * Primary data fetcher for the full Weather & Crop Analysis report.
 * Uses 60-minute fresh cache, with 3-hour stale fallback.
 */
export async function getWeatherReportData(location, options = {}, fetchFn = globalThis.fetch) {
  if (!location || location.lat == null || location.lon == null) {
    return null;
  }

  // Strict coordinate rounding to 2 decimals (~1 km)
  const lat = roundCoord(location.lat);
  const lon = roundCoord(location.lon);
  const cacheKey = `report_${lat.toFixed(2)}_${lon.toFixed(2)}`;

  const db = await getDb();
  let cached = null;
  try {
    cached = await db.get(STORES.WEATHER, cacheKey);
  } catch {
    cached = null;
  }

  const now = Date.now();
  const isFresh = cached && cached.expires_at > now && !options.forceRefresh;

  if (isFresh && cached.report) {
    return {
      ...cached.report,
      fetched_at: cached.fetched_at,
      fromCache: true,
      isStale: false,
      isOffline: false,
    };
  }

  // Open-Meteo URL with past 7 days and next 7 days
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,wind_speed_10m,wind_direction_10m,cloud_cover` +
    `&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,sunshine_duration` +
    `&past_days=7&forecast_days=7&timezone=auto`;

  try {
    const res = await fetchFn(url);
    if (!res.ok) {
      throw new Error(`Open-Meteo responded with status ${res.status}`);
    }
    const data = await res.json();
    if (!data.daily || !data.hourly || !data.current) {
      throw new Error('Incomplete Open-Meteo payload');
    }

    // "Today" in the place's own time zone (timezone=auto): a UTC date is still yesterday in
    // Bangladesh until 06:00, which shifted every forecast row by one day.
    const todayStr = typeof data.current.time === 'string'
      ? data.current.time.slice(0, 10)
      : new Date(now).toLocaleDateString('en-CA');
    const pastSummary = computePastSummary(data.daily, data.hourly, todayStr);
    const forecastDays = computeForecastDays(data.daily, todayStr);
    const diseaseEvaluations = evaluateAllDiseases(data.hourly, todayStr);

    const report = {
      lat,
      lon,
      locationName: location.name || location.displayName || `${lat}°N, ${lon}°E`,
      displayName: location.displayName || location.name || '',
      level: location.level || 'district',
      isApproximate: Boolean(location.isApproximate),
      accuracy: location.accuracy != null ? Math.round(location.accuracy) : null,
      current: {
        time: data.current.time,
        temp: data.current.temperature_2m != null ? Math.round(data.current.temperature_2m * 10) / 10 : null,
        feelsLike: data.current.apparent_temperature != null ? Math.round(data.current.apparent_temperature * 10) / 10 : null,
        rh: data.current.relative_humidity_2m != null ? Math.round(data.current.relative_humidity_2m) : null,
        precip: data.current.precipitation != null ? Math.round(data.current.precipitation * 10) / 10 : null,
        windSpeed: data.current.wind_speed_10m != null ? Math.round(data.current.wind_speed_10m * 10) / 10 : null,
        windDirection: data.current.wind_direction_10m != null ? Math.round(data.current.wind_direction_10m) : null,
        cloudCover: data.current.cloud_cover != null ? Math.round(data.current.cloud_cover) : null,
      },
      pastSummary,
      forecastDays,
      diseaseEvaluations,
      rawHourly: data.hourly,
    };

    const entry = {
      lat,
      lon,
      fetched_at: new Date(now).toISOString(),
      expires_at: now + FRESH_TTL_MS,
      stale_at: now + STALE_THRESHOLD_MS,
      report,
    };

    try {
      await db.put(STORES.WEATHER, entry, cacheKey);
    } catch {
      // ignore local DB storage error
    }

    return {
      ...report,
      fetched_at: entry.fetched_at,
      fromCache: false,
      isStale: false,
      isOffline: false,
    };
  } catch {
    // Fallback: If offline or network error, serve cached data if available
    if (cached && cached.report) {
      const isStale = now > (cached.stale_at || cached.expires_at);
      return {
        ...cached.report,
        fetched_at: cached.fetched_at,
        fromCache: true,
        isStale,
        isOffline: true,
      };
    }
    return null;
  }
}
