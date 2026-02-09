'use client';

import { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { AgendaView } from '@/components/calendar/agenda-view';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';
import { EventDetailSheet } from '@/components/calendar/event-detail-sheet';
import type { CalendarEvent } from '@sovereign/shared';

export default function AgendaCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view="agenda"
        onDateChange={setCurrentDate}
        onCreateEvent={() => { setEditEvent(null); setCreateOpen(true); }}
      />
      <AgendaView
        currentDate={currentDate}
        onEventClick={(event) => setSelectedEvent(event)}
      />
      <CreateEventDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        editEvent={editEvent}
      />
      <EventDetailSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onOpenChange={(open) => { if (!open) setSelectedEvent(null); }}
        onEdit={(event) => { setEditEvent(event); setCreateOpen(true); }}
      />
    </div>
  );
}
