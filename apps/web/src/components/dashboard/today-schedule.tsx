'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useCommandCenter } from '@/hooks/use-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { CALENDAR_EVENT_TYPE_COLORS, CALENDAR_EVENT_TYPE_LABELS } from '@/lib/constants';
import type { CalendarEvent, CalendarEventType } from '@sovereign/shared';
import Link from 'next/link';

export function TodaySchedule() {
  const { data, isLoading } = useCommandCenter();

  const events = data?.today || [];
  const totalToday = data?.totals?.today || events.length;
  const conflicts = data?.totals?.conflicts || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Today&apos;s Schedule</CardTitle>
        <div className="flex items-center gap-2">
          {totalToday > 0 && (
            <Badge variant="outline" className="text-xs">{totalToday}</Badge>
          )}
          {conflicts > 0 && (
            <Badge variant="destructive" className="text-xs">{conflicts} conflict{conflicts > 1 ? 's' : ''}</Badge>
          )}
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !events.length ? (
          <p className="text-sm text-muted-foreground">No events scheduled today</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 6).map((event: CalendarEvent) => (
              <div key={event.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors">
                <div
                  className={`h-2 w-2 shrink-0 rounded-full ${CALENDAR_EVENT_TYPE_COLORS[event.eventType as CalendarEventType] || 'bg-gray-500'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{event.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {CALENDAR_EVENT_TYPE_LABELS[event.eventType as CalendarEventType] || event.eventType}
                </Badge>
              </div>
            ))}
            {totalToday > 6 && (
              <Link href="/calendar" className="flex items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                +{totalToday - 6} more <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
        <Link
          href="/calendar"
          className="mt-3 flex items-center justify-center gap-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          View Calendar <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
