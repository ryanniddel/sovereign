'use client';

import { isSameDay } from 'date-fns';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { TimeGrid } from './time-grid';
import { EventCard } from './event-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarEvent } from '@sovereign/shared';

interface DailyViewProps {
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function DailyView({ currentDate, onEventClick }: DailyViewProps) {
  const { data: events, isLoading } = useCalendarEvents({
    startDate: currentDate.toISOString(),
    endDate: currentDate.toISOString(),
  });

  if (isLoading) return <Skeleton className="h-96" />;

  const dayEvents = (events || []).filter((e: CalendarEvent) =>
    isSameDay(new Date(e.startTime), currentDate),
  );

  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay);

  return (
    <div className="space-y-2">
      {allDayEvents.length > 0 && (
        <div className="rounded-lg border p-2">
          <p className="mb-1 text-xs font-medium text-muted-foreground">All Day</p>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <EventCard key={event.id} event={event} compact onClick={() => onEventClick?.(event)} />
            ))}
          </div>
        </div>
      )}
      <div className="rounded-lg border p-2">
        <TimeGrid
          events={timedEvents}
          startHour={7}
          endHour={20}
          onEventClick={onEventClick}
        />
      </div>
      {dayEvents.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">No events scheduled</p>
      )}
    </div>
  );
}
