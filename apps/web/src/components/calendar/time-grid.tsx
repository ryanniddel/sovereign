'use client';

import { cn } from '@/lib/utils';
import { CALENDAR_EVENT_TYPE_COLORS } from '@/lib/constants';
import type { CalendarEvent, CalendarEventType } from '@sovereign/shared';

interface TimeGridProps {
  events: CalendarEvent[];
  startHour?: number;
  endHour?: number;
  onEventClick?: (event: CalendarEvent) => void;
}

export function TimeGrid({ events, startHour = 7, endHour = 20, onEventClick }: TimeGridProps) {
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
  const hourHeight = 60; // px per hour

  const getEventPosition = (event: CalendarEvent) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const top = ((startMinutes - startHour * 60) / 60) * hourHeight;
    const height = ((endMinutes - startMinutes) / 60) * hourHeight;
    return { top: Math.max(0, top), height: Math.max(hourHeight / 4, height) };
  };

  return (
    <div className="relative flex">
      <div className="w-16 flex-shrink-0">
        {hours.map((hour) => (
          <div key={hour} className="flex h-[60px] items-start justify-end pr-2">
            <span className="text-xs text-muted-foreground">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </span>
          </div>
        ))}
      </div>

      <div className="relative flex-1 border-l">
        {hours.map((hour) => (
          <div key={hour} className="h-[60px] border-b border-dashed border-border/50" />
        ))}

        {events.map((event) => {
          const { top, height } = getEventPosition(event);
          const colorClass = CALENDAR_EVENT_TYPE_COLORS[event.eventType as CalendarEventType] || 'bg-gray-500';

          return (
            <button
              key={event.id}
              className={cn(
                'absolute left-1 right-1 rounded-md px-2 py-1 text-left text-xs text-white opacity-90 hover:opacity-100 transition-opacity',
                colorClass,
              )}
              style={{ top: `${top}px`, height: `${height}px` }}
              onClick={() => onEventClick?.(event)}
            >
              <p className="truncate font-medium">{event.title}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
