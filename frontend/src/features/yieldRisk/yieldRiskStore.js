// Bridge to weather and profile stores for F26 Yield Risk Intelligence.
// Asynchronously fetches cached or fresh weather data without blocking initial scan rendering.

import { getProfileLocation, getWeatherData } from '../weather/weatherStore.js';

let memoryCache = {
  location: null,
  weather: null,
  timestamp: 0,
};

/**
 * Retrieves environmental weather data for risk computation.
 * Returns cached snapshot immediately if fresh, otherwise loads in background.
 */
export async function getRiskEnvironmentalContext() {
  try {
    const loc = await getProfileLocation();
    if (!loc) {
      return { location: null, weather: null, status: 'no_district' };
    }

    // Check memory cache (< 15 mins)
    const now = Date.now();
    if (
      memoryCache.weather &&
      memoryCache.location &&
      memoryCache.location.district_code === loc.district_code &&
      now - memoryCache.timestamp < 15 * 60 * 1000
    ) {
      return {
        location: memoryCache.location,
        weather: memoryCache.weather,
        status: 'cached'
      };
    }

    const weatherData = await getWeatherData(loc);
    if (weatherData) {
      memoryCache = {
        location: loc,
        weather: weatherData,
        timestamp: now,
      };
      return {
        location: loc,
        weather: weatherData,
        status: weatherData.isOffline ? 'offline' : 'live'
      };
    }

    return { location: loc, weather: null, status: 'unavailable' };
  } catch (err) {
    console.warn('[yieldRiskStore] Failed to retrieve weather context:', err);
    return { location: null, weather: null, status: 'error' };
  }
}

/**
 * Extracts normalized current and forecast metrics from weatherStore data.
 */
export function extractRiskMetrics(weatherData) {
  if (!weatherData || !weatherData.hourly) return null;

  const hourly = weatherData.hourly;
  const temps = hourly.temperature_2m || [];
  const rhs = hourly.relative_humidity_2m || [];
  const rain = hourly.precipitation || [];

  const temp = temps.length > 0 ? temps[0] : null;
  const rh = rhs.length > 0 ? rhs[0] : null;

  // Approximate diurnal range from first 24 hours
  let diurnalRange = 8;
  if (temps.length >= 24) {
    const slice24 = temps.slice(0, 24);
    const maxT = Math.max(...slice24);
    const minT = Math.min(...slice24);
    diurnalRange = Math.round((maxT - minT) * 10) / 10;
  }

  // Check 3-day trajectory for favorable blast / fungal conditions
  const forecast3d = [];
  const totalDays = Math.min(3, Math.floor(temps.length / 24));
  for (let d = 0; d < totalDays; d++) {
    const dayTemps = temps.slice(d * 24, (d + 1) * 24);
    const dayRhs = rhs.slice(d * 24, (d + 1) * 24);
    const meanRh = dayRhs.reduce((a, b) => a + b, 0) / (dayRhs.length || 1);
    const minTemp = Math.min(...dayTemps);
    const maxTemp = Math.max(...dayTemps);

    // Blast conducive day: night cool 16-22, day warm 25-30, RH > 85%
    const isFavorable = minTemp >= 16 && minTemp <= 22 && maxTemp >= 25 && maxTemp <= 32 && meanRh >= 85;
    forecast3d.push({ isFavorable, minTemp, maxTemp, meanRh });
  }

  return {
    temperature: temp,
    relativeHumidity: rh,
    diurnalRange,
    precipitation: rain.length > 0 ? rain[0] : 0,
    forecast3d,
  };
}
