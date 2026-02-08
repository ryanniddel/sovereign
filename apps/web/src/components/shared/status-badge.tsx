import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MEETING_STATUS_LABELS,
  MEETING_STATUS_COLORS,
  COMMITMENT_STATUS_LABELS,
  ACTION_ITEM_STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/lib/constants';
import type { MeetingStatus, CommitmentStatus, ActionItemStatus, Priority } from '@sovereign/shared';

interface StatusBadgeProps {
  status: string;
  type: 'meeting' | 'commitment' | 'actionItem' | 'priority';
  className?: string;
}

export function StatusBadge({ status, type, className }: StatusBadgeProps) {
  let label: string;
  let colorClass: string;

  switch (type) {
    case 'meeting':
      label = MEETING_STATUS_LABELS[status as MeetingStatus] || status;
      colorClass = MEETING_STATUS_COLORS[status as MeetingStatus] || '';
      break;
    case 'commitment':
      label = COMMITMENT_STATUS_LABELS[status as CommitmentStatus] || status;
      colorClass = getAccountabilityColor(status);
      break;
    case 'actionItem':
      label = ACTION_ITEM_STATUS_LABELS[status as ActionItemStatus] || status;
      colorClass = getAccountabilityColor(status);
      break;
    case 'priority':
      label = PRIORITY_LABELS[status as Priority] || status;
      colorClass = PRIORITY_COLORS[status as Priority] || '';
      break;
    default:
      label = status;
      colorClass = '';
  }

  return (
    <Badge variant="outline" className={cn('text-xs', colorClass, className)}>
      {label}
    </Badge>
  );
}

function getAccountabilityColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    OVERDUE: 'bg-red-500/10 text-red-500 border-red-500/20',
    RESCHEDULED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    DELEGATED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };
  return colors[status] || '';
}
