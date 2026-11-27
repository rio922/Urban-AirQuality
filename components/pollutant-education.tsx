import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { PollutantKey } from '@/types';

interface PollutantInfo {
  key: PollutantKey;
  name: string;
  fullName: string;
  sources: string;
  effects: string;
  health: string;
}

const POLLUTANTS: PollutantInfo[] = [
  {
    key: 'pm2_5',
    name: 'PM2.5',
    fullName: 'Fine particles (≤ 2.5 µm)',
    sources: 'Vehicle engines, wood burning, power plants and wildfires.',
    effects: 'Hazes the sky, reduces visibility and can travel deep into buildings.',
    health: 'Small enough to reach deep into the lungs and enter the bloodstream; linked to heart and lung problems.',
  },
  {
    key: 'pm10',
    name: 'PM10',
    fullName: 'Coarse particles (≤ 10 µm)',
    sources: 'Road dust, construction sites, pollen and sea salt.',
    effects: 'Settles on surfaces and can irritate eyes and airways outdoors.',
    health: 'Irritates the nose, throat and airways; worsens asthma and allergies.',
  },
  {
    key: 'no2',
    name: 'NO₂',
    fullName: 'Nitrogen dioxide',
    sources: 'Traffic, especially diesel vehicles, and gas boilers.',
    effects: 'Contributes to smog and acid rain near busy roads.',
    health: 'Inflames airways, triggers asthma and lowers resistance to infections.',
  },
  {
    key: 'o3',
    name: 'O₃',
    fullName: 'Ground-level ozone',
    sources: 'Formed when sunlight reacts with traffic and industrial gases; not emitted directly.',
    effects: 'Main ingredient of summer smog; peaks on hot, sunny afternoons.',
    health: 'Causes chest tightness, coughing and reduced lung function during exercise.',
  },
  {
    key: 'so2',
    name: 'SO₂',
    fullName: 'Sulfur dioxide',
    sources: 'Coal and oil burning in power plants and industry.',
    effects: 'Forms acid rain and fine sulfate particles.',
    health: 'Irritates the airways; people with asthma are especially sensitive.',
  },
  {
    key: 'co',
    name: 'CO',
    fullName: 'Carbon monoxide',
    sources: 'Car exhaust, faulty heaters and any incomplete fuel burning.',
    effects: 'Colorless and odorless; accumulates in poorly ventilated spaces.',
    health: 'Reduces the blood\u2019s oxygen supply; causes dizziness and fatigue at high levels.',
  },
];

/** Interactive pollutant education section with accessible disclosure. */
export function PollutantEducation() {
  return (
    <section aria-labelledby="pollutant-education-heading" className="rounded-xl border bg-card p-4">
      <h2 id="pollutant-education-heading" className="mb-1 text-lg font-semibold">
        Understanding the pollutants
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        What each pollutant is, where it comes from, and why it matters for your health.
      </p>
      <Accordion type="single" collapsible className="w-full">
        {POLLUTANTS.map((p) => (
          <AccordionItem key={p.key} value={p.key}>
            <AccordionTrigger className="text-left">
              <span className="flex items-center gap-2">
                <Badge variant="secondary">{p.name}</Badge>
                <span className="font-normal text-sm">{p.fullName}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="font-medium">Main sources</dt>
                  <dd className="text-muted-foreground">{p.sources}</dd>
                </div>
                <div>
                  <dt className="font-medium">Environmental effect</dt>
                  <dd className="text-muted-foreground">{p.effects}</dd>
                </div>
                <div>
                  <dt className="font-medium">Health impact</dt>
                  <dd className="text-muted-foreground">{p.health}</dd>
                </div>
              </dl>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
