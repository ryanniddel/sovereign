'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ESCALATION_CHANNEL_LABELS, ESCALATION_TONE_LABELS } from '@/lib/constants';
import type { EscalationLog, EscalationChannel, EscalationTone, EscalationStatus } from '@sovereign/shared';

interface LogTableProps {
  logs: EscalationLog[];
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  SENT: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DELIVERED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  RESPONDED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/20',
  PAUSED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export function LogTable({ logs }: LogTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No escalation logs found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date/Time</TableHead>
          <TableHead>Recipient</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Tone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Response</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-sm">
              {format(new Date(log.sentAt), 'MMM d, yyyy HH:mm')}
            </TableCell>
            <TableCell className="text-sm">{log.recipientEmail}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {ESCALATION_CHANNEL_LABELS[log.channel as EscalationChannel] ?? log.channel}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">
                {ESCALATION_TONE_LABELS[log.tone as EscalationTone] ?? log.tone}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={statusColors[log.escalationStatus as string] ?? ''} variant="outline">
                {log.escalationStatus}
              </Badge>
            </TableCell>
            <TableCell>
              {log.responseReceivedAt ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
