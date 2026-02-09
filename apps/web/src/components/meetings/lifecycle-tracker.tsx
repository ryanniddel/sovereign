'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { MeetingStatus } from '@sovereign/shared';
import { MEETING_STATUS_LABELS } from '@/lib/constants';

const LIFECYCLE_ORDER = [
  MeetingStatus.REQUESTED,
  MeetingStatus.QUALIFYING,
  MeetingStatus.QUALIFIED,
  MeetingStatus.SCHEDULED,
  MeetingStatus.PREP_SENT,
  MeetingStatus.IN_PROGRESS,
  MeetingStatus.COMPLETED,
];

interface LifecycleTrackerProps {
  currentStatus: MeetingStatus;
  cancelled?: boolean;
}

export function LifecycleTracker({ currentStatus, cancelled }: LifecycleTrackerProps) {
  if (cancelled) {
    const isAuto = currentStatus === MeetingStatus.AUTO_CANCELLED;
    return (
      <div className={cn('flex items-center gap-2 rounded-md p-3', isAuto ? 'bg-orange-500/10' : 'bg-destructive/10')}>
        <span className={cn('text-sm font-medium', isAuto ? 'text-orange-500' : 'text-destructive')}>
          {isAuto ? 'Auto-Cancelled (policy violation)' : 'Meeting Cancelled'}
        </span>
      </div>
    );
  }

  const currentIndex = LIFECYCLE_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center">
      {LIFECYCLE_ORDER.map((status, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={status} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium',
                  isPast && 'border-emerald-500 bg-emerald-500 text-white',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  !isPast && !isCurrent && 'border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isPast ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-[10px] whitespace-nowrap',
                  isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {MEETING_STATUS_LABELS[status]}
              </span>
            </div>
            {index < LIFECYCLE_ORDER.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 w-8',
                  isPast ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
