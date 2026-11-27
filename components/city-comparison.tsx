'use client';

import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CitySearch } from '@/components/city-search';
import { AqiGauge } from '@/components/aqi-gauge';
import { Skeleton } from '@/components/ui/skeleton';
import { STANDARD_LABELS } from '@/constants/aqi';
import type { AqiStandard, CityLocation, ComparisonResult } from '@/types';

interface CityComparisonProps {
  standard: AqiStandard;
}

function sideLabel(name: string, country: string): string {
  return country ? `${name}, ${country}` : name;
}

/** Two-city comparison with gauges, pollutant table and a plain summary. */
export function CityComparison({ standard }: CityComparisonProps) {
  const [cityA, setCityA] = useState<CityLocation | null>(null);
  const [cityB, setCityB] = useState<CityLocation | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compare(a: CityLocation | null, b: CityLocation | null) {
    if (!a || !b) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityA: a, cityB: b, standard }),
      });
      if (!response.ok) throw new Error('Comparison is unavailable right now.');
      const data: unknown = await response.json();
      if (!data || typeof data !== 'object' || !('cityA' in data)) throw new Error('Unexpected response.');
      setResult(data as ComparisonResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="compare-heading" className="space-y-4 rounded-xl border bg-card p-4">
      <div>
        <h2 id="compare-heading" className="text-lg font-semibold">
          Compare two cities
        </h2>
        <p className="text-sm text-muted-foreground">
          Pick two cities to see which one has cleaner air right now.
        </p>
      </div>

      <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <CitySearch onSelect={setCityA} label="First city" />
        <Button
          variant="outline"
          size="icon"
          aria-label="Swap cities"
          onClick={() => {
            setCityA(cityB);
            setCityB(cityA);
            setResult(null);
          }}
        >
          <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <CitySearch onSelect={setCityB} label="Second city" />
      </div>

      <Button
        type="button"
        onClick={() => compare(cityA, cityB)}
        disabled={!cityA || !cityB || loading}
      >
        {loading ? 'Comparing…' : 'Compare cities'}
      </Button>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.summary && (
            <p aria-live="polite" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
              {result.summary}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {[result.cityA, result.cityB].map((side, i) => (
              <div key={i} className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold">{sideLabel(side.city.name, side.city.country)}</h3>
                {side.airQuality ? (
                  <>
                    <AqiGauge
                      aqi={side.airQuality.aqi}
                      max={300}
                      color={side.airQuality.category.color}
                      label={side.airQuality.category.label}
                      a11yLabel={STANDARD_LABELS[side.airQuality.standard]}
                    />
                    <dl className="mt-2 space-y-1 text-sm">
                      {side.airQuality.pollutants.slice(0, 2).map((p) => (
                        <div key={p.key} className="flex justify-between">
                          <dt className="text-muted-foreground">{p.label}</dt>
                          <dd className="tabular-nums">
                            {p.value != null ? `${p.value.toFixed(1)} ${p.unit}` : 'n/a'}
                          </dd>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Dominant</dt>
                        <dd>{side.airQuality.dominantLabel ?? 'n/a'}</dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">{side.error ?? 'No data.'}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
