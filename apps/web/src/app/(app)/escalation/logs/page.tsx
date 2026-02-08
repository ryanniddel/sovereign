'use client';

import { useState } from 'react';
import { useEscalationLogs, useRecordEscalationResponse } from '@/hooks/use-escalation';
import { DataTable, type Column } from '@/components/shared/data-table';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import {
  ESCALATION_CHANNEL_LABELS,
  ESCALATION_TONE_LABELS,
  ESCALATION_STATUS_LABELS,
  ESCALATION_TARGET_TYPE_LABELS,
} from '@/lib/constants';
import type { EscalationLog, EscalationChannel, EscalationTone, EscalationStatus, EscalationTargetType } from '@sovereign/shared';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500',
  SENT: 'bg-blue-500/10 text-blue-500',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500',
  RESPONDED: 'bg-green-500/10 text-green-500',
  CANCELLED: 'bg-gray-500/10 text-gray-500',
  PAUSED: 'bg-orange-500/10 text-orange-500',
};

export default function EscalationLogsPage() {
  const [page, setPage] = useState(1);
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [responseDialogLog, setResponseDialogLog] = useState<EscalationLog | null>(null);
  const [responseContent, setResponseContent] = useState('');
  const recordResponse = useRecordEscalationResponse();

  const { data, isLoading } = useEscalationLogs({
    page,
    pageSize: 20,
    ...(channelFilter ? { channel: channelFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(targetTypeFilter ? { targetType: targetTypeFilter } : {}),
  });
  const logs = data?.data || [];

  const columns: Column<EscalationLog>[] = [
    { key: 'sentAt', header: 'Sent', cell: (r) => r.sentAt ? format(new Date(r.sentAt), 'PPp') : '-' },
    {
      key: 'escalationStatus', header: 'Status', cell: (r) => (
        <Badge variant="outline" className={STATUS_COLORS[r.escalationStatus] || ''}>
          {ESCALATION_STATUS_LABELS[r.escalationStatus as EscalationStatus] || r.escalationStatus}
        </Badge>
      ),
    },
    {
      key: 'targetType', header: 'Target', cell: (r) =>
        ESCALATION_TARGET_TYPE_LABELS[r.targetType as EscalationTargetType] || r.targetType,
    },
    { key: 'channel', header: 'Channel', cell: (r) => ESCALATION_CHANNEL_LABELS[r.channel as EscalationChannel] || r.channel },
    { key: 'tone', header: 'Tone', cell: (r) => ESCALATION_TONE_LABELS[r.tone as EscalationTone] || r.tone },
    { key: 'recipientEmail', header: 'Recipient', cell: (r) => r.recipientEmail || '-' },
    { key: 'stepOrder', header: 'Step', cell: (r) => r.stepOrder },
    {
      key: 'actions', header: '', cell: (r) => (
        <div className="flex items-center gap-1">
          {(r.messageContent || r.responseContent) && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setExpandedLogId(expandedLogId === r.id ? null : r.id); }}
              title="View details"
            >
              {expandedLogId === r.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          {r.escalationStatus !== 'RESPONDED' && r.escalationStatus !== 'CANCELLED' && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); setResponseDialogLog(r); setResponseContent(''); }}
              title="Record response"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Escalation Logs</h1>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {Object.entries(ESCALATION_STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={channelFilter} onValueChange={(v) => { setChannelFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Channels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Channels</SelectItem>
            {Object.entries(ESCALATION_CHANNEL_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={targetTypeFilter} onValueChange={(v) => { setTargetTypeFilter(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Targets" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Targets</SelectItem>
            {Object.entries(ESCALATION_TARGET_TYPE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={logs} loading={isLoading} emptyTitle="No escalation logs" />

      {expandedLogId && (() => {
        const log = logs.find((l: EscalationLog) => l.id === expandedLogId);
        if (!log) return null;
        return (
          <Card className="border-l-4 border-l-primary">
            <CardContent className="py-3 space-y-2">
              {log.messageContent && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Message Sent</p>
                  <p className="text-sm whitespace-pre-wrap">{log.messageContent}</p>
                </div>
              )}
              {log.responseContent && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Response Received</p>
                  <p className="text-sm whitespace-pre-wrap">{log.responseContent}</p>
                </div>
              )}
              {log.deliveredAt && (
                <p className="text-xs text-muted-foreground">Delivered: {format(new Date(log.deliveredAt), 'PPp')}</p>
              )}
              {log.responseReceivedAt && (
                <p className="text-xs text-muted-foreground">Response at: {format(new Date(log.responseReceivedAt), 'PPp')}</p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {data?.pagination && <PaginationControls page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}

      <Dialog open={!!responseDialogLog} onOpenChange={(open) => { if (!open) setResponseDialogLog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Response</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Response content (optional)"
            value={responseContent}
            onChange={(e) => setResponseContent(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogLog(null)}>Cancel</Button>
            <Button
              disabled={recordResponse.isPending}
              onClick={() => {
                if (responseDialogLog) {
                  recordResponse.mutate(
                    { logId: responseDialogLog.id, responseContent: responseContent || undefined },
                    { onSuccess: () => setResponseDialogLog(null) },
                  );
                }
              }}
            >
              {recordResponse.isPending ? 'Recording...' : 'Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
