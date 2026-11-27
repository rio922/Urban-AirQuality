# Project memory

## Product intent & audience

- Air quality dashboard app providing current AQI, forecasts, city comparison, and an AI assistant.
- End users query air quality by location; AQI supports `us` and `eu` standards.

## Brand personality & voice

- Engineering tone in assistant explanations: causal ("went wrong / fixed"), enumerates root cause + related fixes, confirms verification.

## Visual design & UX direction

- Inferred stack: Next.js (~13.x), Tailwind CSS, shadcn/ui, lucide-react icons.
- Theme color tags must go in `metadata` (not `viewport` export — unsupported by the framework version in use).

## Decisions, constraints & rationale

- Deployed on Netlify via `@netlify/plugin-nextjs`; build command `npx next build` from `netlify.toml`.
- TypeScript strict; production build must pass `next build` type checking (linting is skipped).
- Input-validation helper uses Zod with defaulted fields; helper is generic to preserve exact output types (defaults must not surface as `undefined`).
- Optional validated fields are made nullable with safe defaults (e.g. empty strings) at the validation boundary so downstream code can treat them as always present.
- Build target raised to a modern JS baseline (old target broke `Map` iteration / modern patterns).
- AQI engine computes per-pollutant readings and includes them in its returned result.
- APIs integrated: open-meteo (air quality + forecast), Supabase (admin client + realtime).
- API routes confirmed building: air-quality, dashboard, forecast, comparison, AI assistant.
- AI assistant route degrades gracefully: returns a direct data summary when no AI key is set; enables Claude-style AI answers once an env key is configured.

## Open questions & assumptions

- Exact Next.js minor version not confirmed (treated as 13.x based on `viewport` export limitation).
- `@netlify/plugin-nextjs` is outdated on the deployment (5.15.1 vs 5.16.9); upgrade not yet applied.
- Browserslist `caniuse-lite` is outdated; non-blocking warning.
- Supabase realtime import triggers a non-blocking "critical dependency" warning from `realtime-js`.
- No build cache configured on Netlify (warning only).