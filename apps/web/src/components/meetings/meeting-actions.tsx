'use client';

import { Button } from '@/components/ui/button';
import { MeetingStatus } from '@sovereign/shared';
import {
  useQualifyMeeting,
  useScheduleMeeting,
  useStartMeeting,
  useCompleteMeeting,
  useCancelMeeting,
} from '@/hooks/use-meetings';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useState } from 'react';

interface MeetingActionsProps {
  meetingId: string;
  status: MeetingStatus;
}

export function MeetingActions({ meetingId, status }: MeetingActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const qualify = useQualifyMeeting();
  const schedule = useScheduleMeeting();
  const start = useStartMeeting();
  const complete = useCompleteMeeting();
  const cancel = useCancelMeeting();

  return (
    <div className="flex flex-wrap gap-2">
      {status === MeetingStatus.REQUESTED && (
        <>
          <Button
            size="sm"
            onClick={() => qualify.mutate({ id: meetingId, approved: true })}
            disabled={qualify.isPending}
          >
            Qualify
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => qualify.mutate({ id: meetingId, approved: false, rejectionReason: 'Not needed' })}
            disabled={qualify.isPending}
          >
            Reject
          </Button>
        </>
      )}

      {status === MeetingStatus.QUALIFIED && (
        <Button size="sm" onClick={() => schedule.mutate(meetingId)} disabled={schedule.isPending}>
          Schedule
        </Button>
      )}

      {(status === MeetingStatus.SCHEDULED || status === MeetingStatus.PREP_SENT) && (
        <Button size="sm" onClick={() => start.mutate(meetingId)} disabled={start.isPending}>
          Start Meeting
        </Button>
      )}

      {status === MeetingStatus.IN_PROGRESS && (
        <Button size="sm" onClick={() => complete.mutate(meetingId)} disabled={complete.isPending}>
          Complete Meeting
        </Button>
      )}

      {status !== MeetingStatus.COMPLETED &&
        status !== MeetingStatus.CANCELLED &&
        status !== MeetingStatus.AUTO_CANCELLED && (
          <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>
            Cancel
          </Button>
        )}

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Meeting"
        description="Are you sure you want to cancel this meeting? This action cannot be undone."
        variant="destructive"
        confirmLabel="Cancel Meeting"
        onConfirm={() => cancel.mutate(meetingId)}
        loading={cancel.isPending}
      />
    </div>
  );
}
