'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useActionItems } from '@/hooks/use-action-items';
import { DataTable, type Column } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { format } from 'date-fns';
import type { ActionItem } from '@sovereign/shared';

const columns: Column<ActionItem>[] = [
  { key: 'title', header: 'Title', cell: (r) => <span className="font-medium">{r.title}</span> },
  { key: 'status', header: 'Status', cell: (r) => <StatusBadge status={r.status} type="actionItem" /> },
  { key: 'priority', header: 'Priority', cell: (r) => <StatusBadge status={r.priority} type="priority" /> },
  { key: 'dueDate', header: 'Due', cell: (r) => format(new Date(r.dueDate), 'MMM d, yyyy') },
];

export default function ActionItemsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useActionItems({ page, pageSize: 20 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Action Items</h1>
        <Button asChild><Link href="/accountability/action-items/new"><Plus className="mr-1 h-4 w-4" />New</Link></Button>
      </div>
      <DataTable columns={columns} data={data?.data || []} loading={isLoading} onRowClick={(r) => router.push(`/accountability/action-items/${r.id}`)} emptyTitle="No action items" />
      {data?.pagination && <PaginationControls page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
