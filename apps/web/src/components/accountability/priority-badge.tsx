'use client';

import { Badge } from '@/components/ui/badge';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Priority } from '@sovereign/shared';

interface PriorityBadgeProps {
  priority: Priority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return (
    <Badge variant="outline" className={cn(PRIORITY_COLORS[priority], className)}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
