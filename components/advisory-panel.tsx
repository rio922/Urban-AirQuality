import { AlertCircle, CheckCircle2, Dumbbell, House, ShieldAlert, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PROFILE_LABELS } from '@/constants/aqi';
import type { HealthAdvisory, HealthProfile } from '@/types';

interface AdvisoryPanelProps {
  advisory: HealthAdvisory;
  profile: HealthProfile;
  onProfileChange: (profile: HealthProfile) => void;
}

const PROFILE_ORDER: HealthProfile[] = [
  'general',
  'children',
  'elderly',
  'asthma',
  'outdoor_workers',
  'athletes',
];

function formatWindowLabel(startTime: string, endTime: string): string {
  return `${startTime.slice(11, 16)}–${endTime.slice(11, 16)}`;
}

/** Personalized, rule-based health advisory with profile selection. */
export function AdvisoryPanel({ advisory, profile, onProfileChange }: AdvisoryPanelProps) {
  const sections = [
    { icon: ShieldAlert, label: 'Masks', text: advisory.sections.mask },
    { icon: Wind, label: 'Outdoor activity', text: advisory.sections.outdoor },
    { icon: Dumbbell, label: 'Exercise', text: advisory.sections.exercise },
    { icon: House, label: 'Ventilation', text: advisory.sections.ventilation },
    { icon: AlertCircle, label: 'Precautions', text: advisory.sections.precautions },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your health guidance</CardTitle>
        <RadioGroup
          value={profile}
          onValueChange={(value) => onProfileChange(value as HealthProfile)}
          className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3"
          aria-label="Choose your health profile"
        >
          {PROFILE_ORDER.map((p) => (
            <div key={p} className="flex items-center gap-2 rounded-md border px-2 py-1.5">
              <RadioGroupItem value={p} id={`profile-${p}`} />
              <Label htmlFor={`profile-${p}`} className="cursor-pointer text-xs font-normal sm:text-sm">
                {PROFILE_LABELS[p]}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardHeader>
      <CardContent className="space-y-4">
        <p aria-live="polite" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
          {advisory.summary}
        </p>

        <ul className="space-y-2.5">
          {sections.map(({ icon: Icon, label, text }) => (
            <li key={label} className="flex gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        {(advisory.bestWindows.length > 0 || advisory.worstWindows.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {advisory.bestWindows.length > 0 && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Best windows
                </p>
                <ul className="mt-1.5 space-y-1">
                  {advisory.bestWindows.map((w) => (
                    <li key={w.startTime} className="text-sm text-muted-foreground">
                      {formatWindowLabel(w.startTime, w.endTime)} · AQI {w.avgAqi}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {advisory.worstWindows.length > 0 && (
              <div className="rounded-lg border border-orange-500/40 bg-orange-500/5 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium text-orange-700 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" /> Worst windows
                </p>
                <ul className="mt-1.5 space-y-1">
                  {advisory.worstWindows.map((w) => (
                    <li key={w.startTime} className="text-sm text-muted-foreground">
                      {formatWindowLabel(w.startTime, w.endTime)} · AQI {w.avgAqi}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-1.5">Notice</Badge>
          General guidance only — not a medical diagnosis. Ask a doctor about personal symptoms.
        </p>
      </CardContent>
    </Card>
  );
}
