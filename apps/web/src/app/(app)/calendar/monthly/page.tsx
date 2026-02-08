'use client';

import { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { MonthlyView } from '@/components/calendar/monthly-view';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';

export default function MonthlyCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view="monthly"
        onDateChange={setCurrentDate}
        onCreateEvent={() => setCreateOpen(true)}
      />
      <MonthlyView currentDate={currentDate} />
      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
