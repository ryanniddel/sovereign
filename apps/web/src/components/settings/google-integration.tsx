'use client';

import { IntegrationCard } from './integration-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  useConnectIntegration,
  useDisconnectIntegration,
  useGoogleCalendars,
} from '@/hooks/use-integrations';
import type { IntegrationStatus } from '@sovereign/shared';

interface GoogleIntegrationProps {
  status: IntegrationStatus | undefined;
}

export function GoogleIntegration({ status }: GoogleIntegrationProps) {
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();
  const isConnected = status?.connected ?? false;
  const { data: calendars, isLoading: calendarsLoading } = useGoogleCalendars(isConnected);

  return (
    <IntegrationCard
      name="Google"
      icon="G"
      description="Google Calendar and Gmail"
      connected={isConnected}
      accountEmail={status?.accountEmail}
      status={status?.status ?? 'DISCONNECTED'}
      onConnect={() => connect.mutate('GOOGLE')}
      onDisconnect={() => disconnect.mutate('GOOGLE')}
      connectLoading={connect.isPending}
      disconnectLoading={disconnect.isPending}
    >
      <div className="space-y-3">
        {/* Calendar picker */}
        <div className="space-y-1.5">
          <Label className="text-xs">Synced Calendar</Label>
          {calendarsLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : calendars && calendars.length > 0 ? (
            <Select defaultValue={calendars.find((c) => c.primary)?.id ?? calendars[0]?.id}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a calendar" />
              </SelectTrigger>
              <SelectContent>
                {calendars.map((cal) => (
                  <SelectItem key={cal.id} value={cal.id}>
                    {cal.name}{cal.primary ? ' (Primary)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-xs text-muted-foreground">No calendars found</p>
          )}
        </div>

        {/* Gmail status */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Gmail Notifications</span>
          <Badge variant={isConnected ? 'default' : 'secondary'} className="text-[10px]">
            {isConnected ? 'Enabled' : 'Unavailable'}
          </Badge>
        </div>
      </div>
    </IntegrationCard>
  );
}
