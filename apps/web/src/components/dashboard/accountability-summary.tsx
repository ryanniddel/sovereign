'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target, Flame } from 'lucide-react';
import { useAccountabilityDashboard } from '@/hooks/use-accountability';
import { Skeleton } from '@/components/ui/skeleton';

export function AccountabilitySummary() {
  const { data, isLoading } = useAccountabilityDashboard();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-4" />
        </CardContent>
      </Card>
    );
  }

  const summary = data?.summary;
  const streaks = data?.streaks;
  const score = summary?.onTimeRate ?? 0;
  const longestStreak = streaks?.reduce(
    (max, s) => (s.currentCount > max ? s.currentCount : max),
    0,
  ) ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Accountability</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{Math.round(score * 100)}%</span>
              <span className="text-xs text-muted-foreground">On-time rate</span>
            </div>
            <Progress value={score * 100} className="mt-2" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-semibold">{summary?.totalCommitments ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-500">{summary?.delivered ?? 0}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-destructive">{summary?.missed ?? 0}</p>
              <p className="text-xs text-muted-foreground">Missed</p>
            </div>
          </div>

          {longestStreak > 0 && (
            <div className="flex items-center gap-2 rounded-md bg-orange-500/10 px-3 py-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{longestStreak} day streak</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
