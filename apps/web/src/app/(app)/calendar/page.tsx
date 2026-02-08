'use client';

import { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { WeeklyView } from '@/components/calendar/weekly-view';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view="weekly"
        onDateChange={setCurrentDate}
        onCreateEvent={() => setCreateOpen(true)}
      />
      <WeeklyView currentDate={currentDate} />
      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
