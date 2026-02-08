'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';
import type { FocusMode } from '@sovereign/shared';

interface ActiveFocusIndicatorProps {
  focusMode: FocusMode;
  onDeactivate?: () => void;
}

export function ActiveFocusIndicator({ focusMode, onDeactivate }: ActiveFocusIndicatorProps) {
  const [minutesActive, setMinutesActive] = useState(0);

  useEffect(() => {
    const update = () => {
      if (focusMode.activatedAt) {
        setMinutesActive(differenceInMinutes(new Date(), new Date(focusMode.activatedAt)));
      }
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [focusMode.activatedAt]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <Card className="border-2" style={{ borderColor: focusMode.color ?? '#8b5cf6' }}>
      <CardContent className="flex items-center gap-3 p-3">
        <div
          className="relative flex h-3 w-3 shrink-0"
        >
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
            style={{ backgroundColor: focusMode.color ?? '#8b5cf6' }}
          />
          <span
            className="relative inline-flex h-3 w-3 rounded-full"
            style={{ backgroundColor: focusMode.color ?? '#8b5cf6' }}
          />
        </div>

        <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />

        <div className="flex flex-1 items-center gap-2">
          <span className="text-sm font-medium">{focusMode.name}</span>
          <Badge variant="default" className="text-xs">Active</Badge>
          {focusMode.activatedAt && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(minutesActive)}
            </span>
          )}
        </div>

        {onDeactivate && (
          <Button size="sm" variant="outline" onClick={onDeactivate}>
            Deactivate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
