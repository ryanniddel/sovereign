'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  CheckCircle2,
  CalendarClock,
  Forward,
  Trash2,
} from 'lucide-react';
import { CommitmentStatus, ActionItemStatus } from '@sovereign/shared';

interface ItemActionsDropdownProps {
  itemType: 'commitment' | 'action-item';
  status: string;
  onComplete?: () => void;
  onReschedule?: () => void;
  onDelegate?: () => void;
  onDelete?: () => void;
}

const COMPLETED_STATUSES = [
  CommitmentStatus.COMPLETED,
  ActionItemStatus.COMPLETED,
];

export function ItemActionsDropdown({
  itemType,
  status,
  onComplete,
  onReschedule,
  onDelegate,
  onDelete,
}: ItemActionsDropdownProps) {
  const isCompleted = COMPLETED_STATUSES.includes(status as CommitmentStatus | ActionItemStatus);
  const canDelegate = itemType === 'commitment' && !isCompleted;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isCompleted && onComplete && (
          <DropdownMenuItem onClick={onComplete}>
            <CheckCircle2 className="h-4 w-4" />
            Mark Complete
          </DropdownMenuItem>
        )}
        {!isCompleted && onReschedule && (
          <DropdownMenuItem onClick={onReschedule}>
            <CalendarClock className="h-4 w-4" />
            Reschedule
          </DropdownMenuItem>
        )}
        {canDelegate && onDelegate && (
          <DropdownMenuItem onClick={onDelegate}>
            <Forward className="h-4 w-4" />
            Delegate
          </DropdownMenuItem>
        )}
        {(onComplete || onReschedule || (canDelegate && onDelegate)) && onDelete && (
          <DropdownMenuSeparator />
        )}
        {onDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
