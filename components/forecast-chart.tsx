'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { HourlyAqiPoint } from '@/types';

interface ForecastChartProps {
  hourly: HourlyAqiPoint[];
}

/** Interactive AQI + PM forecast chart. Data table alternative lives in the dashboard. */
export function ForecastChart({ hourly }: ForecastChartProps) {
  const data = hourly.map((h) => ({
    time: h.time.slice(11, 16),
    AQI: h.aqi,
    'PM2.5': h.pm2_5,
    'PM10': h.pm10,
  }));

  return (
    <div role="img" aria-label="Line chart of hourly AQI, PM2.5 and PM10 for the next 48 hours. A data table is provided below." className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={5} tickMargin={6} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ borderRadius: 8, fontSize: 12 }}
            labelStyle={{ fontWeight: 600 }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="AQI" stroke="#0ea5a4" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="PM2.5" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="PM10" stroke="#64748b" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
