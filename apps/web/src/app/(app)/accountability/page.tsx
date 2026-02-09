'use client';

import { useState } from 'react';
import { useAccountabilityDashboard, useAccountabilityScores } from '@/hooks/use-accountability';
import { Scoreboard } from '@/components/accountability/scoreboard';
import { StreakDisplay } from '@/components/accountability/streak-display';
import { ScoreTrendChart } from '@/components/accountability/score-trend-chart';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subDays, format } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const TREND_PERIODS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

export default function AccountabilityPage() {
  const [trendDays, setTrendDays] = useState('30');
  const { data: dashboard, isLoading } = useAccountabilityDashboard();
  const { data: scores } = useAccountabilityScores({
    startDate: format(subDays(new Date(), Number(trendDays)), 'yyyy-MM-dd'),
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

      {scores && scores.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <Select value={trendDays} onValueChange={setTrendDays}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TREND_PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScoreTrendChart scores={scores} />
        </div>
      )}
    </div>
  );
}
