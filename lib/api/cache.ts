import { getSupabaseAdmin } from './supabase-admin';

interface CacheRow<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheRow<unknown>>();
const MEMORY_MAX_ENTRIES = 500;

/**
 * Shared two-layer cache: memory first (single instance), then a Supabase
 * table when a database is configured. Falls back to memory-only otherwise.
 * @param key stable cache key.
 * @param ttlMs time-to-live in milliseconds.
 * @param loader async producer of the value on miss.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const memHit = memoryCache.get(key) as CacheRow<T> | undefined;
  if (memHit && memHit.expiresAt > now) return memHit.value;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from('aq_cache')
      .select('value, expires_at')
      .eq('cache_key', key)
      .maybeSingle();
    const expiresAt = data?.expires_at ? new Date(data.expires_at).getTime() : 0;
    if (data && expiresAt > now) {
      memoryCache.set(key, { value: data.value as T, expiresAt });
      return data.value as T;
    }
  }

  const value = await loader();
  const expiresAt = now + ttlMs;
  memoryCache.set(key, { value, expiresAt });
  if (memoryCache.size > MEMORY_MAX_ENTRIES) {
    for (const [k, v] of memoryCache) {
      if (v.expiresAt <= now) memoryCache.delete(k);
    }
    if (memoryCache.size > MEMORY_MAX_ENTRIES) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey !== undefined) memoryCache.delete(firstKey);
    }
  }
  if (supabase) {
    await supabase
      .from('aq_cache')
      .upsert(
        { cache_key: key, value, expires_at: new Date(expiresAt).toISOString() },
        { onConflict: 'cache_key' }
      );
  }
  return value;
}
