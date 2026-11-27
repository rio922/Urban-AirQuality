'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CitySearch } from '@/components/city-search';
import { AqiGauge, PollutantGrid } from '@/components/aqi-gauge';
import { AdvisoryPanel } from '@/components/advisory-panel';
import { AssistantChat } from '@/components/assistant-chat';
import { CityComparison } from '@/components/city-comparison';
import { PollutantEducation } from '@/components/pollutant-education';
import { STANDARD_LABELS } from '@/constants/aqi';
import { generateAdvisory } from '@/lib/advisory/engine';
import type {
  AqiStandard,
  AirQualityData,
  AirQualityForecast,
  CityLocation,
  HealthProfile,
} from '@/types';

const ForecastChart = dynamic(
  () => import('@/components/forecast-chart').then((m) => m.ForecastChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

interface AirQualityResponse {
  current: AirQualityData | null;
  forecast: AirQualityForecast | null;
  error: string | null;
}

const POPULAR_CITIES = ['London', 'New Delhi', 'New York', 'Beijing', 'São Paulo', 'Tokyo'];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function HomePage() {
  const [city, setCity] = useState<CityLocation | null>(null);
  const [standard, setStandard] = useState<AqiStandard>('us');
  const [profile, setProfile] = useState<HealthProfile>('general');
  const [current, setCurrent] = useState<AirQualityData | null>(null);
  const [forecast, setForecast] = useState<AirQualityForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (target: CityLocation, chosenStandard: AqiStandard) => {
      setLoading(true);
      setError(null);
      setCurrent(null);
      setForecast(null);
      try {
        const params = new URLSearchParams({
          latitude: String(target.latitude),
          longitude: String(target.longitude),
          standard: chosenStandard,
        });
        const response = await fetch(`/api/air-quality?${params}`);
        const body: unknown = await response.json();
        if (!response.ok || !body || typeof body !== 'object') {
          throw new Error(
            body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string'
              ? (body as { error: string }).error
              : 'Air quality data is unavailable right now.'
          );
        }
        const data = body as AirQualityResponse;
        if (data.error || !data.current) {
          throw new Error(data.error ?? 'No air quality data was returned for this location.');
        }
        setCurrent(data.current);
        setForecast(data.forecast);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (city) void load(city, standard);
  }, [city, standard, load]);

  const advisory = useMemo(() => {
    if (!current) return null;
    return generateAdvisory(profile, current.aqi, current.category, forecast?.bestWindows);
  }, [profile, current, forecast]);

  const trendBadge = forecast
    ? {
        improving: { icon: TrendingDown, text: 'Improving' },
        worsening: { icon: TrendingUp, text: 'Worsening' },
        stable: { icon: Minus, text: 'Stable' },
      }[forecast.trend]
    : null;

  return (
    <div className="space-y-6">
      <section aria-labelledby="search-heading" className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h1 id="search-heading" className="text-xl font-bold sm:text-2xl">
              Check your air, plan your day
            </h1>
            <p className="text-sm text-muted-foreground">
              Live air quality, a two-day forecast and personal guidance for six health profiles.
            </p>
          </div>
          <div className="w-full sm:w-52">
            <label htmlFor="standard-select" className="mb-1 block text-xs font-medium text-muted-foreground">
              AQI standard
            </label>
            <Select value={standard} onValueChange={(v) => setStandard(v as AqiStandard)}>
              <SelectTrigger id="standard-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="us">{STANDARD_LABELS.us}</SelectItem>
                <SelectItem value="eu">{STANDARD_LABELS.eu}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <CitySearch onSelect={setCity} />

        <div className="flex flex-wrap items-center gap-2" aria-label="Popular cities">
          <span className="text-xs text-muted-foreground">Popular:</span>
          {POPULAR_CITIES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => void load({ id: name, name, country: '', countryCode: '', admin1: null, latitude: 0, longitude: 0, timezone: null, population: null }, standard)}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            >
              {name}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-4" role="status" aria-label="Loading air quality data">
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        )}

        {error && (
          <Card className="border-destructive/50">
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <p role="alert" className="text-sm text-destructive">{error}</p>
              {city && (
                <Button variant="outline" size="sm" onClick={() => void load(city, standard)}>
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Retry
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {current && city && (
        <Tabs defaultValue="now">
          <TabsList aria-label="Dashboard sections">
            <TabsTrigger value="now">Now</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
            <TabsTrigger value="pollutants">Learn</TabsTrigger>
          </TabsList>

          <TabsContent value="now" className="mt-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{city.name}{city.country ? `, ${city.country}` : ''}</span>
                    <span className="text-xs font-normal text-muted-foreground">{current.standardLabel}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <AqiGauge
                    aqi={current.aqi}
                    max={300}
                    color={current.category.color}
                    label={current.category.label}
                    a11yLabel={current.standardLabel}
                  />
                  <p aria-live="polite" className="text-center text-sm text-muted-foreground">
                    {current.category.advice}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Dominant pollutant:{' '}
                      <strong className="font-medium text-foreground">{current.dominantLabel ?? 'n/a'}</strong>
                    </span>
                    <span>Updated {formatTime(current.fetchedAt)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Pollutant levels</CardTitle>
                </CardHeader>
                <CardContent>
                  <PollutantGrid pollutants={current.pollutants} />
                  <p className="mt-3 text-xs text-muted-foreground">
                    PM values in µg/m³; gases follow the selected standard&apos;s units.
                  </p>
                </CardContent>
              </Card>
            </div>

            {advisory && <AdvisoryPanel advisory={advisory} profile={profile} onProfileChange={setProfile} />}

            <AssistantChat
              payload={{
                question: '',
                city,
                standard,
                profile,
              }}
            />
          </TabsContent>

          <TabsContent value="forecast" className="mt-4 space-y-4">
            {forecast ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Next 48 hours</span>
                      {trendBadge && (
                        <span className="flex items-center gap-1 text-xs font-normal">
                          {(() => {
                            const Icon = trendBadge.icon;
                            return <Icon className="h-3.5 w-3.5" aria-hidden="true" />;
                          })()}
                          {trendBadge.text}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ForecastChart hourly={forecast.hourly} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Hourly data</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-80 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">Time</TableHead>
                          <TableHead scope="col">AQI</TableHead>
                          <TableHead scope="col">PM2.5 (µg/m³)</TableHead>
                          <TableHead scope="col">PM10 (µg/m³)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {forecast.hourly.filter((_, i) => i % 3 === 0).map((h) => (
                          <TableRow key={h.time}>
                            <TableCell>{h.time.slice(11, 16)}</TableCell>
                            <TableCell className="tabular-nums">{h.aqi}</TableCell>
                            <TableCell className="tabular-nums">{h.pm2_5?.toFixed(1) ?? 'n/a'}</TableCell>
                            <TableCell className="tabular-nums">{h.pm10?.toFixed(1) ?? 'n/a'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Forecast data is unavailable for this city right now.</p>
            )}
          </TabsContent>

          <TabsContent value="compare" className="mt-4">
            <CityComparison standard={standard} />
          </TabsContent>

          <TabsContent value="pollutants" className="mt-4">
            <PollutantEducation />
          </TabsContent>
        </Tabs>
      )}

      {!city && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <p className="text-sm font-medium">Start by searching for a city above.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You can also use your current location, or the AI assistant once a city is selected.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
