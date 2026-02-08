'use client';

import { useState } from 'react';
import { useFocusModeSessions } from '@/hooks/use-focus-modes';
import { DataTable, type Column } from '@/components/shared/data-table';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Badge } from '@/components/ui/badge';
import { FOCUS_MODE_DEACTIVATION_REASON_LABELS } from '@/lib/constants';
import type { FocusModeSession, FocusModeDeactivationReason } from '@sovereign/shared';
import { format } from 'date-fns';

const REASON_COLORS: Record<string, string> = {
  MANUAL: 'bg-blue-500/10 text-blue-500',
  SCHEDULED: 'bg-purple-500/10 text-purple-500',
  CALENDAR_EVENT_ENDED: 'bg-gray-500/10 text-gray-500',
  AUTO_EXPIRED: 'bg-orange-500/10 text-orange-500',
  OVERRIDE: 'bg-red-500/10 text-red-500',
};

const columns: Column<FocusModeSession>[] = [
  { key: 'focusModeName', header: 'Mode', cell: (r) => <span className="font-medium">{r.focusModeName}</span> },
  { key: 'activatedAt', header: 'Started', cell: (r) => format(new Date(r.activatedAt), 'PPp') },
  {
    key: 'deactivatedAt', header: 'Ended', cell: (r) =>
      r.deactivatedAt ? format(new Date(r.deactivatedAt), 'PPp') : <Badge variant="default" className="text-xs">Active</Badge>,
  },
  { key: 'durationMinutes', header: 'Duration', cell: (r) => r.durationMinutes != null ? `${r.durationMinutes}m` : '--' },
  {
    key: 'deactivationReason', header: 'Reason', cell: (r) =>
      r.deactivationReason ? (
        <Badge variant="outline" className={REASON_COLORS[r.deactivationReason] || ''}>
          {FOCUS_MODE_DEACTIVATION_REASON_LABELS[r.deactivationReason as FocusModeDeactivationReason] || r.deactivationReason}
        </Badge>
      ) : '--',
  },
  {
    key: 'notifications', header: 'Notifications', cell: (r) => (
      <span className="text-xs text-muted-foreground">
        {r.notificationsSuppressed} suppressed / {r.notificationsAllowed} allowed
      </span>
    ),
  },
];

export default function FocusModeSessionsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useFocusModeSessions({ page, pageSize: 20 });
  const sessions = data?.data || [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Focus Mode Sessions</h1>
      <DataTable columns={columns} data={sessions} loading={isLoading} emptyTitle="No sessions recorded" />
      {data?.pagination && <PaginationControls page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
