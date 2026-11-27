import type { NextRequest } from 'next/server';
import { searchCities } from '@/lib/api/open-meteo';
import {
  enforceRateLimit,
  errorResponse,
  handleRoute,
  parseWith,
  successResponse,
} from '@/lib/api/route-helpers';
import { geocodeQuerySchema } from '@/lib/validation/schemas';

export const dynamic = 'force-dynamic';

/** GET /api/geocode?q=... — city autocomplete via Open-Meteo geocoding. */
export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, 'geocode', 30, 60_000);
  if (limited) return limited;

  const params = request.nextUrl.searchParams;
  const parsed = parseWith(geocodeQuerySchema, Object.fromEntries(params.entries()));
  if (parsed.response) return parsed.response;

  return handleRoute(async () => {
    try {
      const cities = await searchCities(parsed.data.q, parsed.data.count);
      return successResponse({ cities });
    } catch {
      return errorResponse('City search is temporarily unavailable.', 502);
    }
  });
}
