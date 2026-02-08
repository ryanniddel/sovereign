'use client';

import { TodaySchedule } from '@/components/dashboard/today-schedule';
import { OverdueItems } from '@/components/dashboard/overdue-items';
import { AccountabilitySummary } from '@/components/dashboard/accountability-summary';
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings';
import { QuickActions } from '@/components/dashboard/quick-actions';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-muted-foreground">Your day at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TodaySchedule />
        <OverdueItems />
        <AccountabilitySummary />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UpcomingMeetings />
        <QuickActions />
      </div>
    </div>
  );
}
