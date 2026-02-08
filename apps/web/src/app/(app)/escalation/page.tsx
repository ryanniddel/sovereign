'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useEscalationRules } from '@/hooks/use-escalation';
import { DataTable, type Column } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { ESCALATION_TRIGGER_LABELS } from '@/lib/constants';
import type { EscalationRule, EscalationTrigger } from '@sovereign/shared';

const columns: Column<EscalationRule>[] = [
  { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
  { key: 'triggerType', header: 'Trigger', cell: (r) => ESCALATION_TRIGGER_LABELS[r.triggerType as EscalationTrigger] || r.triggerType },
  { key: 'steps', header: 'Steps', cell: (r) => r.steps?.length || 0 },
  { key: 'isActive', header: 'Status', cell: (r) => <Badge variant={r.isActive ? 'default' : 'secondary'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
];

export default function EscalationPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useEscalationRules({ page, pageSize: 20 });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Escalation Rules</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/escalation/logs">View Logs</Link></Button>
          <Button asChild><Link href="/escalation/new"><Plus className="mr-1 h-4 w-4" />New Rule</Link></Button>
        </div>
      </div>
      <DataTable columns={columns} data={data?.data || []} loading={isLoading} onRowClick={(r) => router.push(`/escalation/${r.id}`)} emptyTitle="No escalation rules" />
      {data?.pagination && <PaginationControls page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
