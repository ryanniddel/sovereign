'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useContacts } from '@/hooks/use-contacts';
import { DataTable, type Column } from '@/components/shared/data-table';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { Badge } from '@/components/ui/badge';
import type { Contact } from '@sovereign/shared';

const columns: Column<Contact>[] = [
  { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
  { key: 'email', header: 'Email', cell: (r) => <span className="text-sm">{r.email}</span> },
  { key: 'company', header: 'Company', cell: (r) => r.company || '-' },
  { key: 'title', header: 'Title', cell: (r) => r.title || '-' },
  { key: 'relationshipScore', header: 'Score', cell: (r) => r.relationshipScore ? <Badge variant="outline">{r.relationshipScore}</Badge> : '-' },
];

export default function ContactsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useContacts({ page, pageSize: 20, search: search || undefined });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/contacts/tiers">Manage Tiers</Link></Button>
          <Button asChild><Link href="/contacts/new"><Plus className="mr-1 h-4 w-4" />New Contact</Link></Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} onRowClick={(r) => router.push(`/contacts/${r.id}`)} emptyTitle="No contacts" />
      {data?.pagination && <PaginationControls page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
