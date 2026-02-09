'use client';

import { IntegrationCard } from './integration-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useConnectIntegration,
  useDisconnectIntegration,
  useSlackChannels,
} from '@/hooks/use-integrations';
import type { IntegrationStatus } from '@sovereign/shared';

interface SlackIntegrationProps {
  status: IntegrationStatus | undefined;
}

export function SlackIntegration({ status }: SlackIntegrationProps) {
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();
  const isConnected = status?.connected ?? false;
  const { data: channels, isLoading: channelsLoading } = useSlackChannels(isConnected);

  return (
    <IntegrationCard
      name="Slack"
      icon="S"
      description="Notifications and escalation messages"
      connected={isConnected}
      accountEmail={status?.accountEmail}
      status={status?.status ?? 'DISCONNECTED'}
      onConnect={() => connect.mutate('SLACK')}
      onDisconnect={() => disconnect.mutate('SLACK')}
      connectLoading={connect.isPending}
      disconnectLoading={disconnect.isPending}
    >
      <div className="space-y-1.5">
        <Label className="text-xs">Default Notification Channel</Label>
        {channelsLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : channels && channels.length > 0 ? (
          <Select defaultValue={channels[0]?.id}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a channel" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  #{ch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-xs text-muted-foreground">No channels found</p>
        )}
      </div>
    </IntegrationCard>
  );
}
