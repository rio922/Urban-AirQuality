import type { AqiStandard, HealthProfile, PollutantKey } from '@/types';

/** US EPA AQI breakpoint tables, indexed by category level 0..5. */
export interface Breakpoint {
  /** Lower pollutant concentration for the band. */
  cLow: number;
  cHigh: number;
  /** Lower AQI value for the band. */
  iLow: number;
  iHigh: number;
}

export const US_BREAKPOINTS: Record<PollutantKey, Breakpoint[]> = {
  // PM2.5 in ug/m3 (24h, 2024 updated EPA breakpoints).
  pm2_5: [
    { cLow: 0, cHigh: 9, iLow: 0, iHigh: 50 },
    { cLow: 9.1, cHigh: 35.4, iLow: 51, iHigh: 100 },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150 },
    { cLow: 55.5, cHigh: 125.4, iLow: 151, iHigh: 200 },
    { cLow: 125.5, cHigh: 225.4, iLow: 201, iHigh: 300 },
    { cLow: 225.5, cHigh: 500.4, iLow: 301, iHigh: 500 },
  ],
  // PM10 in ug/m3 (24h).
  pm10: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 154, iLow: 51, iHigh: 100 },
    { cLow: 155, cHigh: 254, iLow: 101, iHigh: 150 },
    { cLow: 255, cHigh: 354, iLow: 151, iHigh: 200 },
    { cLow: 355, cHigh: 424, iLow: 201, iHigh: 300 },
    { cLow: 425, cHigh: 604, iLow: 301, iHigh: 500 },
  ],
  // Ozone in ppb (8h).
  o3: [
    { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
    { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
    { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
    { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
    { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 },
    { cLow: 201, cHigh: 500, iLow: 301, iHigh: 500 },
  ],
  // Nitrogen dioxide in ppb (1h).
  no2: [
    { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
    { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
    { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
    { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
    { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
    { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500 },
  ],
  // Sulfur dioxide in ppb (1h).
  so2: [
    { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
    { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
    { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
    { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
    { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
    { cLow: 605, cHigh: 1004, iLow: 301, iHigh: 500 },
  ],
  // Carbon monoxide in ppm (8h).
  co: [
    { cLow: 0, cHigh: 4.4, iLow: 0, iHigh: 50 },
    { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
    { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
    { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
    { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
    { cLow: 30.5, cHigh: 50.4, iLow: 301, iHigh: 500 },
  ],
};

/**
 * European EAQI bands: each pollutant maps a concentration range to a band
 * 0..5; the final index is (band + 1) * 20 on the 0-100+ scale.
 */
export const EU_BREAKPOINTS: Record<PollutantKey, { cLow: number; cHigh: number }[]> = {
  pm2_5: [
    { cLow: 0, cHigh: 10 },
    { cLow: 10, cHigh: 20 },
    { cLow: 20, cHigh: 25 },
    { cLow: 25, cHigh: 50 },
    { cLow: 50, cHigh: 75 },
    { cLow: 75, cHigh: Infinity },
  ],
  pm10: [
    { cLow: 0, cHigh: 20 },
    { cLow: 20, cHigh: 40 },
    { cLow: 40, cHigh: 50 },
    { cLow: 50, cHigh: 100 },
    { cLow: 100, cHigh: 150 },
    { cLow: 150, cHigh: Infinity },
  ],
  no2: [
    { cLow: 0, cHigh: 25 },
    { cLow: 25, cHigh: 50 },
    { cLow: 50, cHigh: 100 },
    { cLow: 100, cHigh: 200 },
    { cLow: 200, cHigh: 400 },
    { cLow: 400, cHigh: Infinity },
  ],
  o3: [
    { cLow: 0, cHigh: 50 },
    { cLow: 50, cHigh: 100 },
    { cLow: 100, cHigh: 130 },
    { cLow: 130, cHigh: 240 },
    { cLow: 240, cHigh: 380 },
    { cLow: 380, cHigh: Infinity },
  ],
  so2: [
    { cLow: 0, cHigh: 40 },
    { cLow: 40, cHigh: 90 },
    { cLow: 90, cHigh: 130 },
    { cLow: 130, cHigh: 270 },
    { cLow: 270, cHigh: 500 },
    { cLow: 500, cHigh: Infinity },
  ],
  // CO is expressed in mg/m3 for the EAQI.
  co: [
    { cLow: 0, cHigh: 2 },
    { cLow: 2, cHigh: 4 },
    { cLow: 4, cHigh: 6 },
    { cLow: 6, cHigh: 10 },
    { cLow: 10, cHigh: 15 },
    { cLow: 15, cHigh: Infinity },
  ],
};

/** ug/m3 to ppb/ppm conversion factors at 25 C, 1 atm. */
export const UG_TO_PPB: Record<'no2' | 'o3' | 'so2', number> = {
  no2: 24.45 / 46.0055,
  o3: 24.45 / 47.9982,
  so2: 24.45 / 64.066,
};
/** ug/m3 CO to ppm. */
export const UG_CO_TO_PPM = 24.45 / 28.01 / 1000;

export interface CategoryDefinition {
  level: number;
  label: string;
  color: string;
  advice: string;
}

export const US_CATEGORIES: CategoryDefinition[] = [
  { level: 1, label: 'Good', color: '#10b981', advice: 'Air quality is satisfactory for everyone.' },
  { level: 2, label: 'Moderate', color: '#eab308', advice: 'Acceptable air; unusually sensitive people should watch for symptoms.' },
  { level: 3, label: 'Unhealthy for Sensitive Groups', color: '#f97316', advice: 'Sensitive groups should limit prolonged outdoor exertion.' },
  { level: 4, label: 'Unhealthy', color: '#ef4444', advice: 'Everyone should reduce prolonged outdoor exertion.' },
  { level: 5, label: 'Very Unhealthy', color: '#b91c1c', advice: 'Avoid outdoor exertion; keep windows closed.' },
  { level: 6, label: 'Hazardous', color: '#7f1d1d', advice: 'Stay indoors with filtered air if possible.' },
];

export const EU_CATEGORIES: CategoryDefinition[] = [
  { level: 1, label: 'Good', color: '#14b8a6', advice: 'Air quality is good; enjoy your usual activities.' },
  { level: 2, label: 'Fair', color: '#22c55e', advice: 'Air quality is fair for nearly everyone.' },
  { level: 3, label: 'Moderate', color: '#eab308', advice: 'Sensitive people should consider reducing intense outdoor effort.' },
  { level: 4, label: 'Poor', color: '#f97316', advice: 'Reduce outdoor exertion, especially if you feel symptoms.' },
  { level: 5, label: 'Very Poor', color: '#ef4444', advice: 'Avoid outdoor exertion; stay indoors when you can.' },
  { level: 6, label: 'Extremely Poor', color: '#7f1d1d', advice: 'Remain indoors with windows closed.' },
];

export const POLLUTANT_META: Record<
  PollutantKey,
  { label: string; unit: string; unitEu: string }
> = {
  pm2_5: { label: 'PM2.5', unit: 'µg/m³', unitEu: 'µg/m³' },
  pm10: { label: 'PM10', unit: 'µg/m³', unitEu: 'µg/m³' },
  no2: { label: 'NO₂', unit: 'ppb', unitEu: 'µg/m³' },
  o3: { label: 'O₃', unit: 'ppb', unitEu: 'µg/m³' },
  so2: { label: 'SO₂', unit: 'ppb', unitEu: 'µg/m³' },
  co: { label: 'CO', unit: 'ppm', unitEu: 'mg/m³' },
};

export const STANDARD_LABELS: Record<AqiStandard, string> = {
  us: 'US AQI (EPA)',
  eu: 'European AQI (EAQI)',
};

export const PROFILE_LABELS: Record<HealthProfile, string> = {
  general: 'General population',
  children: 'Children',
  elderly: 'Older adults (65+)',
  asthma: 'Asthma & respiratory-sensitive',
  outdoor_workers: 'Outdoor workers',
  athletes: 'Athletes & active people',
};

/** Maximum question length accepted by the AI assistant route. */
export const MAX_QUESTION_LENGTH = 500;
