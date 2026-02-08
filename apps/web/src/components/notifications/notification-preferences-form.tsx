'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotificationPreferences, useUpdateNotificationPreference } from '@/hooks/use-notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { ESCALATION_CHANNEL_LABELS } from '@/lib/constants';
import type { EscalationChannel } from '@sovereign/shared';

export function NotificationPreferencesForm() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreference();

  if (isLoading) return <Skeleton className="h-64" />;

  const channels = Object.entries(ESCALATION_CHANNEL_LABELS) as [EscalationChannel, string][];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Channels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map(([channel, label]) => {
          const pref = (preferences as Array<{ channel: string; isEnabled: boolean }>)?.find((p) => p.channel === channel);
          const isEnabled = pref?.isEnabled ?? false;

          return (
            <div key={channel} className="flex items-center justify-between rounded-md border p-3">
              <Label>{label}</Label>
              <Switch
                checked={isEnabled}
                onCheckedChange={(checked) => update.mutate({ channel, isEnabled: checked })}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
