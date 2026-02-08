'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

interface DISCProfileDisplayProps {
  discD?: number | null;
  discI?: number | null;
  discS?: number | null;
  discC?: number | null;
  onEdit?: () => void;
}

const traits = [
  { key: 'discD' as const, label: 'D - Dominance', color: 'bg-red-500' },
  { key: 'discI' as const, label: 'I - Influence', color: 'bg-yellow-500' },
  { key: 'discS' as const, label: 'S - Steadiness', color: 'bg-green-500' },
  { key: 'discC' as const, label: 'C - Conscientiousness', color: 'bg-blue-500' },
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
          <p className="text-sm text-muted-foreground">No DISC profile set</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">DISC Profile</CardTitle>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {traits.map((trait) => {
          const val = values[trait.key] ?? 0;
          return (
            <div key={trait.key}>
              <div className="flex items-center justify-between text-sm">
                <span>{trait.label}</span>
                <span className="font-medium">{val}</span>
              </div>
              <Progress value={val} className="mt-1" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
