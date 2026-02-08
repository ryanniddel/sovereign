'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useSyncConfigs, useCreateSyncConfig, useUpdateSyncConfig, useDeleteSyncConfig, useSyncLogs,
} from '@/hooks/use-calendar';
import { CalendarSource, SyncDirection, SyncStatus } from '@sovereign/shared';
import type { CalendarSyncConfig } from '@sovereign/shared';
import { CALENDAR_EVENT_TYPE_LABELS } from '@/lib/constants';
import { RefreshCw, Plus, Trash2, FileText, ArrowDownUp } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const SOURCE_LABELS: Record<string, string> = { SOVEREIGN: 'Sovereign', OUTLOOK: 'Outlook', GOOGLE: 'Google' };
const DIRECTION_LABELS: Record<string, string> = { INBOUND: 'Inbound', OUTBOUND: 'Outbound', BOTH: 'Both' };

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  PAUSED: { label: 'Paused', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  ERROR: { label: 'Error', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  DISCONNECTED: { label: 'Disconnected', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
};

export function SyncConfigsManager() {
  const { data: configs, isLoading } = useSyncConfigs();
  const createConfig = useCreateSyncConfig();
  const updateConfig = useUpdateSyncConfig();
  const deleteConfig = useDeleteSyncConfig();
  const [createOpen, setCreateOpen] = useState(false);
  const [logsConfigId, setLogsConfigId] = useState<string | null>(null);

  const [source, setSource] = useState<CalendarSource>(CalendarSource.GOOGLE);
  const [direction, setDirection] = useState<SyncDirection>(SyncDirection.BOTH);
  const [externalAccountId, setExternalAccountId] = useState('');
  const [externalCalendarId, setExternalCalendarId] = useState('');
  const [externalCalendarName, setExternalCalendarName] = useState('');
  const [sovereignWins, setSovereignWins] = useState(true);
  const [autoImportNewEvents, setAutoImportNewEvents] = useState(true);
  const [syncIntervalMinutes, setSyncIntervalMinutes] = useState(5);

  const { data: logs } = useSyncLogs(logsConfigId || '');

  const handleCreate = () => {
    createConfig.mutate(
      {
        source,
        direction,
        externalAccountId: externalAccountId || undefined,
        externalCalendarId: externalCalendarId || undefined,
        externalCalendarName: externalCalendarName || undefined,
        sovereignWins,
        autoImportNewEvents,
        syncIntervalMinutes,
      },
      { onSuccess: () => setCreateOpen(false) },
    );
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Calendar Sync
              </CardTitle>
              <CardDescription>Connect and sync external calendars (Google, Outlook)</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Connect Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!configs?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No calendars connected.</p>
          ) : (
            <div className="space-y-3">
              {configs.map((cfg) => {
                const statusCfg = STATUS_CONFIG[cfg.status];
                return (
                  <div key={cfg.id} className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ArrowDownUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {cfg.externalCalendarName || SOURCE_LABELS[cfg.source]}
                            </span>
                            <Badge variant="outline" className="text-xs">{SOURCE_LABELS[cfg.source]}</Badge>
                            <Badge variant="outline" className="text-xs">{DIRECTION_LABELS[cfg.direction]}</Badge>
                            {statusCfg && (
                              <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Every {cfg.syncIntervalMinutes}min
                            {cfg.sovereignWins && ' · Sovereign wins'}
                            {cfg.lastSyncAt && ` · Last sync ${formatDistanceToNow(new Date(cfg.lastSyncAt), { addSuffix: true })}`}
                          </p>
                          {cfg.lastSyncError && (
                            <p className="text-xs text-red-400 mt-1">{cfg.lastSyncError}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setLogsConfigId(cfg.id)}>
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Switch
                          checked={cfg.status === 'ACTIVE'}
                          onCheckedChange={(checked) =>
                            updateConfig.mutate({ id: cfg.id, sovereignWins: checked ? cfg.sovereignWins : cfg.sovereignWins })
                          }
                        />
                        <Button variant="ghost" size="sm" onClick={() => deleteConfig.mutate(cfg.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pl-7">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Direction</Label>
                        <Select
                          value={cfg.direction}
                          onValueChange={(v) => updateConfig.mutate({ id: cfg.id, direction: v as SyncDirection })}
                        >
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(DIRECTION_LABELS).map(([k, v]) => (
                              <SelectItem key={k} value={k}>{v}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Interval (min)</Label>
                        <Input
                          type="number"
                          className="h-8 text-xs"
                          defaultValue={cfg.syncIntervalMinutes}
                          min={1}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value);
                            if (val && val !== cfg.syncIntervalMinutes)
                              updateConfig.mutate({ id: cfg.id, syncIntervalMinutes: val });
                          }}
                        />
                      </div>
                      <div className="flex items-end gap-2 pb-1">
                        <Switch
                          checked={cfg.sovereignWins}
                          onCheckedChange={(checked) => updateConfig.mutate({ id: cfg.id, sovereignWins: checked })}
                        />
                        <Label className="text-xs text-muted-foreground">Sovereign wins</Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Calendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={source} onValueChange={(v) => setSource(v as CalendarSource)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="GOOGLE">Google Calendar</SelectItem>
                  <SelectItem value="OUTLOOK">Outlook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sync Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as SyncDirection)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DIRECTION_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>External Account ID</Label>
              <Input value={externalAccountId} onChange={(e) => setExternalAccountId(e.target.value)} placeholder="your-email@gmail.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Calendar ID</Label>
                <Input value={externalCalendarId} onChange={(e) => setExternalCalendarId(e.target.value)} placeholder="primary" />
              </div>
              <div className="space-y-2">
                <Label>Calendar Name</Label>
                <Input value={externalCalendarName} onChange={(e) => setExternalCalendarName(e.target.value)} placeholder="Work Calendar" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sync Interval (minutes)</Label>
              <Input type="number" value={syncIntervalMinutes} min={1} onChange={(e) => setSyncIntervalMinutes(parseInt(e.target.value) || 5)} />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={sovereignWins} onCheckedChange={setSovereignWins} />
                <Label className="text-sm">Sovereign wins conflicts</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={autoImportNewEvents} onCheckedChange={setAutoImportNewEvents} />
                <Label className="text-sm">Auto-import events</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createConfig.isPending}>
                {createConfig.isPending ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sync logs dialog */}
      <Dialog open={!!logsConfigId} onOpenChange={() => setLogsConfigId(null)}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sync Logs</DialogTitle>
          </DialogHeader>
          {logs?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Conflict</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">{format(new Date(log.createdAt), 'MMM d, HH:mm')}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{log.direction}</Badge></TableCell>
                    <TableCell className="text-xs">{log.action}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{log.resolution}</Badge></TableCell>
                    <TableCell className="text-xs">{log.hasConflict ? 'Yes' : ''}</TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs text-red-400">{log.errorMessage || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No sync logs yet.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
