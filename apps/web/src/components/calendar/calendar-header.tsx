'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

type CalendarView = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'agenda';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onDateChange: (date: Date) => void;
  onCreateEvent: () => void;
}

const views: { label: string; value: CalendarView; href: string }[] = [
  { label: 'Day', value: 'daily', href: '/calendar/daily' },
  { label: 'Week', value: 'weekly', href: '/calendar' },
  { label: 'Month', value: 'monthly', href: '/calendar/monthly' },
  { label: 'Quarter', value: 'quarterly', href: '/calendar/quarterly' },
  { label: 'Agenda', value: 'agenda', href: '/calendar/agenda' },
];

export function CalendarHeader({ currentDate, view, onDateChange, onCreateEvent }: CalendarHeaderProps) {
  const navigate = (direction: 'prev' | 'next') => {
    const fn = direction === 'next'
      ? { daily: addDays, weekly: addWeeks, monthly: addMonths, quarterly: () => addMonths(currentDate, 3), agenda: addWeeks }
      : { daily: subDays, weekly: subWeeks, monthly: subMonths, quarterly: () => subMonths(currentDate, 3), agenda: subWeeks };

    if (view === 'quarterly') {
      onDateChange(direction === 'next' ? addMonths(currentDate, 3) : subMonths(currentDate, 3));
    } else {
      const navFn = fn[view] as (date: Date, amount: number) => Date;
      onDateChange(navFn(currentDate, 1));
    }
  };

  const dateLabel = () => {
    switch (view) {
      case 'daily': return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'weekly': return `Week of ${format(currentDate, 'MMM d, yyyy')}`;
      case 'monthly': return format(currentDate, 'MMMM yyyy');
      case 'quarterly': return `Q${Math.ceil((currentDate.getMonth() + 1) / 3)} ${format(currentDate, 'yyyy')}`;
      case 'agenda': return `Agenda from ${format(currentDate, 'MMM d, yyyy')}`;
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" onClick={() => navigate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{dateLabel()}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-md border">
          {views.map((v) => (
            <Link key={v.value} href={v.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-none first:rounded-l-md last:rounded-r-md',
                  view === v.value && 'bg-accent',
                )}
              >
                {v.label}
              </Button>
            </Link>
          ))}
        </div>
        <Button size="sm" onClick={onCreateEvent}>
          <Plus className="mr-1 h-4 w-4" />
          Event
        </Button>
        <Link href="/calendar/settings">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
