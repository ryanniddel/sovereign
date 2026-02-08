'use client';

import { DollarSign, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CostDisplayProps {
  hourlyRate?: number;
  durationMinutes: number;
  meetingCost?: number;
  participantCount?: number;
}

export function CostDisplay({ hourlyRate, durationMinutes, meetingCost, participantCount }: CostDisplayProps) {
  const calculatedCost = meetingCost ?? (hourlyRate ? (hourlyRate / 60) * durationMinutes * (participantCount || 1) : 0);

  return (
    <Card>
      <CardContent className="flex items-center gap-6 pt-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold">${calculatedCost.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Meeting cost</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-lg font-bold">{durationMinutes}min</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
        </div>
        {hourlyRate && (
          <div>
            <p className="text-sm font-medium">${hourlyRate}/hr</p>
            <p className="text-xs text-muted-foreground">Rate</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
