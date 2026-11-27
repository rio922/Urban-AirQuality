/** Hardened fetch wrapper: timeout, retry with exponential backoff, safe errors. */

export interface FetchOptions extends Omit<RequestInit, 'signal'> {
  timeoutMs?: number;
  retries?: number;
  retryBaseMs?: number;
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Fetches a URL with a hard timeout and exponential backoff on retryable
 * failures. Network/5xx/429 errors are retried; 4xx are surfaced immediately.
 * @throws UpstreamError with a safe, non-sensitive message.
 */
export async function fetchWithRetry(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeoutMs = 8000, retries = 2, retryBaseMs = 300, ...init } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.ok) return response;
      if (!isRetryableStatus(response.status)) {
        throw new UpstreamError(`Upstream request failed with status ${response.status}`, response.status);
      }
      lastError = new UpstreamError(`Upstream request failed with status ${response.status}`, response.status);
    } catch (error) {
      if (error instanceof UpstreamError && error.status && !isRetryableStatus(error.status)) throw error;
      lastError = error;
    } finally {
      clearTimeout(timer);
    }
    if (attempt < retries) await sleep(retryBaseMs * 2 ** attempt);
  }

  const message =
    lastError instanceof Error && lastError.name === 'AbortError'
      ? 'The data source took too long to respond.'
      : 'The data source is temporarily unavailable.';
  throw new UpstreamError(message);
}
