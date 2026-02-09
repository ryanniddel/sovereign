'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { MonthlyView } from '@/components/calendar/monthly-view';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';
import { EventDetailSheet } from '@/components/calendar/event-detail-sheet';
import type { CalendarEvent } from '@sovereign/shared';

export default function MonthlyCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view="monthly"
        onDateChange={setCurrentDate}
        onCreateEvent={() => { setEditEvent(null); setCreateOpen(true); }}
      />
      <MonthlyView
        currentDate={currentDate}
        onEventClick={(event) => setSelectedEvent(event)}
        onDayClick={(date) => {
          setCurrentDate(date);
          router.push('/calendar/daily');
        }}
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
