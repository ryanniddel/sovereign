'use client';

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@sovereign/shared';
import { CALENDAR_EVENT_TYPE_COLORS } from '@/lib/constants';
import type { CalendarEventType } from '@sovereign/shared';

interface MonthlyViewProps {
  currentDate: Date;
  onEventClick?: (event: CalendarEvent) => void;
  onDayClick?: (date: Date) => void;
}

export function MonthlyView({ currentDate, onEventClick, onDayClick }: MonthlyViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const { data: events, isLoading } = useCalendarEvents({
    startDate: calStart.toISOString(),
    endDate: calEnd.toISOString(),
  });

  if (isLoading) return <Skeleton className="h-96" />;

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div>
      <div className="grid grid-cols-7 border-b">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((d) => {
          const dayEvents = (events || []).filter((e: CalendarEvent) =>
            isSameDay(new Date(e.startTime), d),
          );
          const isCurrentMonth = isSameMonth(d, currentDate);
          const isToday = isSameDay(d, new Date());

          return (
            <button
              key={d.toISOString()}
              onClick={() => onDayClick?.(d)}
              className={cn(
                'min-h-[80px] bg-card p-1 text-left transition-colors hover:bg-accent',
                !isCurrentMonth && 'opacity-40',
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  isToday && 'bg-primary text-primary-foreground font-bold',
                )}
              >
                {format(d, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((event: CalendarEvent) => (
                  <div
                    key={event.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick?.(event); }}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-[10px] text-white',
                      CALENDAR_EVENT_TYPE_COLORS[event.eventType as CalendarEventType] || 'bg-gray-500',
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
