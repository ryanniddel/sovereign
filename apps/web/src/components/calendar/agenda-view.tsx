'use client';

import { format, addDays, isSameDay } from 'date-fns';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { EventCard } from './event-card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Calendar } from 'lucide-react';
import type { CalendarEvent } from '@sovereign/shared';

interface AgendaViewProps {
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function AgendaView({ currentDate, onEventClick }: AgendaViewProps) {
  const endDate = addDays(currentDate, 14);
  const { data: events, isLoading } = useCalendarEvents({
    startDate: currentDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  if (isLoading) return <Skeleton className="h-64" />;

  if (!events?.length) {
    return <EmptyState icon={Calendar} title="No upcoming events" description="Your schedule is clear" />;
  }

  // Group by day
  const grouped = (events as CalendarEvent[]).reduce(
    (acc, event) => {
      const dateKey = format(new Date(event.startTime), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    },
    {} as Record<string, CalendarEvent[]>,
  );

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([dateKey, dayEvents]) => {
        const date = new Date(dateKey);
        const isToday = isSameDay(date, new Date());

        return (
          <div key={dateKey}>
            <h3 className="sticky top-0 bg-background py-2 text-sm font-semibold">
              {isToday ? 'Today' : format(date, 'EEEE, MMMM d')}
            </h3>
            <div className="space-y-1 pl-4">
              {dayEvents.map((event) => (
                <EventCard key={event.id} event={event} onClick={() => onEventClick?.(event)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
