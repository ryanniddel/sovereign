'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { useMeetings } from '@/hooks/use-meetings';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { MEETING_TYPE_LABELS } from '@/lib/constants';
import type { Meeting, MeetingType } from '@sovereign/shared';
import Link from 'next/link';

export function UpcomingMeetings() {
  const { data, isLoading } = useMeetings({ pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' });

  const meetings = data?.data || [];
  const totalMeetings = data?.pagination?.total || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
        <div className="flex items-center gap-2">
          {totalMeetings > 0 && (
            <Badge variant="outline" className="text-xs">{totalMeetings}</Badge>
          )}
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
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
          <div className="space-y-1">
            {meetings.map((meeting: Meeting) => (
              <Link
                key={meeting.id}
                href={`/meetings/${meeting.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-accent transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{meeting.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {meeting.estimatedDurationMinutes}min
                    </span>
                    {meeting.meetingType && (
                      <Badge variant="outline" className="h-4 px-1 text-[10px]">
                        {MEETING_TYPE_LABELS[meeting.meetingType as MeetingType] || meeting.meetingType}
                      </Badge>
                    )}
                    {meeting.meetingCost != null && meeting.meetingCost > 0 && (
                      <span className="flex items-center gap-0.5">
                        <DollarSign className="h-3 w-3" />
                        {Math.round(meeting.meetingCost)}
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge status={meeting.status} type="meeting" />
              </Link>
            ))}
          </div>
        )}
        <Link
          href="/meetings"
          className="mt-3 flex items-center justify-center gap-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          View All Meetings <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
