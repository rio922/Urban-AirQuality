import type { NextRequest } from 'next/server';
import { getCurrentAirQuality, getForecast } from '@/lib/api/open-meteo';
import {
  enforceRateLimit,
  handleRoute,
  parseWith,
  successResponse,
} from '@/lib/api/route-helpers';
import { compareBodySchema } from '@/lib/validation/schemas';
import type { ComparisonResult, ComparisonSide } from '@/types';

export const dynamic = 'force-dynamic';

/** POST /api/compare — side-by-side air quality for two cities. */
export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, 'compare', 20, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return handleRoute(async () => {
      throw new Error('invalid-json');
    });
  }
  const parsed = parseWith(compareBodySchema, body);
  if (parsed.response) return parsed.response;

  return handleRoute(async () => {
    const { cityA, cityB, standard } = parsed.data;

    const loadSide = async (city: ComparisonSide['city']): Promise<ComparisonSide> => {
      try {
        const airQuality = await getCurrentAirQuality(city.latitude, city.longitude, standard);
        return { city, airQuality };
      } catch {
        return { city, airQuality: null, error: 'Data unavailable for this city right now.' };
      }
    };

    const [sideA, sideB] = await Promise.all([loadSide(cityA), loadSide(cityB)]);

    // Forecast summary: compare trends when both sides have data.
    let summary: string | null = null;
    if (sideA.airQuality && sideB.airQuality) {
      const better =
        sideA.airQuality.aqi < sideB.airQuality.aqi
          ? sideA
          : sideB.airQuality.aqi < sideA.airQuality.aqi
            ? sideB
            : null;
      const forecastA = await getForecast(cityA.latitude, cityA.longitude, standard).catch(() => null);
      const forecastB = await getForecast(cityB.latitude, cityB.longitude, standard).catch(() => null);
      const trendLine =
        forecastA && forecastB
          ? ` Over the next two days, ${cityA.name} looks ${forecastA.trend} while ${cityB.name} looks ${forecastB.trend}.`
          : '';
      summary = better
        ? `${better.city.name} currently has cleaner air (AQI ${better.airQuality?.aqi} vs ${
            better === sideA ? sideB.airQuality?.aqi : sideA.airQuality?.aqi
          }).${trendLine}`
        : `Both cities currently share a similar AQI (${sideA.airQuality.aqi}).${trendLine}`;
    }

    const result: ComparisonResult = { cityA: sideA, cityB: sideB, summary };
    return successResponse(result);
  });
}
