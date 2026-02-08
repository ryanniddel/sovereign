'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useAgreements } from '@/hooks/use-agreements';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { format } from 'date-fns';
import type { Agreement } from '@sovereign/shared';

const columns: Column<Agreement>[] = [
  { key: 'title', header: 'Title', cell: (r) => <span className="font-medium">{r.title}</span> },
  { key: 'isActive', header: 'Status', cell: (r) => <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  { key: 'parties', header: 'Parties', cell: (r) => <span className="text-sm">{r.parties?.length || 0}</span> },
  { key: 'agreedAt', header: 'Agreed', cell: (r) => r.agreedAt ? format(new Date(r.agreedAt), 'MMM d, yyyy') : '-' },
];

export default function AgreementsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAgreements({ page, pageSize: 20 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Agreements</h1>
        <Button asChild><Link href="/accountability/agreements/new"><Plus className="mr-1 h-4 w-4" />New</Link></Button>
      </div>
      <DataTable columns={columns} data={data?.data || []} loading={isLoading} onRowClick={(r) => router.push(`/accountability/agreements/${r.id}`)} emptyTitle="No agreements" />
      {data?.pagination && <PaginationControls page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
