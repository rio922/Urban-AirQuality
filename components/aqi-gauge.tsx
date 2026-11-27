'use client';

import { PollutantKey, PollutantReading } from '@/types';

interface AqiGaugeProps {
  aqi: number;
  max: number;
  color: string;
  label: string;
  a11yLabel: string;
}

/** Half-circle gauge; visual state is duplicated in text for accessibility. */
export function AqiGauge({ aqi, max, color, label, a11yLabel }: AqiGaugeProps) {
  const clamped = Math.min(aqi, max);
  const angle = (clamped / max) * 180 - 90;
  const circumference = Math.PI * 90;
  const progress = (clamped / max) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 120"
        role="img"
        aria-label={`${a11yLabel}: AQI ${aqi}, ${label}`}
        className="w-full max-w-[260px]"
      >
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 10 110 A 90 90 0 0 1 190 110"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{ transition: 'stroke-dasharray 700ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
        <text x="100" y="86" textAnchor="middle" className="fill-foreground" fontSize="40" fontWeight="700">
          {aqi}
        </text>
        <text x="100" y="108" textAnchor="middle" className="fill-muted-foreground" fontSize="12">
          AQI
        </text>
        <g className="aqi-gauge-needle" style={{ transform: `rotate(${angle + 90}deg)` }} aria-hidden="true">
          <line x1="100" y1="100" x2="100" y2="34" stroke={color} strokeWidth="3" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill={color} />
        </g>
      </svg>
      <p className="mt-1 text-center text-sm font-medium" style={{ color }}>
        {label}
      </p>
    </div>
  );
}

interface PollutantListProps {
  pollutants: PollutantReading[];
}

/** Grid of pollutant readings with sub-index bars (bar is decorative; values are text). */
export function PollutantGrid({ pollutants }: PollutantListProps) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {pollutants.map((p) => {
        const pct = p.subIndex != null ? Math.min(100, (p.subIndex / 300) * 100) : 0;
        return (
          <li key={p.key} className="rounded-lg border bg-card p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{p.label}</span>
              <span className="text-xs text-muted-foreground">{p.unit}</span>
            </div>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {p.value != null ? p.value.toFixed(1) : 'n/a'}
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Index: {p.subIndex != null ? p.subIndex : 'n/a'}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

export const POLLUTANT_ORDER: PollutantKey[] = ['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co'];
