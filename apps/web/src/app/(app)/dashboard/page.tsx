'use client';

import { TodaySchedule } from '@/components/dashboard/today-schedule';
import { OverdueItems } from '@/components/dashboard/overdue-items';
import { AccountabilitySummary } from '@/components/dashboard/accountability-summary';
import { UpcomingMeetings } from '@/components/dashboard/upcoming-meetings';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { BriefingStatus } from '@/components/dashboard/briefing-status';
import { useCurrentUser } from '@/hooks/use-users';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { data: user } = useCurrentUser();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-muted-foreground">
          {format(now, 'EEEE, MMMM d, yyyy')} &middot; Command Center
        </p>
      </div>

      {/* Row 1: Primary status cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TodaySchedule />
        <OverdueItems />
        <AccountabilitySummary />
      </div>

      {/* Row 2: Meetings, Briefings, Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <UpcomingMeetings />
        <BriefingStatus />
        <QuickActions />
      </div>
    </div>
  );
}
