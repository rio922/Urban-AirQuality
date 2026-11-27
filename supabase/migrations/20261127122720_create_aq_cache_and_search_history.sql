/*
# Urban Air Quality Assistant: shared cache and search history

1. New Tables
- `aq_cache`: server-side cache of Open-Meteo responses (geocoding, air quality, forecasts).
  - `cache_key` (text, primary key): stable key, e.g. `aq:us:51.51:-0.13`.
  - `value` (jsonb): the cached payload.
  - `expires_at` (timestamptz): expiry; stale rows are overwritten by upsert.
  - `created_at` (timestamptz): row creation time.
- `search_history`: anonymous log of the most recent city searches (single-tenant, no auth).
  - `id` (uuid, primary key).
  - `city_name` (text): display name of the searched city.
  - `country` (text): country name.
  - `latitude`, `longitude` (double precision): coordinates.
  - `created_at` (timestamptz): when the search happened.

2. Security
- RLS enabled on both tables.
- `aq_cache` is server-only: no grants to anon/authenticated; only `service_role` (used by server-side caching) may read/write.
- `search_history` is intentionally public (no sign-in): anon + authenticated may insert and read their own rows via `USING (true)`; DELETE is not granted so history is append-only.
3. Notes
- Stale cache rows are cleaned opportunistically by the server; nothing here exposes user-identifying data beyond a city name.
*/

CREATE TABLE IF NOT EXISTS aq_cache (
  cache_key text PRIMARY KEY,
  value jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name text NOT NULL,
  country text NOT NULL DEFAULT '',
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aq_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON aq_cache TO service_role;
GRANT SELECT, INSERT ON search_history TO anon, authenticated;

DROP POLICY IF EXISTS "service_role manages cache" ON aq_cache;
CREATE POLICY "service_role manages cache"
ON aq_cache
TO service_role
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "anon can read search history" ON search_history;
CREATE POLICY "anon can read search history"
ON search_history
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "anon can log searches" ON search_history;
CREATE POLICY "anon can log searches"
ON search_history
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
