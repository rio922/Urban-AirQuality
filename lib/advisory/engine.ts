import { PROFILE_LABELS } from '@/constants/aqi';
import type {
  AdvisorySection,
  AqiCategoryInfo,
  Concentrations,
  ForecastWindow,
  HealthAdvisory,
  HealthProfile,
} from '@/types';

interface ProfileRule {
  /** Numeric AQI threshold above which this profile must reduce activity. */
  cautionAbove: number;
  limitAbove: number;
  avoidAbove: number;
  summary: (category: string, aqi: number) => string;
  sections: (severity: 'low' | 'moderate' | 'high' | 'severe') => AdvisorySection;
}

const baseSections = (severity: 'low' | 'moderate' | 'high' | 'severe'): AdvisorySection => {
  switch (severity) {
    case 'low':
      return {
        mask: 'No mask needed.',
        outdoor: 'Safe to spend time outdoors.',
        ventilation: 'Open windows freely to let fresh air in.',
        exercise: 'Outdoor exercise is fine at any time of day.',
        precautions: 'No special precautions required today.',
      };
    case 'moderate':
      return {
        mask: 'A mask is optional; not required for most people.',
        outdoor: 'Outdoor activities are fine; reduce intensity if you notice symptoms.',
        ventilation: 'Ventilate during cleaner hours (usually early morning).',
        exercise: 'Normal exercise is fine; shorten very long sessions.',
        precautions: 'Watch for coughing or irritated eyes and take breaks indoors.',
      };
    case 'high':
      return {
        mask: 'Wear a well-fitting FFP2/N95 mask outdoors during peak hours.',
        outdoor: 'Limit prolonged outdoor activity; prefer short outings.',
        ventilation: 'Keep windows closed during peak pollution hours.',
        exercise: 'Move workouts indoors or lower the intensity.',
        precautions: 'Avoid busy roads and stay hydrated.',
      };
    case 'severe':
      return {
        mask: 'Wear an FFP2/N95 mask whenever you go outside.',
        outdoor: 'Avoid outdoor activity as much as possible.',
        ventilation: 'Keep windows closed; use filtered air if available.',
        exercise: 'Do not exercise outdoors; postpone or train indoors.',
        precautions: 'Seek cleaner indoor spaces and contact a doctor if you feel unwell.',
      };
  }
};

const RULES: Record<HealthProfile, ProfileRule> = {
  general: {
    cautionAbove: 100,
    limitAbove: 150,
    avoidAbove: 200,
    summary: (c, aqi) => `Air quality is ${c.toLowerCase()} (AQI ${aqi}). Most people can follow their usual routine.`,
    sections: baseSections,
  },
  children: {
    cautionAbove: 50,
    limitAbove: 100,
    avoidAbove: 150,
    summary: (c, aqi) => `Air quality is ${c.toLowerCase()} (AQI ${aqi}). Children's lungs are still developing, so watch outdoor play time.`,
    sections: baseSections,
  },
  elderly: {
    cautionAbove: 50,
    limitAbove: 100,
    avoidAbove: 150,
    summary: (c, aqi) => `Air quality is ${c.toLowerCase()} (AQI ${aqi}). Older adults may be more sensitive to pollution.`,
    sections: baseSections,
  },
  asthma: {
    cautionAbove: 50,
    limitAbove: 100,
    avoidAbove: 150,
    summary: (c, aqi) => `Air quality is ${c.toLowerCase()} (AQI ${aqi}). Respiratory-sensitive people should be extra careful today.`,
    sections: baseSections,
  },
  outdoor_workers: {
    cautionAbove: 100,
    limitAbove: 150,
    avoidAbove: 200,
    summary: (c, aqi) => `Air quality is ${c.toLowerCase()} (AQI ${aqi}). Long shifts outdoors mean more exposure than the average person.`,
    sections: baseSections,
  },
  athletes: {
    cautionAbove: 50,
    limitAbove: 100,
    avoidAbove: 150,
    summary: (c, aqi) => `Air quality is ${c.toLowerCase()} (AQI ${aqi}). Deep breathing during sport increases the dose of pollution you inhale.`,
    sections: baseSections,
  },
};

function severityFor(aqi: number, rule: ProfileRule): 'low' | 'moderate' | 'high' | 'severe' {
  if (aqi >= rule.avoidAbove) return 'severe';
  if (aqi >= rule.limitAbove) return 'high';
  if (aqi >= rule.cautionAbove) return 'moderate';
  return 'low';
}

function isWindowBetterThanCurrent(point: number, current: number): boolean {
  return point < current;
}

/**
 * Deterministic, rule-based health advisory for a user profile.
 * Never diagnoses or prescribes; it only gives general guidance.
 */
export function generateAdvisory(
  profile: HealthProfile,
  aqi: number,
  category: AqiCategoryInfo,
  forecastWindows: ForecastWindow[] = []
): HealthAdvisory {
  const rule = RULES[profile];
  const severity = severityFor(aqi, rule);
  const sections = rule.sections(severity);

  const best = [...forecastWindows]
    .sort((a, b) => a.avgAqi - b.avgAqi)
    .slice(0, 2)
    .filter((w) => isWindowBetterThanCurrent(w.avgAqi, aqi));
  const worst = [...forecastWindows]
    .sort((a, b) => b.avgAqi - a.avgAqi)
    .slice(0, 2)
    .filter((w) => w.avgAqi > aqi);

  return {
    profile,
    profileLabel: PROFILE_LABELS[profile],
    categoryLabel: category.label,
    summary: rule.summary(category.label, aqi),
    sections,
    bestWindows: best,
    worstWindows: worst,
  };
}
