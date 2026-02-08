'use client';

import { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { DailyView } from '@/components/calendar/daily-view';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';

export default function DailyCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view="daily"
        onDateChange={setCurrentDate}
        onCreateEvent={() => setCreateOpen(true)}
      />
      <DailyView currentDate={currentDate} />
      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
