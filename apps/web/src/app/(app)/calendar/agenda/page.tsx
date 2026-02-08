'use client';

import { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { AgendaView } from '@/components/calendar/agenda-view';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';

export default function AgendaCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view="agenda"
        onDateChange={setCurrentDate}
        onCreateEvent={() => setCreateOpen(true)}
      />
      <AgendaView currentDate={currentDate} />
      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
