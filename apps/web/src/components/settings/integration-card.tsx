'use client';

import { type ReactNode, useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { OAuthConnectionStatus } from '@sovereign/shared';

interface IntegrationCardProps {
  name: string;
  icon: ReactNode;
  description: string;
  connected: boolean;
  accountEmail?: string;
  status: OAuthConnectionStatus | 'DISCONNECTED';
  onConnect: () => void;
  onDisconnect: () => void;
  connectLoading?: boolean;
  disconnectLoading?: boolean;
  children?: ReactNode;
}

function statusBadge(status: OAuthConnectionStatus | 'DISCONNECTED') {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="default">Connected</Badge>;
    case 'EXPIRED':
      return <Badge variant="destructive">Expired</Badge>;
    case 'REVOKED':
      return <Badge variant="destructive">Revoked</Badge>;
    case 'ERROR':
      return <Badge variant="destructive">Error</Badge>;
    case 'DISCONNECTED':
    default:
      return <Badge variant="secondary">Disconnected</Badge>;
  }
}

export function IntegrationCard({
  name,
  icon,
  description,
  connected,
  accountEmail,
  status,
  onConnect,
  onDisconnect,
  connectLoading,
  disconnectLoading,
  children,
}: IntegrationCardProps) {
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={name}>{icon}</span>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          {statusBadge(status)}
        </div>
        {connected && accountEmail && (
          <p className="text-xs text-muted-foreground mt-1">{accountEmail}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {connected ? (
          <>
            {children}
            {(status === 'EXPIRED' || status === 'ERROR' || status === 'REVOKED') ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Connection {status === 'EXPIRED' ? 'expired' : status === 'ERROR' ? 'encountered an error' : 'was revoked'}. Reconnect to resume syncing.
                </p>
                <div className="flex gap-2">
                  <Button onClick={onConnect} disabled={connectLoading} size="sm">
                    {connectLoading ? 'Reconnecting...' : 'Reconnect'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDisconnectOpen(true)}
                    disabled={disconnectLoading}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDisconnectOpen(true)}
                disabled={disconnectLoading}
              >
                {disconnectLoading ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            )}
            <ConfirmDialog
              open={disconnectOpen}
              onOpenChange={setDisconnectOpen}
              title={`Disconnect ${name}`}
              description={`Are you sure you want to disconnect ${name}? You will need to re-authorize to reconnect.`}
              variant="destructive"
              confirmLabel="Disconnect"
              onConfirm={onDisconnect}
              loading={disconnectLoading}
            />
          </>
        ) : (
          <Button onClick={onConnect} disabled={connectLoading} size="sm">
            {connectLoading ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
