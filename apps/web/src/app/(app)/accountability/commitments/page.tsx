'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useCommitments } from '@/hooks/use-commitments';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { format } from 'date-fns';
import type { Commitment } from '@sovereign/shared';

const columns: Column<Commitment>[] = [
  { key: 'title', header: 'Title', cell: (r) => <span className="font-medium">{r.title}</span> },
  { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} type="commitment" /> },
  { key: 'priority', header: 'Priority', cell: (r) => <StatusBadge status={r.priority} type="priority" /> },
  { key: 'dueDate', header: 'Due', cell: (r) => format(new Date(r.dueDate), 'MMM d, yyyy') },
];

export default function CommitmentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCommitments({ page, pageSize: 20 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Commitments</h1>
        <Button asChild><Link href="/accountability/commitments/new"><Plus className="mr-1 h-4 w-4" />New</Link></Button>
      </div>
      <DataTable columns={columns} data={data?.data || []} loading={isLoading} onRowClick={(r) => router.push(`/accountability/commitments/${r.id}`)} emptyTitle="No commitments" />
      {data?.pagination && <PaginationControls page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
