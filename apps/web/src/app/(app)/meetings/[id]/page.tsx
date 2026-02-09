'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMeeting, useAddParticipant, useRemoveParticipant, useAcknowledgeParticipant } from '@/hooks/use-meetings';
import { LifecycleTracker } from '@/components/meetings/lifecycle-tracker';
import { MeetingActions } from '@/components/meetings/meeting-actions';
import { ParticipantList } from '@/components/meetings/participant-list';
import { AddParticipantDialog } from '@/components/meetings/add-participant-dialog';
import { CostDisplay } from '@/components/meetings/cost-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { format } from 'date-fns';
import { MeetingStatus } from '@sovereign/shared';
import { MEETING_TYPE_LABELS } from '@/lib/constants';
import type { MeetingType, MeetingParticipant, ParticipantRole } from '@sovereign/shared';
import { Clock, DollarSign, FileText, Star, ExternalLink, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: meeting, isLoading } = useMeeting(id);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const addParticipant = useAddParticipant();
  const removeParticipant = useRemoveParticipant();
  const acknowledgeParticipant = useAcknowledgeParticipant();

  if (isLoading) return <PageSkeleton />;
  if (!meeting) return <p>Meeting not found</p>;

  const isCancelled = meeting.status === MeetingStatus.CANCELLED || meeting.status === MeetingStatus.AUTO_CANCELLED;
  const isTerminal = isCancelled || meeting.status === MeetingStatus.COMPLETED;
  const participants = meeting.participants || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{meeting.title}</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={meeting.status} type="meeting" />
            <Badge variant="outline">{MEETING_TYPE_LABELS[meeting.meetingType as MeetingType]}</Badge>
            {meeting.isRecurring && <Badge variant="secondary">Recurring</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {meeting.status === MeetingStatus.COMPLETED && !meeting.recapContent && (
            <Button asChild size="sm">
              <Link href={`/meetings/${id}/recap`}>Submit Recap</Link>
            </Button>
          )}
          {meeting.status === MeetingStatus.COMPLETED && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/meetings/${id}/rate`}>Rate Meeting</Link>
            </Button>
          )}
        </div>
      </div>

      <LifecycleTracker currentStatus={meeting.status as MeetingStatus} cancelled={isCancelled} />

      <MeetingActions
        meetingId={id}
        status={meeting.status as MeetingStatus}
        hasAgenda={!!meeting.agendaUrl}
        hasPreRead={!!meeting.preReadUrl}
      />

      {meeting.rejectionReason && (
        <Card className="border-l-4 border-l-destructive">
          <CardContent className="flex items-start gap-3 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium">Rejection Reason</p>
              <p className="text-sm text-muted-foreground">{meeting.rejectionReason}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <CostDisplay
        hourlyRate={meeting.hourlyRate}
        durationMinutes={meeting.actualDurationMinutes || meeting.estimatedDurationMinutes}
        meetingCost={meeting.meetingCost}
        participantCount={participants.length}
      />

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        {/* Details */}
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
            {meeting.agendaUrl && (
              <div>
                <p className="text-xs text-muted-foreground">Agenda</p>
                <a href={meeting.agendaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                  View Agenda <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {meeting.preReadUrl && (
              <div>
                <p className="text-xs text-muted-foreground">Pre-Read</p>
                <a href={meeting.preReadUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary inline-flex items-center gap-1 hover:underline">
                  View Pre-Read <ExternalLink className="h-3 w-3" />
                </a>
                {meeting.preReadDeadline && (
                  <p className="text-xs text-muted-foreground">Deadline: {format(new Date(meeting.preReadDeadline), 'PPp')}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics */}
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
            {meeting.meetingCost != null && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">${meeting.meetingCost.toFixed(2)} cost</span>
              </div>
            )}
            {meeting.rating != null && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Rating: {meeting.rating}/5</span>
                {meeting.valueScore != null && (
                  <span className="text-sm text-muted-foreground">(Value: {meeting.valueScore}/5)</span>
                )}
              </div>
            )}
            {meeting.wasNecessary != null && (
              <div className="text-sm">
                {meeting.wasNecessary ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Necessary</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rated Unnecessary</Badge>
                )}
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(meeting.createdAt), 'PPp')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recap */}
      {meeting.recapContent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm whitespace-pre-wrap">{meeting.recapContent}</p>
            {meeting.transcriptUrl && (
              <a href={meeting.transcriptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                View Transcript <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Participants ({participants.length})</CardTitle>
            {!isTerminal && (
              <Button size="sm" variant="outline" onClick={() => setAddParticipantOpen(true)}>
                Add Participant
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ParticipantList
            participants={participants}
            canManage={!isTerminal}
            onRemove={(pid) => removeParticipant.mutate({ meetingId: id, participantId: pid })}
            onAcknowledge={meeting.preReadUrl ? (pid) => acknowledgeParticipant.mutate({ meetingId: id, participantId: pid }) : undefined}
          />
        </CardContent>
      </Card>

      <AddParticipantDialog
        open={addParticipantOpen}
        onOpenChange={setAddParticipantOpen}
        onAdd={(data) =>
          addParticipant.mutate(
            { meetingId: id, email: data.email, name: data.name, role: data.role as ParticipantRole },
            { onSuccess: () => setAddParticipantOpen(false) },
          )
        }
        loading={addParticipant.isPending}
      />
    </div>
  );
}
