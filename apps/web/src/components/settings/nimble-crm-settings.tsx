'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  useNimbleCrmStatus,
  useConnectNimbleCrm,
  useDisconnectNimbleCrm,
  useSyncNimbleCrm,
} from '@/hooks/use-nimble-crm';
import { Plug, Unplug, RefreshCw, CheckCircle2, XCircle, Users } from 'lucide-react';
import { format } from 'date-fns';

export function NimbleCrmSettings() {
  const { data: status, isLoading } = useNimbleCrmStatus();
  const connect = useConnectNimbleCrm();
  const disconnect = useDisconnectNimbleCrm();
  const sync = useSyncNimbleCrm();

  const [apiKey, setApiKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [syncDirection, setSyncDirection] = useState<'inbound' | 'outbound' | 'both'>('both');
  const [disconnectOpen, setDisconnectOpen] = useState(false);

  if (isLoading) return <Skeleton className="h-64" />;

  const isConnected = status?.isConnected ?? false;

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    connect.mutate(
      { apiKey: apiKey.trim(), accountId: accountId.trim() || undefined },
      { onSuccess: () => { setApiKey(''); setAccountId(''); } },
    );
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Nimble CRM
              </CardTitle>
              <CardDescription>Connect your Nimble CRM to sync contacts</CardDescription>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
              {isConnected ? (
                <><CheckCircle2 className="h-3 w-3" /> Connected</>
              ) : (
                <><XCircle className="h-3 w-3" /> Not Connected</>
              )}
            </Badge>
          </div>
        </CardHeader>
        {isConnected && status && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Synced Contacts</p>
                <p className="font-medium flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {status.syncedContacts} / {status.totalContacts}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Sync</p>
                <p className="font-medium">
                  {status.lastSyncAt ? format(new Date(status.lastSyncAt), 'PPp') : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="font-medium">{status.message}</p>
              </div>
            </div>
            {status.lastSyncError && (
              <p className="text-xs text-destructive">Last error: {status.lastSyncError}</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Connect / Disconnect */}
      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Connect to Nimble</CardTitle>
            <CardDescription>Enter your Nimble CRM API key to enable contact sync</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your Nimble API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountId">Account ID (optional)</Label>
                <Input
                  id="accountId"
                  placeholder="Nimble account ID"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={connect.isPending || !apiKey.trim()} className="gap-1.5">
                <Plug className="h-4 w-4" />
                {connect.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Sync Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sync Contacts</CardTitle>
              <CardDescription>Manually sync contacts between Sovereign and Nimble CRM</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Direction</Label>
                  <Select value={syncDirection} onValueChange={(v) => setSyncDirection(v as typeof syncDirection)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both ways</SelectItem>
                      <SelectItem value="inbound">Pull from Nimble</SelectItem>
                      <SelectItem value="outbound">Push to Nimble</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => sync.mutate(syncDirection)}
                  disabled={sync.isPending}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-4 w-4 ${sync.isPending ? 'animate-spin' : ''}`} />
                  {sync.isPending ? 'Syncing...' : 'Sync Now'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Disconnect */}
          <div className="flex justify-end">
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setDisconnectOpen(true)}>
              <Unplug className="h-4 w-4" />
              Disconnect Nimble CRM
            </Button>
          </div>

          <ConfirmDialog
            open={disconnectOpen}
            onOpenChange={setDisconnectOpen}
            title="Disconnect Nimble CRM"
            description="This will remove the CRM connection and clear all Nimble CRM IDs from your contacts. This cannot be undone."
            variant="destructive"
            confirmLabel="Disconnect"
            onConfirm={() => disconnect.mutate(undefined, { onSuccess: () => setDisconnectOpen(false) })}
          />
        </>
      )}
    </div>
  );
}
