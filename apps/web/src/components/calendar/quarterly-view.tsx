'use client';

import { format, startOfQuarter, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { EventCard } from './event-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarEvent } from '@sovereign/shared';

interface QuarterlyViewProps {
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function QuarterlyView({ currentDate, onEventClick }: QuarterlyViewProps) {
  const quarterStart = startOfQuarter(currentDate);
  const months = Array.from({ length: 3 }, (_, i) => addMonths(quarterStart, i));

  const { data: events, isLoading } = useCalendarEvents({
    startDate: quarterStart.toISOString(),
    endDate: endOfMonth(months[2]).toISOString(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {months.map((month) => {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);
        const monthEvents = (events || []).filter((e: CalendarEvent) => {
          const d = new Date(e.startTime);
          return d >= monthStart && d <= monthEnd;
        });

        return (
          <div key={month.toISOString()} className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">{format(month, 'MMMM yyyy')}</h3>
            <p className="mb-2 text-xs text-muted-foreground">{monthEvents.length} events</p>
            <div className="space-y-1">
              {monthEvents.slice(0, 8).map((event: CalendarEvent) => (
                <EventCard
                  key={event.id}
                  event={event}
                  compact
                  onClick={() => onEventClick?.(event)}
                />
              ))}
              {monthEvents.length > 8 && (
                <p className="text-xs text-muted-foreground">+{monthEvents.length - 8} more</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
