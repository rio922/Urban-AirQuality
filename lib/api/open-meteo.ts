import { cached } from './cache';
import { fetchWithRetry, UpstreamError } from './fetch-with-retry';
import { computeAqi } from '@/lib/aqi/engine';
import { POLLUTANT_META } from '@/constants/aqi';
import type {
  AqiStandard,
  AirQualityData,
  AirQualityForecast,
  CityLocation,
  Concentrations,
  ForecastWindow,
  HourlyAqiPoint,
  PollutantKey,
} from '@/types';

const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const CURRENT_TTL_MS = 15 * 60 * 1000;
const FORECAST_TTL_MS = 60 * 60 * 1000;

/** Normalizes an upstream geocoding hit into our CityLocation shape. */
function mapGeocodingResult(hit: Record<string, unknown>): CityLocation {
  return {
    id: String(hit.id),
    name: String(hit.name),
    country: String(hit.country ?? ''),
    countryCode: String(hit.country_code ?? ''),
    admin1: hit.admin1 ? String(hit.admin1) : null,
    latitude: Number(hit.latitude),
    longitude: Number(hit.longitude),
    timezone: hit.timezone ? String(hit.timezone) : null,
    population: hit.population != null ? Number(hit.population) : null,
  };
}

/**
 * Searches cities worldwide via the Open-Meteo geocoding API.
 * @param query free-text city name.
 * @param count maximum number of results (1-10).
 */
export async function searchCities(query: string, count = 6): Promise<CityLocation[]> {
  const key = `geo:${query.toLowerCase()}:${count}`;
  return cached(key, 24 * 60 * 60 * 1000, async () => {
    const url = new URL(GEOCODE_URL);
    url.searchParams.set('name', query);
    url.searchParams.set('count', String(count));
    url.searchParams.set('language', 'en');
    url.searchParams.set('format', 'json');

    const response = await fetchWithRetry(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== 'object' ||
      !Array.isArray((data as Record<string, unknown>).results)
    ) {
      return [];
    }
    const results = (data as { results: Record<string, unknown>[] }).results;
    return results.filter((hit) => hit.latitude != null && hit.longitude != null).map(mapGeocodingResult);
  });
}

/** Reverse geocoding: nearest named place for coordinates. */
export async function reverseGeocode(latitude: number, longitude: number): Promise<CityLocation | null> {
  const key = `revgeo:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  return cached(key, 24 * 60 * 60 * 1000, async () => {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('zoom', '10');
    url.searchParams.set('addressdetails', '1');
    try {
      const response = await fetchWithRetry(url.toString(), {
        headers: { Accept: 'application/json', 'User-Agent': 'UrbanAirQualityAssistant/1.0' },
        retries: 1,
      });
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object') return null;
      const record = data as Record<string, unknown>;
      const address = (record.address ?? {}) as Record<string, string>;
      const name = address.city || address.town || address.village || address.county || '';
      if (!name) return null;
      return {
        id: `geo-${latitude.toFixed(2)}-${longitude.toFixed(2)}`,
        name,
        country: address.country ?? '',
        countryCode: (address.country_code ?? '').toUpperCase(),
        admin1: address.state ?? null,
        latitude,
        longitude,
        timezone: null,
        population: null,
      } satisfies CityLocation;
    } catch {
      return null;
    }
  });
}

interface OpenMeteoAqResponse {
  current?: Record<string, number | null>;
  hourly?: {
    time?: string[];
    us_aqi?: (number | null)[];
    european_aqi?: (number | null)[];
    pm2_5?: (number | null)[];
    pm10?: (number | null)[];
  };
}

/** Standard-specific AQI field name on the Open-Meteo current/hourly payloads. */
function aqiField(standard: AqiStandard): string {
  return standard === 'us' ? 'us_aqi' : 'european_aqi';
}

function extractCurrentConcentrations(current: Record<string, number | null> | undefined): Concentrations {
  if (!current) return {};
  return {
    pm2_5: current.pm2_5 ?? null,
    pm10: current.pm10 ?? null,
    no2: current.nitrogen_dioxide ?? null,
    o3: current.ozone ?? null,
    so2: current.sulphur_dioxide ?? null,
    co: current.carbon_monoxide ?? null,
  };
}

/**
 * Fetches current air quality for coordinates and computes the AQI model.
 * @throws UpstreamError when the Open-Meteo API is unreachable.
 */
export async function getCurrentAirQuality(
  latitude: number,
  longitude: number,
  standard: AqiStandard
): Promise<AirQualityData> {
  const key = `aq:${standard}:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  return cached(key, CURRENT_TTL_MS, async () => {
    const url = new URL(AIR_QUALITY_URL);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('current', [
      aqiField(standard),
      'pm2_5',
      'pm10',
      'nitrogen_dioxide',
      'ozone',
      'sulphur_dioxide',
      'carbon_monoxide',
    ].join(','));
    url.searchParams.set('timezone', 'auto');

    const response = await fetchWithRetry(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') {
      throw new UpstreamError('Unexpected air-quality response.');
    }
    const payload = data as OpenMeteoAqResponse;
    const concentrations = extractCurrentConcentrations(payload.current);
    const result = computeAqi(standard, concentrations);

    return {
      ...result,
      fetchedAt: new Date().toISOString(),
    } satisfies AirQualityData;
  });
}

/**
 * Fetches 48h hourly AQI + particulate forecast and derives best/worst windows.
 * @throws UpstreamError when the Open-Meteo API is unreachable.
 */
export async function getForecast(
  latitude: number,
  longitude: number,
  standard: AqiStandard
): Promise<AirQualityForecast> {
  const key = `fc:${standard}:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
  return cached(key, FORECAST_TTL_MS, async () => {
    const url = new URL(AIR_QUALITY_URL);
    url.searchParams.set('latitude', String(latitude));
    url.searchParams.set('longitude', String(longitude));
    url.searchParams.set('hourly', [aqiField(standard), 'pm2_5', 'pm10'].join(','));
    url.searchParams.set('forecast_hours', '48');
    url.searchParams.set('timezone', 'auto');

    const response = await fetchWithRetry(url.toString(), {
      headers: { Accept: 'application/json' },
    });
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object') {
      throw new UpstreamError('Unexpected forecast response.');
    }
    const payload = data as OpenMeteoAqResponse;
    const times = payload.hourly?.time ?? [];
    const aqiSeries = (payload.hourly as Record<string, (number | null)[]> | undefined)?.[aqiField(standard)] ?? [];

    const hourly: HourlyAqiPoint[] = times.map((time, i) => ({
      time,
      aqi: aqiSeries[i] ?? 0,
      pm2_5: payload.hourly?.pm2_5?.[i] ?? null,
      pm10: payload.hourly?.pm10?.[i] ?? null,
    }));
    if (hourly.length === 0) throw new UpstreamError('No forecast hours were returned.');

    const windows = buildWindows(hourly);
    const firstHalf = hourly.slice(0, 12).reduce((s, h) => s + h.aqi, 0) / Math.min(12, hourly.length);
    const lastHalf = hourly.slice(-12).reduce((s, h) => s + h.aqi, 0) / Math.min(12, hourly.length);
    const trend =
      lastHalf < firstHalf - 5 ? 'improving' : lastHalf > firstHalf + 5 ? 'worsening' : 'stable';

    return {
      standard,
      hourly,
      trend,
      bestWindows: windows.slice(0, 2),
      worstWindows: windows.slice(-2).reverse(),
      fetchedAt: new Date().toISOString(),
    } satisfies AirQualityForecast;
  });
}

/** Splits hourly points into 6-hour windows and ranks them by average AQI. */
export function buildWindows(hourly: HourlyAqiPoint[]): ForecastWindow[] {
  const windows: ForecastWindow[] = [];
  const windowSize = 6;
  for (let i = 0; i + windowSize <= hourly.length; i += windowSize) {
    const slice = hourly.slice(i, i + windowSize);
    const avgAqi = Math.round(slice.reduce((s, h) => s + h.aqi, 0) / slice.length);
    windows.push({
      startTime: slice[0].time,
      endTime: slice[slice.length - 1].time,
      avgAqi,
      label: `${slice[0].time.slice(11, 16)}–${slice[slice.length - 1].time.slice(11, 16)}`,
    });
  }
  return windows.sort((a, b) => a.avgAqi - b.avgAqi);
}

/** Compact data digest injected into the AI system prompt (grounding context). */
export function buildGroundingContext(
  city: CityLocation,
  current: AirQualityData,
  forecast: AirQualityForecast | null
): string {
  const lines = [
    `City: ${city.name}, ${city.country}`,
    `Standard: ${current.standardLabel}`,
    `Overall AQI: ${current.aqi} (${current.category.label})`,
    current.dominantPollutant
      ? `Dominant pollutant: ${POLLUTANT_META[current.dominantPollutant].label}`
      : 'Dominant pollutant: unknown',
    ...current.pollutants.map(
      (p) => `${p.label}: ${p.value != null ? p.value.toFixed(1) : 'n/a'} ${p.unit}`
    ),
  ];
  if (forecast) {
    lines.push(
      `Forecast trend (next 48h): ${forecast.trend}`,
      'Hourly AQI sample:',
      ...forecast.hourly
        .filter((_, i) => i % 6 === 0)
        .slice(0, 8)
        .map((h) => `  ${h.time.slice(11, 16)} local: AQI ${h.aqi}`)
    );
  }
  return lines.join('\n');
}
