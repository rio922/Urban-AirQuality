import type { NextRequest } from 'next/server';
import { getCurrentAirQuality, getForecast } from '@/lib/api/open-meteo';
import {
  enforceRateLimit,
  handleRoute,
  parseWith,
  successResponse,
} from '@/lib/api/route-helpers';
import { airQualityQuerySchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

/**
 * GET /api/air-quality?latitude=..&longitude=..&standard=us|eu
 * Returns current conditions plus a 48h forecast in one call.
 */
export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, 'aq', 40, 60_000);
  if (limited) return limited;

  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = parseWith(airQualityQuerySchema, params);
  if (parsed.response) return parsed.response;

  return handleRoute(async () => {
    const { latitude, longitude, standard } = parsed.data;
    const [airQuality, forecast] = await Promise.allSettled([
      getCurrentAirQuality(latitude, longitude, standard),
      getForecast(latitude, longitude, standard),
    ]);
    return successResponse({
      current: airQuality.status === 'fulfilled' ? airQuality.value : null,
      forecast: forecast.status === 'fulfilled' ? forecast.value : null,
      error:
        airQuality.status === 'rejected'
          ? 'Air quality data is temporarily unavailable for this location.'
          : null,
    });
  });
}
