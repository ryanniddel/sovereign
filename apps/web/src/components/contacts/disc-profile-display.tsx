'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';

interface DISCProfileDisplayProps {
  discD?: number | null;
  discI?: number | null;
  discS?: number | null;
  discC?: number | null;
  onEdit?: () => void;
}

const traits = [
  {
    key: 'discD' as const,
    label: 'D - Dominance',
    color: 'bg-red-500',
    badgeColor: 'bg-red-500/10 text-red-600 border-red-500/20',
    high: 'Direct, decisive, results-oriented',
    low: 'Collaborative, cautious, deliberate',
  },
  {
    key: 'discI' as const,
    label: 'I - Influence',
    color: 'bg-yellow-500',
    badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    high: 'Enthusiastic, optimistic, persuasive',
    low: 'Reserved, reflective, fact-focused',
  },
  {
    key: 'discS' as const,
    label: 'S - Steadiness',
    color: 'bg-green-500',
    badgeColor: 'bg-green-500/10 text-green-600 border-green-500/20',
    high: 'Patient, reliable, team-oriented',
    low: 'Flexible, multitasking, change-driven',
  },
  {
    key: 'discC' as const,
    label: 'C - Conscientiousness',
    color: 'bg-blue-500',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    high: 'Analytical, precise, quality-focused',
    low: 'Spontaneous, big-picture, pragmatic',
  },
] as const;

export function DISCProfileDisplay({ discD, discI, discS, discC, onEdit }: DISCProfileDisplayProps) {
  const values = { discD, discI, discS, discC };
  const hasDisc = discD != null || discI != null || discS != null || discC != null;

  if (!hasDisc) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">DISC Profile</CardTitle>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="mr-1 h-3 w-3" />Set Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No DISC profile set. Add scores to get behavioral insights for better communication.</p>
        </CardContent>
      </Card>
    );
  }

  // Identify dominant trait
  const scored = traits.map((t) => ({ ...t, val: values[t.key] ?? 0 }));
  const dominant = scored.reduce((a, b) => (b.val > a.val ? b : a));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm">DISC Profile</CardTitle>
          <Badge variant="outline" className={dominant.badgeColor}>
            {dominant.label.split(' - ')[0]} Dominant
          </Badge>
        </div>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {scored.map((trait) => (
          <div key={trait.key}>
            <div className="flex items-center justify-between text-sm">
              <span>{trait.label}</span>
              <span className="font-medium">{trait.val}</span>
            </div>
            <Progress value={trait.val} className="mt-1" />
            <p className="mt-0.5 text-xs text-muted-foreground">
              {trait.val >= 50 ? trait.high : trait.low}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
