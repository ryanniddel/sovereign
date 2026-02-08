'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useMeetings } from '@/hooks/use-meetings';
import { MeetingsTable } from '@/components/meetings/meetings-table';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { MEETING_STATUS_LABELS } from '@/lib/constants';

export default function MeetingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, isLoading } = useMeetings({
    page,
    pageSize: 20,
    status: statusFilter as never,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Meetings</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/meetings/analytics">Analytics</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/meetings/recurring">Recurring Reviews</Link>
          </Button>
          <Button asChild>
            <Link href="/meetings/new">
              <Plus className="mr-1 h-4 w-4" />
              New Meeting
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? undefined : v); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(MEETING_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <MeetingsTable meetings={data?.data || []} loading={isLoading} />

      {data?.pagination && (
        <PaginationControls
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
