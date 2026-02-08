'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Upload, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { useContacts } from '@/hooks/use-contacts';
import { useContactTiers } from '@/hooks/use-contact-tiers';
import { DataTable, type Column } from '@/components/shared/data-table';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { TierBadge } from '@/components/contacts/tier-badge';
import { RelationshipScoreBadge } from '@/components/contacts/relationship-score-badge';
import type { Contact } from '@sovereign/shared';

const SORT_OPTIONS = [
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
  { value: 'relationshipScore:desc', label: 'Score (High)' },
  { value: 'relationshipScore:asc', label: 'Score (Low)' },
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'lastInteractionAt:desc', label: 'Recent Activity' },
];

const columns: Column<Contact>[] = [
  { key: 'name', header: 'Name', cell: (r) => <span className="font-medium">{r.name}</span> },
  { key: 'email', header: 'Email', cell: (r) => <span className="text-sm text-muted-foreground">{r.email}</span> },
  { key: 'company', header: 'Company', cell: (r) => r.company || '-' },
  {
    key: 'tier', header: 'Tier', cell: (r) =>
      r.tier ? <TierBadge tierName={r.tier.name} priority={r.tier.priority} /> : <span className="text-xs text-muted-foreground">--</span>,
  },
  {
    key: 'relationshipScore', header: 'Score', cell: (r) =>
      <RelationshipScoreBadge score={r.relationshipScore} />,
  },
];

export default function ContactsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [tierId, setTierId] = useState<string>('');
  const [sort, setSort] = useState('name:asc');
  const { data: tiers } = useContactTiers();

  const [sortBy, sortOrder] = sort.split(':');
  const { data, isLoading } = useContacts({
    page,
    pageSize: 20,
    search: search || undefined,
    tierId: tierId || undefined,
    sortBy,
    sortOrder,
  });

  const clearFilters = () => {
    setSearch('');
    setTierId('');
    setSort('name:asc');
    setPage(1);
  };

  const hasFilters = search || tierId || sort !== 'name:asc';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/contacts/tiers">Manage Tiers</Link></Button>
          <Button variant="outline" asChild><Link href="/contacts/import"><Upload className="mr-1 h-4 w-4" />Import</Link></Button>
          <Button asChild><Link href="/contacts/new"><Plus className="mr-1 h-4 w-4" />New Contact</Link></Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>

        <Select value={tierId} onValueChange={(val) => { setTierId(val === 'all' ? '' : val); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            {tiers?.map((tier) => (
              <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(val) => { setSort(val); setPage(1); }}>
          <SelectTrigger className="w-[180px]">
            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>
        )}
      </div>

      <DataTable columns={columns} data={data?.data || []} loading={isLoading} onRowClick={(r) => router.push(`/contacts/${r.id}`)} emptyTitle="No contacts" />
      {data?.pagination && <PaginationControls page={data.pagination.page} totalPages={data.pagination.totalPages} onPageChange={setPage} />}
    </div>
  );
}
