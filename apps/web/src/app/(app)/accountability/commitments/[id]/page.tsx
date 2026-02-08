'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCommitment, useCompleteCommitment, useDeleteCommitment } from '@/hooks/use-commitments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { format } from 'date-fns';
import { useState } from 'react';

export default function CommitmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: item, isLoading } = useCommitment(id);
  const complete = useCompleteCommitment();
  const deleteItem = useDeleteCommitment();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!item) return <p>Not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <div className="mt-1 flex gap-2">
            <StatusBadge status={item.status} type="commitment" />
            <StatusBadge status={item.priority} type="priority" />
          </div>
        </div>
        <div className="flex gap-2">
          {item.status !== 'COMPLETED' && (
            <Button size="sm" onClick={() => complete.mutate(id)} disabled={complete.isPending}>Complete</Button>
          )}
          <Button size="sm" variant="destructive" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          {item.description && <div><p className="text-xs text-muted-foreground">Description</p><p className="text-sm">{item.description}</p></div>}
          <div><p className="text-xs text-muted-foreground">Due Date</p><p className="text-sm">{format(new Date(item.dueDate), 'PPP')}</p></div>
          {item.isDelegated && <div><p className="text-xs text-muted-foreground">Delegated</p><p className="text-sm">Yes (retains accountability: {item.delegatorRetainsAccountability ? 'Yes' : 'No'})</p></div>}
          <div><p className="text-xs text-muted-foreground">Affects Score</p><p className="text-sm">{item.affectsScore ? 'Yes' : 'No'}</p></div>
          <div><p className="text-xs text-muted-foreground">Created</p><p className="text-sm">{format(new Date(item.createdAt), 'PPp')}</p></div>
        </CardContent>
      </Card>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Commitment" description="This cannot be undone." variant="destructive" confirmLabel="Delete" onConfirm={() => { deleteItem.mutate(id); router.push('/accountability/commitments'); }} />
    </div>
  );
}
