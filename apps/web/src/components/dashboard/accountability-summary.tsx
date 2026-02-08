'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, Flame, TrendingUp, TrendingDown, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAccountabilityDashboard } from '@/hooks/use-accountability';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

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

  const latestScore = data?.latestScore;
  const streaks = data?.streaks;
  const trends = data?.trends;
  const score = latestScore?.onTimeRate ?? 0;
  const scorePercent = Math.round(score * 100);

  // Current streak (find the active one)
  const currentStreak = streaks?.reduce(
    (max, s) => (s.currentCount > max ? s.currentCount : max),
    0,
  ) ?? 0;

  // 7-day trend
  const sevenDayRate = trends?.sevenDay?.onTimeRate;
  const thirtyDayRate = trends?.thirtyDay?.onTimeRate;
  const trendUp = sevenDayRate != null && thirtyDayRate != null ? sevenDayRate >= thirtyDayRate : null;

  // Closeout status
  const closeoutDone = data?.lastCloseoutCompleted ?? false;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Accountability</CardTitle>
        <Target className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Score + Trend */}
          <div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{scorePercent}%</span>
                {trendUp !== null && (
                  trendUp ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )
                )}
              </div>
              <span className="text-xs text-muted-foreground">On-time rate</span>
            </div>
            <Progress value={scorePercent} className="mt-2" />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-semibold">{latestScore?.commitmentsMade ?? 0}</p>
              <p className="text-xs text-muted-foreground">Made</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-500">{latestScore?.commitmentsDelivered ?? 0}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-destructive">{latestScore?.commitmentsMissed ?? 0}</p>
              <p className="text-xs text-muted-foreground">Missed</p>
            </div>
          </div>

          {/* Streak + Closeout */}
          <div className="flex items-center gap-2">
            {currentStreak > 0 && (
              <div className="flex flex-1 items-center gap-2 rounded-md bg-orange-500/10 px-3 py-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{currentStreak} day streak</span>
              </div>
            )}
            <div className={`flex flex-1 items-center gap-2 rounded-md px-3 py-1.5 ${closeoutDone ? 'bg-emerald-500/10' : 'bg-muted'}`}>
              <CheckCircle2 className={`h-4 w-4 ${closeoutDone ? 'text-emerald-500' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">{closeoutDone ? 'Closed out' : 'Not closed'}</span>
            </div>
          </div>
        </div>

        <Link
          href="/accountability"
          className="mt-3 flex items-center justify-center gap-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          View Dashboard <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
