'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationPreferences, useUpdateNotificationPreference } from '@/hooks/use-notifications';
import { Skeleton } from '@/components/ui/skeleton';
import { ESCALATION_CHANNEL_LABELS } from '@/lib/constants';
import { Bell, Mail, MessageSquare, Phone, Hash } from 'lucide-react';
import type { EscalationChannel, NotificationContext, Priority } from '@sovereign/shared';

const channelIcons: Record<string, React.ElementType> = {
  IN_APP: Bell, EMAIL: Mail, SMS: MessageSquare, PHONE_CALL: Phone, SLACK: Hash,
};

const CONTEXT_LABELS: Record<string, string> = {
  ALL: 'Always',
  WORK_HOURS: 'Work hours only',
  AFTER_HOURS: 'After hours only',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'All (Low+)',
  MEDIUM: 'Medium+',
  HIGH: 'High+',
  CRITICAL: 'Critical only',
};

export function NotificationPreferencesForm() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const update = useUpdateNotificationPreference();

  if (isLoading) return <Skeleton className="h-64" />;

  const channels = Object.entries(ESCALATION_CHANNEL_LABELS) as [EscalationChannel, string][];
  const prefs = (preferences || []) as Array<{
    channel: EscalationChannel; isEnabled: boolean;
    context: NotificationContext; priority: Priority;
  }>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Channels</CardTitle>
        <CardDescription>Configure delivery channels, contexts, and priority thresholds</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map(([channel, label]) => {
          const pref = prefs.find((p) => p.channel === channel);
          const isEnabled = pref?.isEnabled ?? false;
          const context = pref?.context ?? 'ALL';
          const priority = pref?.priority ?? 'LOW';
          const Icon = channelIcons[channel] ?? Bell;

          return (
            <div key={channel} className="rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Label className="text-sm font-medium">{label}</Label>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => update.mutate({ channel, isEnabled: checked })}
                />
              </div>

              {isEnabled && (
                <div className="grid grid-cols-2 gap-3 pl-7">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">When</Label>
                    <Select
                      value={context}
                      onValueChange={(v) => update.mutate({ channel, context: v as NotificationContext })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONTEXT_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Min Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(v) => update.mutate({ channel, priority: v as Priority })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
