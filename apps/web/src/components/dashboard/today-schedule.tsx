'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useCalendarEvents } from '@/hooks/use-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { CALENDAR_EVENT_TYPE_COLORS } from '@/lib/constants';
import type { CalendarEvent, CalendarEventType } from '@sovereign/shared';

export function TodaySchedule() {
  const today = new Date().toISOString().split('T')[0];
  const { data: events, isLoading } = useCalendarEvents({ startDate: today, endDate: today });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Today&apos;s Schedule</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !events?.length ? (
          <p className="text-sm text-muted-foreground">No events scheduled today</p>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map((event: CalendarEvent) => (
              <div key={event.id} className="flex items-center gap-3">
                <div
                  className={`h-2 w-2 rounded-full ${CALENDAR_EVENT_TYPE_COLORS[event.eventType as CalendarEventType] || 'bg-gray-500'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
