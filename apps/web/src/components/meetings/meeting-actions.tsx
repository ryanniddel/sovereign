'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MeetingStatus } from '@sovereign/shared';
import {
  useQualifyMeeting,
  useScheduleMeeting,
  useRescheduleMeeting,
  useSubmitAgenda,
  useDistributePreRead,
  useStartMeeting,
  useCompleteMeeting,
  useCancelMeeting,
} from '@/hooks/use-meetings';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useState } from 'react';
import { CalendarClock, FileText, BookOpen } from 'lucide-react';

interface MeetingActionsProps {
  meetingId: string;
  status: MeetingStatus;
  hasAgenda?: boolean;
  hasPreRead?: boolean;
}

export function MeetingActions({ meetingId, status, hasAgenda, hasPreRead }: MeetingActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
  const [preReadOpen, setPreReadOpen] = useState(false);

  const qualify = useQualifyMeeting();
  const schedule = useScheduleMeeting();
  const reschedule = useRescheduleMeeting();
  const submitAgenda = useSubmitAgenda();
  const distributePreRead = useDistributePreRead();
  const start = useStartMeeting();
  const complete = useCompleteMeeting();
  const cancel = useCancelMeeting();

  const isTerminal = status === MeetingStatus.COMPLETED ||
    status === MeetingStatus.CANCELLED ||
    status === MeetingStatus.AUTO_CANCELLED;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Qualify / Reject */}
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

        {/* Schedule */}
        {status === MeetingStatus.QUALIFIED && (
          <Button size="sm" onClick={() => schedule.mutate(meetingId)} disabled={schedule.isPending}>
            Schedule
          </Button>
        )}

        {/* Reschedule (available when scheduled or prep sent) */}
        {(status === MeetingStatus.SCHEDULED || status === MeetingStatus.PREP_SENT) && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRescheduleOpen(true)}>
            <CalendarClock className="h-3.5 w-3.5" />
            Reschedule
          </Button>
        )}

        {/* Submit Agenda (available after scheduling, before agenda is set) */}
        {(status === MeetingStatus.SCHEDULED || status === MeetingStatus.QUALIFIED) && !hasAgenda && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAgendaOpen(true)}>
            <FileText className="h-3.5 w-3.5" />
            Submit Agenda
          </Button>
        )}

        {/* Distribute Pre-Read (available after scheduling, when no pre-read yet) */}
        {(status === MeetingStatus.SCHEDULED) && !hasPreRead && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPreReadOpen(true)}>
            <BookOpen className="h-3.5 w-3.5" />
            Distribute Pre-Read
          </Button>
        )}

        {/* Start Meeting */}
        {(status === MeetingStatus.SCHEDULED || status === MeetingStatus.PREP_SENT) && (
          <Button size="sm" onClick={() => start.mutate(meetingId)} disabled={start.isPending}>
            Start Meeting
          </Button>
        )}

        {/* Complete Meeting */}
        {status === MeetingStatus.IN_PROGRESS && (
          <Button size="sm" onClick={() => complete.mutate(meetingId)} disabled={complete.isPending}>
            Complete Meeting
          </Button>
        )}

        {/* Cancel (available for any non-terminal state) */}
        {!isTerminal && (
          <Button size="sm" variant="outline" onClick={() => setCancelOpen(true)}>
            Cancel
          </Button>
        )}
      </div>

      {/* Cancel Confirmation */}
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

      {/* Reschedule Dialog */}
      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        meetingId={meetingId}
        onSubmit={(data) => reschedule.mutate(
          { id: meetingId, ...data },
          { onSuccess: () => setRescheduleOpen(false) },
        )}
        loading={reschedule.isPending}
      />

      {/* Agenda Dialog */}
      <AgendaDialog
        open={agendaOpen}
        onOpenChange={setAgendaOpen}
        onSubmit={(agendaUrl) => submitAgenda.mutate(
          { id: meetingId, agendaUrl },
          { onSuccess: () => setAgendaOpen(false) },
        )}
        loading={submitAgenda.isPending}
      />

      {/* Pre-Read Dialog */}
      <PreReadDialog
        open={preReadOpen}
        onOpenChange={setPreReadOpen}
        onSubmit={(data) => distributePreRead.mutate(
          { id: meetingId, ...data },
          { onSuccess: () => setPreReadOpen(false) },
        )}
        loading={distributePreRead.isPending}
      />
    </>
  );
}

// ── Reschedule Dialog ──

function RescheduleDialog({
  open, onOpenChange, meetingId, onSubmit, loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  onSubmit: (data: { startTime: string; endTime: string; reason?: string; location?: string }) => void;
  loading: boolean;
}) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;
    onSubmit({
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      reason: reason || undefined,
      location: location || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Start Time</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>New End Time</Label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-2">
            <Label>Reason for Reschedule</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Rescheduling...' : 'Reschedule'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Agenda Dialog ──

function AgendaDialog({
  open, onOpenChange, onSubmit, loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (agendaUrl: string) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    onSubmit(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Agenda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Agenda URL</Label>
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
            <p className="text-xs text-muted-foreground">Link to the meeting agenda document</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Agenda'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Pre-Read Dialog ──

function PreReadDialog({
  open, onOpenChange, onSubmit, loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { preReadUrl: string; deadline?: string }) => void;
  loading: boolean;
}) {
  const [url, setUrl] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    onSubmit({
      preReadUrl: url,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Distribute Pre-Read</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Pre-Read URL</Label>
            <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." required />
            <p className="text-xs text-muted-foreground">Link to the pre-read document for participants</p>
          </div>
          <div className="space-y-2">
            <Label>Acknowledgment Deadline</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <p className="text-xs text-muted-foreground">Optional deadline for participants to acknowledge the pre-read</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Distributing...' : 'Distribute Pre-Read'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
