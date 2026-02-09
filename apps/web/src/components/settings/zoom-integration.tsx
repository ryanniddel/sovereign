'use client';

import { IntegrationCard } from './integration-card';
import {
  useConnectIntegration,
  useDisconnectIntegration,
} from '@/hooks/use-integrations';
import type { IntegrationStatus } from '@sovereign/shared';

interface ZoomIntegrationProps {
  status: IntegrationStatus | undefined;
}

export function ZoomIntegration({ status }: ZoomIntegrationProps) {
  const connect = useConnectIntegration();
  const disconnect = useDisconnectIntegration();
  const isConnected = status?.connected ?? false;

  return (
    <IntegrationCard
      name="Zoom"
      icon="Z"
      description="Video meetings and meeting links"
      connected={isConnected}
      accountEmail={status?.accountEmail}
      status={status?.status ?? 'DISCONNECTED'}
      onConnect={() => connect.mutate('ZOOM')}
      onDisconnect={() => disconnect.mutate('ZOOM')}
      connectLoading={connect.isPending}
      disconnectLoading={disconnect.isPending}
    >
      {isConnected && (
        <p className="text-xs text-muted-foreground">
          Zoom meeting links will be automatically generated for scheduled meetings.
        </p>
      )}
    </IntegrationCard>
  );
}
