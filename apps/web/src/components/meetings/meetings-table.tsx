'use client';

import { useRouter } from 'next/navigation';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';
import type { Meeting } from '@sovereign/shared';
import { MEETING_TYPE_LABELS } from '@/lib/constants';
import type { MeetingType } from '@sovereign/shared';

const columns: Column<Meeting>[] = [
  {
    key: 'title',
    header: 'Title',
    cell: (row) => <span className="font-medium">{row.title}</span>,
  },
  {
    key: 'meetingType',
    header: 'Type',
    cell: (row) => MEETING_TYPE_LABELS[row.meetingType as MeetingType] || row.meetingType,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => <StatusBadge status={row.status} type="meeting" />,
  },
  {
    key: 'duration',
    header: 'Duration',
    cell: (row) => `${row.estimatedDurationMinutes || 0}min`,
  },
  {
    key: 'created',
    header: 'Created',
    cell: (row) => format(new Date(row.createdAt), 'MMM d, yyyy'),
  },
];

interface MeetingsTableProps {
  meetings: Meeting[];
  loading?: boolean;
}

export function MeetingsTable({ meetings, loading }: MeetingsTableProps) {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={meetings}
      loading={loading}
      emptyTitle="No meetings"
      emptyDescription="Create a new meeting request to get started"
      onRowClick={(row) => router.push(`/meetings/${row.id}`)}
    />
  );
}
