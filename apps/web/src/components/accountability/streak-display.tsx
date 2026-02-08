'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Trophy } from 'lucide-react';
import type { Streak, StreakType } from '@sovereign/shared';

const STREAK_LABELS: Record<string, string> = {
  DAILY_CLOSEOUT: 'Daily Closeout',
  COMMITMENT_DELIVERY: 'Commitment Delivery',
  MEETING_PREP: 'Meeting Prep',
  ON_TIME: 'On Time',
};

interface StreakDisplayProps {
  streaks: Streak[];
}

export function StreakDisplay({ streaks }: StreakDisplayProps) {
  if (!streaks?.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {streaks.map((streak) => (
        <Card key={streak.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {STREAK_LABELS[streak.type] || streak.type}
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{streak.currentCount}</span>
              <span className="text-sm text-muted-foreground">days</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Trophy className="h-3 w-3" />
              Best: {streak.longestCount} days
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
