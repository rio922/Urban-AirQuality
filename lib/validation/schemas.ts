import { z } from 'zod';
import { MAX_QUESTION_LENGTH } from '@/constants/aqi';

export const aqiStandardSchema = z.enum(['us', 'eu']).default('us');

export const healthProfileSchema = z
  .enum(['general', 'children', 'elderly', 'asthma', 'outdoor_workers', 'athletes'])
  .default('general');

export const coordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const cityLocationSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  country: z.string().max(120),
  countryCode: z.string().max(4),
  admin1: z.string().max(120).nullable().optional().transform((v) => v ?? null),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timezone: z.string().max(80).nullable().optional().transform((v) => v ?? null),
  population: z.coerce.number().nullable().optional().transform((v) => v ?? null),
});

export const geocodeQuerySchema = z.object({
  q: z.string().trim().min(1, 'Enter a city name').max(80, 'Keep the search under 80 characters'),
  count: z.coerce.number().int().min(1).max(10).optional(),
});

export const airQualityQuerySchema = coordinatesSchema.extend({
  standard: aqiStandardSchema,
});

export const compareBodySchema = z.object({
  cityA: cityLocationSchema,
  cityB: cityLocationSchema,
  standard: aqiStandardSchema,
});

export const assistantBodySchema = z.object({
  question: z.string().trim().min(3, 'Ask a question').max(MAX_QUESTION_LENGTH),
  city: cityLocationSchema,
  standard: aqiStandardSchema,
  profile: healthProfileSchema,
});

export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
export type AirQualityQuery = z.infer<typeof airQualityQuerySchema>;
export type CompareBody = z.infer<typeof compareBodySchema>;
export type AssistantBody = z.infer<typeof assistantBodySchema>;
