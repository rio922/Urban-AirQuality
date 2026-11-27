import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client for shared cache rows.
 * Returns null when the project has no database configured, so callers can
 * degrade gracefully to an in-memory cache.
 */
export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
