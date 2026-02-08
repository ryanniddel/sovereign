'use client';

import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { CalendarEvent } from '@sovereign/shared';

interface FocusBlockIndicatorProps {
  event: CalendarEvent;
  compact?: boolean;
}

export function FocusBlockIndicator({ event, compact }: FocusBlockIndicatorProps) {
  if (event.eventType !== 'FOCUS_BLOCK') return null;

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Shield className="h-3 w-3 text-purple-500" />
        </TooltipTrigger>
        <TooltipContent>
          <p>Focus Block — notifications suppressed</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
      <Shield className="mr-1 h-3 w-3" />
      Focus Block
    </Badge>
  );
}
