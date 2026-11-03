// F8 Rule engine for weather and seasonal disease awareness.
// Citations: BAMIS Boro Crop Calendars (Faridpur: 5102.pdf, Sylhet: 5108.pdf).
// Wording constraint: 'favourable conditions — check your field', never a risk %, never 'will occur'.

import rulesData from '../../../../disease_knowledge/weather_rules.json';

export const WEATHER_RULES = rulesData.rules;

/**
 * Group hourly Open-Meteo weather arrays by calendar day (YYYY-MM-DD).
 */
export function groupHourlyByDay(hourly) {
  if (!hourly || !Array.isArray(hourly.time)) return [];

  const daysMap = new Map();

  for (let i = 0; i < hourly.time.length; i++) {
    const timeStr = hourly.time[i];
    const dateStr = timeStr.slice(0, 10);
    const hour = parseInt(timeStr.slice(11, 13), 10);

    if (!daysMap.has(dateStr)) {
      daysMap.set(dateStr, {
        date: dateStr,
        hours: [],
        temps: [],
        rhs: [],
        clouds: [],
        precips: [],
        dayTemps: [],
        nightTemps: [],
      });
    }

    const d = daysMap.get(dateStr);
    const temp = hourly.temperature_2m?.[i];
    const rh = hourly.relative_humidity_2m?.[i];
    const cloud = hourly.cloud_cover?.[i];
    const precip = hourly.precipitation?.[i];

    d.hours.push(hour);
    if (temp != null) {
      d.temps.push(temp);
      // Daytime: 07:00 to 18:00; Nighttime: 19:00 to 06:00
      if (hour >= 7 && hour <= 18) {
        d.dayTemps.push(temp);
      } else {
        d.nightTemps.push(temp);
      }
    }
    if (rh != null) d.rhs.push(rh);
    if (cloud != null) d.clouds.push(cloud);
    if (precip != null) d.precips.push(precip);
  }

  const result = [];
  for (const [date, val] of daysMap.entries()) {
    if (val.temps.length === 0) continue;
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const max = (arr) => (arr.length ? Math.max(...arr) : null);
    const min = (arr) => (arr.length ? Math.min(...arr) : null);

    result.push({
      date,
      minTemp: min(val.temps),
      maxTemp: max(val.temps),
      nightMinTemp: min(val.nightTemps) ?? min(val.temps),
      nightMaxTemp: max(val.nightTemps) ?? max(val.temps),
      dayMinTemp: min(val.dayTemps) ?? min(val.temps),
      dayMaxTemp: max(val.dayTemps) ?? max(val.temps),
      maxRh: max(val.rhs),
      meanRh: avg(val.rhs),
      meanCloud: avg(val.clouds),
      totalPrecip: val.precips.reduce((a, b) => a + b, 0),
    });
  }

  return result;
}

/**
 * Check if a specific rule's conditions are met on a given day.
 */
export function isDayFavourable(day, ruleId) {
  if (!day) return false;

  if (ruleId === 'blast') {
    // BAMIS quote: "Blast Night temperature 16-20oC, for 7.30 hours day temperature 25-30oC, for 7.30 hours day night temperature >10oC Relative Humidity >90%, cloudy weather"
    const nightOk = day.nightMinTemp <= 20 && day.nightMaxTemp >= 16;
    const dayOk = day.dayMaxTemp >= 25 && day.dayMinTemp <= 30;
    const rhOk = day.maxRh >= 90;
    const cloudOk = day.meanCloud >= 50;
    return Boolean(nightOk && dayOk && rhOk && cloudOk);
  }

  if (ruleId === 'sheath_blight') {
    // BAMIS quote: "Sheath Blight Temperature 28-32o C, high Relative Humidity, Cloudy weather"
    const tempOk = day.dayMaxTemp >= 28 && day.dayMaxTemp <= 35 && day.nightMinTemp >= 22;
    const rhOk = day.maxRh >= 80;
    const cloudOk = day.meanCloud >= 50;
    return Boolean(tempOk && rhOk && cloudOk);
  }

  if (ruleId === 'bacterial_leaf_blight') {
    // BAMIS quote: "Blight Temperature 28-30o C, Relative Humidity 80-90%, Cloudiness, Rainfall >30mm"
    const tempOk = day.dayMaxTemp >= 28 && day.dayMaxTemp <= 34 && day.nightMinTemp >= 22;
    const rhOk = day.maxRh >= 80;
    const cloudOk = day.meanCloud >= 50;
    return Boolean(tempOk && rhOk && cloudOk);
  }

  return false;
}

/**
 * Evaluate all weather rules over a 3-day forecast.
 * Returns a list of favourable conditions.
 */
export function evaluateWeatherRules(hourly) {
  const days = groupHourlyByDay(hourly);
  if (!days.length) return [];

  const favourableRules = [];

  for (const rule of WEATHER_RULES) {
    const matchingDays = [];
    for (const day of days) {
      if (isDayFavourable(day, rule.id)) {
        matchingDays.push(day.date);
      }
    }
    if (matchingDays.length > 0) {
      favourableRules.push({
        ruleId: rule.id,
        diseaseKey: rule.disease_key,
        diseaseNameEn: rule.disease_name_en,
        diseaseNameBn: rule.disease_name_bn,
        source: rule.source,
        sourceUrl: rule.source_url,
        sourceQuote: rule.source_quote,
        matchingDays,
      });
    }
  }

  return favourableRules;
}
