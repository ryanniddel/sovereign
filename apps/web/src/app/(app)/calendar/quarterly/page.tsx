'use client';

import { useState } from 'react';
import { CalendarHeader } from '@/components/calendar/calendar-header';
import { MonthlyView } from '@/components/calendar/monthly-view';
import { CreateEventDialog } from '@/components/calendar/create-event-dialog';
import { addMonths } from 'date-fns';

export default function QuarterlyCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);

  const months = [currentDate, addMonths(currentDate, 1), addMonths(currentDate, 2)];

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view="quarterly"
        onDateChange={setCurrentDate}
        onCreateEvent={() => setCreateOpen(true)}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {months.map((month) => (
          <div key={month.toISOString()}>
            <MonthlyView currentDate={month} />
          </div>
        ))}
      </div>
      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
