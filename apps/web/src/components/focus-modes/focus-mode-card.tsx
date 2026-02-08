'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useActivateFocusMode, useDeactivateFocusMode, useCloneFocusMode } from '@/hooks/use-focus-modes';
import { FOCUS_MODE_TRIGGER_LABELS, FOCUS_MODE_ICON_MAP } from '@/lib/constants';
import type { FocusMode, FocusModeTrigger } from '@sovereign/shared';
import Link from 'next/link';
import { Shield, ShieldOff, Copy } from 'lucide-react';

interface FocusModeCardProps {
  focusMode: FocusMode;
}

export function FocusModeCard({ focusMode }: FocusModeCardProps) {
  const activate = useActivateFocusMode();
  const deactivate = useDeactivateFocusMode();
  const clone = useCloneFocusMode();

  return (
    <Card style={focusMode.color ? { borderLeftColor: focusMode.color, borderLeftWidth: 3 } : undefined}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {(() => {
            const IconComp = focusMode.icon ? FOCUS_MODE_ICON_MAP[focusMode.icon] : null;
            if (IconComp) return <IconComp className={`h-4 w-4 ${focusMode.isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />;
            return focusMode.isActive ? <Shield className="h-4 w-4 text-emerald-500" /> : <ShieldOff className="h-4 w-4 text-muted-foreground" />;
          })()}
          <CardTitle className="text-sm">{focusMode.name}</CardTitle>
        </div>
        <Badge variant={focusMode.isActive ? 'default' : 'secondary'}>
          {focusMode.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </CardHeader>
      <CardContent>
        {focusMode.description && <p className="text-sm text-muted-foreground mb-3">{focusMode.description}</p>}
        <div className="text-xs text-muted-foreground mb-1">
          Trigger: {FOCUS_MODE_TRIGGER_LABELS[focusMode.triggerType as FocusModeTrigger] || focusMode.triggerType || 'Manual'}
          {focusMode.requires2faOverride && ' · 2FA Required'}
        </div>
        <div className="text-xs text-muted-foreground mb-3">
          {focusMode.activationCount} activations · {focusMode.totalActivationMinutes}m total
        </div>
        <div className="flex gap-2">
          {focusMode.isActive ? (
            <Button size="sm" variant="outline" onClick={() => deactivate.mutate(focusMode.id)}>Deactivate</Button>
          ) : (
            <Button size="sm" onClick={() => activate.mutate(focusMode.id)}>Activate</Button>
          )}
          <Button size="sm" variant="ghost" asChild><Link href={`/focus-modes/${focusMode.id}`}>Edit</Link></Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => clone.mutate(focusMode.id)}
            title="Clone"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
