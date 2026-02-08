'use client';

import { useParams } from 'next/navigation';
import { useMeeting } from '@/hooks/use-meetings';
import { LifecycleTracker } from '@/components/meetings/lifecycle-tracker';
import { MeetingActions } from '@/components/meetings/meeting-actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { format } from 'date-fns';
import { MeetingStatus } from '@sovereign/shared';
import { MEETING_TYPE_LABELS } from '@/lib/constants';
import type { MeetingType } from '@sovereign/shared';
import { Clock, DollarSign, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: meeting, isLoading } = useMeeting(id);

  if (isLoading) return <PageSkeleton />;
  if (!meeting) return <p>Meeting not found</p>;

  const isCancelled = meeting.status === MeetingStatus.CANCELLED || meeting.status === MeetingStatus.AUTO_CANCELLED;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={meeting.status} type="meeting" />
            <Badge variant="outline">{MEETING_TYPE_LABELS[meeting.meetingType as MeetingType]}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {meeting.status === MeetingStatus.COMPLETED && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/meetings/${id}/rate`}>Rate Meeting</Link>
            </Button>
          )}
        </div>
      </div>

      <LifecycleTracker currentStatus={meeting.status as MeetingStatus} cancelled={isCancelled} />

      <MeetingActions meetingId={id} status={meeting.status as MeetingStatus} />

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {meeting.purpose && (
              <div>
                <p className="text-xs text-muted-foreground">Purpose</p>
                <p className="text-sm">{meeting.purpose}</p>
              </div>
            )}
            {meeting.description && (
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{meeting.description}</p>
              </div>
            )}
            {meeting.decisionRequired && (
              <div>
                <p className="text-xs text-muted-foreground">Decision Required</p>
                <p className="text-sm">{meeting.decisionRequired}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{meeting.estimatedDurationMinutes} min estimated</span>
              {meeting.actualDurationMinutes && (
                <span className="text-sm text-muted-foreground">({meeting.actualDurationMinutes} actual)</span>
              )}
            </div>
            {meeting.meetingCost && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">${meeting.meetingCost.toFixed(2)} cost</span>
              </div>
            )}
            {meeting.rating && (
              <div className="flex items-center gap-2">
                <span className="text-sm">Rating: {meeting.rating}/5</span>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(meeting.createdAt), 'PPp')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
