/** Shared domain types for the Urban Air Quality Assistant. */

export type AqiStandard = 'us' | 'eu';

export type PollutantKey = 'pm2_5' | 'pm10' | 'no2' | 'o3' | 'so2' | 'co';

export type HealthProfile =
  | 'general'
  | 'children'
  | 'elderly'
  | 'asthma'
  | 'outdoor_workers'
  | 'athletes';

export interface PollutantReading {
  key: PollutantKey;
  label: string;
  value: number | null;
  unit: string;
  /** Pollutant-specific sub-index on the selected standard. */
  subIndex: number | null;
}

export interface AqiCategoryInfo {
  /** 1 (best) .. 6 (worst). */
  level: number;
  label: string;
  /** Hex color representing the category. */
  color: string;
  /** Short text status, color-independent for accessibility. */
  advice: string;
}

export interface AqiResult {
  aqi: number;
  standard: AqiStandard;
  standardLabel: string;
  category: AqiCategoryInfo;
  dominantPollutant: PollutantKey | null;
  dominantLabel: string | null;
  pollutants: PollutantReading[];
}

export interface Concentrations {
  pm2_5?: number | null;
  pm10?: number | null;
  no2?: number | null;
  o3?: number | null;
  so2?: number | null;
  co?: number | null;
}

export interface AirQualityData {
  standard: AqiStandard;
  standardLabel: string;
  aqi: number;
  category: AqiCategoryInfo;
  dominantPollutant: PollutantKey | null;
  dominantLabel: string | null;
  pollutants: PollutantReading[];
  fetchedAt: string;
}

export interface HourlyAqiPoint {
  /** ISO timestamp in the city's local time. */
  time: string;
  aqi: number;
  pm2_5: number | null;
  pm10: number | null;
}

export interface AirQualityForecast {
  standard: AqiStandard;
  hourly: HourlyAqiPoint[];
  trend: 'improving' | 'stable' | 'worsening';
  bestWindows: ForecastWindow[];
  worstWindows: ForecastWindow[];
  fetchedAt: string;
}

export interface ForecastWindow {
  startTime: string;
  endTime: string;
  avgAqi: number;
  label: string;
}

export interface AdvisorySection {
  mask: string;
  outdoor: string;
  ventilation: string;
  exercise: string;
  precautions: string;
}

export interface HealthAdvisory {
  profile: HealthProfile;
  profileLabel: string;
  categoryLabel: string;
  summary: string;
  sections: AdvisorySection;
  bestWindows: ForecastWindow[];
  worstWindows: ForecastWindow[];
}

export interface CityLocation {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  admin1: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  population: number | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequestPayload {
  question: string;
  city: CityLocation;
  standard: AqiStandard;
  profile: HealthProfile;
}

export interface ComparisonSide {
  city: CityLocation;
  airQuality: AirQualityData | null;
  error?: string;
}

export interface ComparisonResult {
  cityA: ComparisonSide;
  cityB: ComparisonSide;
  summary: string | null;
}

export interface ApiErrorResponse {
  error: string;
}
