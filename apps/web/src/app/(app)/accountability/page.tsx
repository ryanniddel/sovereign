'use client';

import { useAccountabilityDashboard, useAccountabilityScores } from '@/hooks/use-accountability';
import { ScoreCard } from '@/components/accountability/score-card';
import { StreakDisplay } from '@/components/accountability/streak-display';
import { ScoreTrendChart } from '@/components/accountability/score-trend-chart';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { subDays, format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AccountabilityPage() {
  const { data: dashboard, isLoading } = useAccountabilityDashboard();
  const { data: scores } = useAccountabilityScores({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  if (isLoading) return <PageSkeleton />;

  const summary = dashboard?.summary;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Accountability Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/accountability/action-items">Action Items</Link></Button>
          <Button variant="outline" asChild><Link href="/accountability/commitments">Commitments</Link></Button>
          <Button variant="outline" asChild><Link href="/accountability/agreements">Agreements</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ScoreCard
          title="Commitments Delivered"
          value={summary?.delivered ?? 0}
          total={summary?.totalCommitments ?? 0}
          percentage={summary?.totalCommitments ? ((summary?.delivered ?? 0) / summary.totalCommitments) * 100 : 0}
        />
        <ScoreCard
          title="On-Time Rate"
          value={Math.round((summary?.onTimeRate ?? 0) * 100)}
          total={100}
          percentage={(summary?.onTimeRate ?? 0) * 100}
        />
        <ScoreCard
          title="Missed"
          value={summary?.missed ?? 0}
          total={summary?.totalCommitments ?? 0}
          percentage={summary?.totalCommitments ? ((summary?.missed ?? 0) / summary.totalCommitments) * 100 : 0}
        />
      </div>

      {dashboard?.streaks && <StreakDisplay streaks={dashboard.streaks} />}

      {scores && scores.length > 0 && <ScoreTrendChart scores={scores} />}
    </div>
  );
}
