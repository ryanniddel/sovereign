'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';
import { useMeetings } from '@/hooks/use-meetings';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';
import Link from 'next/link';
import type { Meeting } from '@sovereign/shared';

export function UpcomingMeetings() {
  const { data, isLoading } = useMeetings({ pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' });

  const meetings = data?.data || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !meetings.length ? (
          <p className="text-sm text-muted-foreground">No upcoming meetings</p>
        ) : (
          <div className="space-y-2">
            {meetings.map((meeting: Meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-accent transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{meeting.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {meeting.estimatedDurationMinutes}min
                  </div>
                </div>
                <StatusBadge status={meeting.status} type="meeting" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
