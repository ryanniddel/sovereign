'use client';

import { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { DailyView } from '@/components/calendar/daily-view';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';
import { EventDetailSheet } from '@/components/calendar/event-detail-sheet';
import type { CalendarEvent } from '@sovereign/shared';

export default function DailyCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view="daily"
        onDateChange={setCurrentDate}
        onCreateEvent={() => setCreateOpen(true)}
      />
      <DailyView
        currentDate={currentDate}
        onEventClick={(event) => setSelectedEvent(event)}
      />
      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EventDetailSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}
      />
    </div>
  );
}
