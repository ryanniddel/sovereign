'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TierBadgeProps {
  tierName: string;
  priority?: number;
  className?: string;
}

function getVariant(priority?: number): 'default' | 'secondary' | 'outline' {
  if (!priority || priority === 1) return 'default';
  if (priority === 2) return 'secondary';
  return 'outline';
}

export function TierBadge({ tierName, priority, className }: TierBadgeProps) {
  return (
    <Badge variant={getVariant(priority)} className={cn(className)}>
      {tierName}
    </Badge>
  );
}
