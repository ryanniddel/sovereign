'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Clock, MapPin, Calendar, Shield, Car, Trash2, ExternalLink, Pencil, Repeat } from 'lucide-react';
import { CALENDAR_EVENT_TYPE_LABELS, CALENDAR_EVENT_TYPE_COLORS } from '@/lib/constants';
import { useDeleteEvent } from '@/hooks/use-calendar';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useState } from 'react';
import Link from 'next/link';
import type { CalendarEvent, CalendarEventType } from '@sovereign/shared';

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: CalendarEvent) => void;
}

export function EventDetailSheet({ event, open, onOpenChange, onEdit }: EventDetailSheetProps) {
  const deleteEvent = useDeleteEvent();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!event) return null;

  const handleDelete = () => {
    deleteEvent.mutate(event.id, {
      onSuccess: () => {
        setConfirmDelete(false);
        onOpenChange(false);
      },
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{event.title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <div className={`h-3 w-3 rounded-full ${CALENDAR_EVENT_TYPE_COLORS[event.eventType as CalendarEventType] || 'bg-gray-500'}`} />
              <Badge variant="outline">
                {CALENDAR_EVENT_TYPE_LABELS[event.eventType as CalendarEventType] || event.eventType}
              </Badge>
              {event.isProtected && (
                <Badge variant="secondary">
                  <Shield className="mr-1 h-3 w-3" />
                  Protected
                </Badge>
              )}
              {event.isAllDay && (
                <Badge variant="secondary">All Day</Badge>
              )}
              {event.recurrenceRule && (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-500">
                  <Repeat className="mr-1 h-3 w-3" />
                  Recurring
                </Badge>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(event.startTime), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event.isAllDay
                    ? 'All day'
                    : `${format(new Date(event.startTime), 'h:mm a')} - ${format(new Date(event.endTime), 'h:mm a')}`}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
            </div>

            {event.description && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-wrap">{event.description}</p>
                </div>
              </>
            )}

            {(event.bufferBeforeMinutes > 0 || event.bufferAfterMinutes > 0 || (event.travelBufferMinutes ?? 0) > 0) && (
              <>
                <Separator />
                <div className="space-y-1 text-sm text-muted-foreground">
                  {event.bufferBeforeMinutes > 0 && (
                    <p className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {event.bufferBeforeMinutes}min buffer before
                    </p>
                  )}
                  {event.bufferAfterMinutes > 0 && (
                    <p className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      {event.bufferAfterMinutes}min buffer after
                    </p>
                  )}
                  {(event.travelBufferMinutes ?? 0) > 0 && (
                    <p className="flex items-center gap-2">
                      <Car className="h-3.5 w-3.5" />
                      {event.travelBufferMinutes}min travel time
                    </p>
                  )}
                </div>
              </>
            )}

            {event.meetingId && (
              <>
                <Separator />
                <Link href={`/meetings/${event.meetingId}`}>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Linked Meeting
                  </Button>
                </Link>
              </>
            )}

            <Separator />
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(event);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Event"
        description={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        loading={deleteEvent.isPending}
        variant="destructive"
      />
    </>
  );
}
