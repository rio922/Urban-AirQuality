/**
 * Fixed-window in-memory rate limiter.
 * Suitable for a single serverless instance; swap for a shared store on
 * multi-instance deployments.
 */
interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();
const MAX_KEYS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Checks and records a request against a fixed window.
 * @param key unique client key (e.g. IP + route).
 * @param limit maximum requests per window.
 * @param windowMs window length in milliseconds.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    if (windows.size >= MAX_KEYS) {
      // Prevent unbounded growth: drop expired entries.
      for (const [k, v] of windows) {
        if (v.resetAt <= now) windows.delete(k);
      }
      if (windows.size >= MAX_KEYS) windows.clear();
    }
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

/** Removes a client's window (used by tests). */
export function resetRateLimits(): void {
  windows.clear();
}

/** Best-effort client IP from proxy headers. */
export function clientIpFrom(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
