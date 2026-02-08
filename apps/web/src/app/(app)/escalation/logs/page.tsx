'use client';

import { useEscalationLogs } from '@/hooks/use-escalation';
import { DataTable, type Column } from '@/components/shared/data-table';
import { format } from 'date-fns';
import { ESCALATION_CHANNEL_LABELS, ESCALATION_TONE_LABELS } from '@/lib/constants';
import type { EscalationLog, EscalationChannel, EscalationTone } from '@sovereign/shared';

const columns: Column<EscalationLog>[] = [
  { key: 'sentAt', header: 'Sent', cell: (r) => r.sentAt ? format(new Date(r.sentAt), 'PPp') : '-' },
  { key: 'channel', header: 'Channel', cell: (r) => ESCALATION_CHANNEL_LABELS[r.channel as EscalationChannel] || r.channel },
  { key: 'tone', header: 'Tone', cell: (r) => ESCALATION_TONE_LABELS[r.tone as EscalationTone] || r.tone },
  { key: 'recipientEmail', header: 'Recipient', cell: (r) => r.recipientEmail || '-' },
  { key: 'stepOrder', header: 'Step', cell: (r) => r.stepOrder },
];

export default function EscalationLogsPage() {
  const { data, isLoading } = useEscalationLogs();
  const logs = data?.data || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Escalation Logs</h1>
      <DataTable columns={columns} data={logs} loading={isLoading} emptyTitle="No escalation logs" />
    </div>
  );
}
