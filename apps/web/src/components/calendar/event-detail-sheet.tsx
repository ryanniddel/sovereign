'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Clock, MapPin, Calendar } from 'lucide-react';
import { CALENDAR_EVENT_TYPE_LABELS, CALENDAR_EVENT_TYPE_COLORS } from '@/lib/constants';
import type { CalendarEvent, CalendarEventType } from '@sovereign/shared';

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailSheet({ event, open, onOpenChange }: EventDetailSheetProps) {
  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{event.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${CALENDAR_EVENT_TYPE_COLORS[event.eventType as CalendarEventType] || 'bg-gray-500'}`} />
            <Badge variant="outline">
              {CALENDAR_EVENT_TYPE_LABELS[event.eventType as CalendarEventType] || event.eventType}
            </Badge>
            {event.isProtected && <Badge variant="secondary">Protected</Badge>}
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
                <p className="text-sm">{event.description}</p>
              </div>
            </>
          )}

          {(event.bufferBeforeMinutes > 0 || event.bufferAfterMinutes > 0) && (
            <>
              <Separator />
              <div className="text-sm text-muted-foreground">
                {event.bufferBeforeMinutes > 0 && <p>{event.bufferBeforeMinutes}min buffer before</p>}
                {event.bufferAfterMinutes > 0 && <p>{event.bufferAfterMinutes}min buffer after</p>}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
