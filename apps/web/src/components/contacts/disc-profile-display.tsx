'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DISCProfileDisplayProps {
  disc?: { dominance: number; influence: number; steadiness: number; conscientiousness: number } | null;
}

const traits = [
  { key: 'dominance', label: 'D - Dominance', color: 'bg-red-500' },
  { key: 'influence', label: 'I - Influence', color: 'bg-yellow-500' },
  { key: 'steadiness', label: 'S - Steadiness', color: 'bg-green-500' },
  { key: 'conscientiousness', label: 'C - Conscientiousness', color: 'bg-blue-500' },
] as const;

export function DISCProfileDisplay({ disc }: DISCProfileDisplayProps) {
  if (!disc) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">DISC Profile</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No DISC profile set</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">DISC Profile</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {traits.map((trait) => (
          <div key={trait.key}>
            <div className="flex items-center justify-between text-sm">
              <span>{trait.label}</span>
              <span className="font-medium">{disc[trait.key]}</span>
            </div>
            <Progress value={disc[trait.key]} className="mt-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
