import { NextRequest, NextResponse } from 'next/server';
import { ZodError, type TypeOf, type ZodType } from 'zod';
import { clientIpFrom, checkRateLimit } from '@/lib/security/rate-limit';

/** Shared JSON headers for every route response. */
export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

/** Builds a JSON error response with a safe, user-facing message. */
export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status, headers: JSON_HEADERS });
}

/** Builds a JSON success response. */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: JSON_HEADERS });
}

/** Enforces a fixed-window rate limit keyed by client IP + route name. */
export function enforceRateLimit(
  request: NextRequest,
  route: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = clientIpFrom(request.headers);
  const result = checkRateLimit(`${route}:${ip}`, limit, windowMs);
  if (!result.allowed) {
    const retryAfterSec = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      {
        status: 429,
        headers: { ...JSON_HEADERS, 'Retry-After': String(retryAfterSec) },
      }
    );
  }
  return null;
}

/**
 * Parses and validates a request body/query with a Zod schema.
 * @returns typed data, or a NextResponse with a safe 400 error.
 */
export function parseWith<S extends ZodType>(
  schema: S,
  input: unknown
): { data: TypeOf<S>; response?: undefined } | { data?: undefined; response: NextResponse } {
  try {
    return { data: schema.parse(input) };
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.errors[0];
      return { response: errorResponse(first?.message ?? 'Invalid input.', 400) };
    }
    return { response: errorResponse('Invalid request.', 400) };
  }
}

/** Wraps a route handler with safe error handling. */
export async function handleRoute(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof Error && error.name === 'UpstreamError') {
      return errorResponse(error.message, 502);
    }
    return errorResponse('Something went wrong. Please try again.', 500);
  }
}
