import {
  EU_BREAKPOINTS,
  EU_CATEGORIES,
  POLLUTANT_META,
  STANDARD_LABELS,
  UG_CO_TO_PPM,
  UG_TO_PPB,
  US_BREAKPOINTS,
  US_CATEGORIES,
  type Breakpoint,
} from '@/constants/aqi';
import type {
  AqiCategoryInfo,
  AqiResult,
  Concentrations,
  PollutantKey,
  PollutantReading,
} from '@/types';

/** Converts a pollutant concentration from ug/m3 into the unit used by the chosen standard. */
function toStandardUnit(key: PollutantKey, value: number): number {
  switch (key) {
    case 'no2':
    case 'o3':
    case 'so2':
      return value * UG_TO_PPB[key];
    case 'co':
      return value * UG_CO_TO_PPM;
    default:
      return value;
  }
}

/**
 * Piecewise-linear US EPA sub-index for a concentration.
 * @returns sub-index, or null when concentration is missing/negative.
 */
export function usSubIndex(key: PollutantKey, concentration: number | null | undefined): number | null {
  if (concentration == null || concentration < 0 || !Number.isFinite(concentration)) return null;
  const breakpoints = US_BREAKPOINTS[key];
  const value = toStandardUnit(key, concentration);
  const band = breakpoints.find((b: Breakpoint) => value <= b.cHigh) ?? breakpoints[breakpoints.length - 1];
  if (value < band.cLow) return null;
  const index =
    ((band.iHigh - band.iLow) / (band.cHigh - band.cLow)) * (value - band.cLow) + band.iLow;
  return Math.round(index);
}

/**
 * European EAQI band for a concentration.
 * @returns 0-500+ style index rounded to the nearest 10, or null when missing.
 */
export function euSubIndex(key: PollutantKey, concentration: number | null | undefined): number | null {
  if (concentration == null || concentration < 0 || !Number.isFinite(concentration)) return null;
  const bands = EU_BREAKPOINTS[key];
  const bandIndex = bands.findIndex((b) => concentration < b.cHigh);
  const resolved = bandIndex === -1 ? bands.length - 1 : bandIndex;
  // Sub-index scales linearly within the band for a smoother gauge.
  const band = bands[resolved];
  const lower = resolved === 0 ? 0 : (resolved) * 20;
  const span = band.cHigh === Infinity ? 1 : band.cHigh - band.cLow;
  const fraction =
    band.cHigh === Infinity
      ? 0.5
      : Math.min(1, Math.max(0, (concentration - band.cLow) / span));
  return Math.min(500, Math.round((lower + fraction * 20) / 10) * 10);
}

/** AQI for a single pollutant under the selected standard. */
export function pollutantSubIndex(
  standard: 'us' | 'eu',
  key: PollutantKey,
  concentration: number | null | undefined
): number | null {
  return standard === 'us' ? usSubIndex(key, concentration) : euSubIndex(key, concentration);
}

/**
 * Classifies an AQI value into a human-readable category.
 * Works for both standards because both share the 6-level banding.
 */
export function categorizeAqi(aqi: number, standard: 'us' | 'eu'): AqiCategoryInfo {
  const categories = standard === 'us' ? US_CATEGORIES : EU_CATEGORIES;
  const bands =
    standard === 'us'
      ? [50, 100, 150, 200, 300]
      : [20, 40, 60, 80, 100];
  let level = 1;
  for (let i = 0; i < bands.length; i++) {
    if (aqi > bands[i]) level = i + 2;
  }
  const category = categories[level - 1];
  return { level, label: category.label, color: category.color, advice: category.advice };
}

/** Pollutant display label for a key. */
export function pollutantLabel(key: PollutantKey): string {
  return POLLUTANT_META[key].label;
}

/**
 * Computes overall AQI, dominant pollutant and per-pollutant readings.
 * The overall AQI is the maximum sub-index (EPA method).
 */
export function computeAqi(
  standard: 'us' | 'eu',
  concentrations: Concentrations
): AqiResult {
  const entries = Object.entries(concentrations) as [PollutantKey, number | null | undefined][];
  const pollutants: PollutantReading[] = [];
  let dominantPollutant: PollutantKey | null = null;
  let maxIndex = -1;

  for (const [key, value] of entries) {
    const subIndex = pollutantSubIndex(standard, key, value ?? null);
    const meta = POLLUTANT_META[key];
    pollutants.push({
      key,
      label: meta.label,
      value: value ?? null,
      unit: standard === 'us' ? meta.unit : meta.unitEu,
      subIndex,
    });
    if (subIndex != null && subIndex > maxIndex) {
      maxIndex = subIndex;
      dominantPollutant = key;
    }
  }

  const aqi = Math.max(0, maxIndex);
  return {
    aqi,
    standard,
    standardLabel: STANDARD_LABELS[standard],
    category: categorizeAqi(aqi, standard),
    dominantPollutant,
    dominantLabel: dominantPollutant ? pollutantLabel(dominantPollutant) : null,
    pollutants,
  };
}
