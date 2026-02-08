'use client';

import { useAccountabilityDashboard, useAccountabilityScores } from '@/hooks/use-accountability';
import { Scoreboard } from '@/components/accountability/scoreboard';
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

      {dashboard && <Scoreboard dashboard={dashboard} />}

      {dashboard?.streaks && <StreakDisplay streaks={dashboard.streaks} />}

      {scores && scores.length > 0 && <ScoreTrendChart scores={scores} />}
    </div>
  );
}
