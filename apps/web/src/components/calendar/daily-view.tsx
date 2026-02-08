'use client';

import { format, isSameDay } from 'date-fns';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { EventCard } from './event-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarEvent } from '@sovereign/shared';

interface DailyViewProps {
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM

export function DailyView({ currentDate, onEventClick }: DailyViewProps) {
  const { data: events, isLoading } = useCalendarEvents({
    startDate: currentDate.toISOString(),
    endDate: currentDate.toISOString(),
  });

  if (isLoading) return <Skeleton className="h-96" />;

  const dayEvents = (events || []).filter((e: CalendarEvent) =>
    isSameDay(new Date(e.startTime), currentDate),
  );

  return (
    <div className="rounded-lg border">
      {HOURS.map((hour) => {
        const hourEvents = dayEvents.filter((e: CalendarEvent) => {
          const eventHour = new Date(e.startTime).getHours();
          return eventHour === hour;
        });

        return (
          <div key={hour} className="flex min-h-[60px] border-b last:border-b-0">
            <div className="flex w-16 flex-shrink-0 items-start justify-end border-r p-2">
              <span className="text-xs text-muted-foreground">
                {format(new Date().setHours(hour, 0), 'h a')}
              </span>
            </div>
            <div className="flex-1 p-1">
              {hourEvents.map((event: CalendarEvent) => (
                <EventCard key={event.id} event={event} onClick={() => onEventClick?.(event)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
