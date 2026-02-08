'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAgreement, useDeactivateAgreement, useDeleteAgreement } from '@/hooks/use-agreements';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { format } from 'date-fns';
import { useState } from 'react';

export default function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: item, isLoading } = useAgreement(id);
  const deactivate = useDeactivateAgreement();
  const deleteItem = useDeleteAgreement();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!item) return <p>Not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <Badge variant={item.isActive ? 'default' : 'secondary'} className="mt-1">{item.isActive ? 'Active' : 'Inactive'}</Badge>
        </div>
        <div className="flex gap-2">
          {item.isActive && <Button size="sm" variant="outline" onClick={() => deactivate.mutate(id)}>Deactivate</Button>}
          <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{item.description}</p></div>
          {item.agreedAt && <div><p className="text-xs text-muted-foreground">Agreed At</p><p className="text-sm">{format(new Date(item.agreedAt), 'PPP')}</p></div>}
          <div><p className="text-xs text-muted-foreground">Created</p><p className="text-sm">{format(new Date(item.createdAt), 'PPp')}</p></div>
        </CardContent>
      </Card>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Agreement" description="This cannot be undone." variant="destructive" confirmLabel="Delete" onConfirm={() => { deleteItem.mutate(id); router.push('/accountability/agreements'); }} />
    </div>
  );
}
