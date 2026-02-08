'use client';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CALENDAR_EVENT_TYPE_COLORS, CALENDAR_EVENT_TYPE_LABELS } from '@/lib/constants';
import type { CalendarEvent, CalendarEventType } from '@sovereign/shared';

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: () => void;
}

export function EventCard({ event, compact, onClick }: EventCardProps) {
  const colorClass = CALENDAR_EVENT_TYPE_COLORS[event.eventType as CalendarEventType] || 'bg-gray-500';

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-2 rounded-md border p-2 text-left transition-colors hover:bg-accent',
        compact && 'p-1',
      )}
    >
      <div className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', colorClass)} />
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium truncate', compact ? 'text-xs' : 'text-sm')}>{event.title}</p>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
            {event.location && ` · ${event.location}`}
          </p>
        )}
        {compact && (
          <p className="text-[10px] text-muted-foreground">{format(new Date(event.startTime), 'h:mm a')}</p>
        )}
      </div>
    </button>
  );
}
