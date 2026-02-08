'use client';

import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { EventCard } from './event-card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CalendarEvent } from '@sovereign/shared';
import { cn } from '@/lib/utils';

interface WeeklyViewProps {
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function WeeklyView({ currentDate, onEventClick }: WeeklyViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: events, isLoading } = useCalendarEvents({
    startDate: days[0].toISOString(),
    endDate: days[6].toISOString(),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-px rounded-lg border bg-border">
      {days.map((day) => {
        const dayEvents = (events || []).filter((e: CalendarEvent) =>
          isSameDay(new Date(e.startTime), day),
        );
        const isToday = isSameDay(day, new Date());

        return (
          <div key={day.toISOString()} className="min-h-[200px] bg-card p-2">
            <div className={cn(
              'mb-2 text-center',
              isToday && 'rounded-full bg-primary text-primary-foreground',
            )}>
              <p className="text-xs text-muted-foreground">{format(day, 'EEE')}</p>
              <p className={cn('text-sm font-medium', isToday && 'text-primary-foreground')}>
                {format(day, 'd')}
              </p>
            </div>
            <div className="space-y-1">
              {dayEvents.map((event: CalendarEvent) => (
                <EventCard
                  key={event.id}
                  event={event}
                  compact
                  onClick={() => onEventClick?.(event)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
