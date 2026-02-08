'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  useAgreement,
  useUpdateAgreement,
  useSupersedeAgreement,
  useDeactivateAgreement,
  useDeleteAgreement,
} from '@/hooks/use-agreements';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { format } from 'date-fns';
import { useState } from 'react';
import { Pencil, Trash2, ArrowUpRight, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function AgreementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: item, isLoading } = useAgreement(id);
  const update = useUpdateAgreement();
  const supersede = useSupersedeAgreement();
  const deactivate = useDeactivateAgreement();
  const deleteItem = useDeleteAgreement();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [supersedeOpen, setSupersedeOpen] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Supersede form state
  const [superTitle, setSuperTitle] = useState('');
  const [superDescription, setSuperDescription] = useState('');

  if (isLoading) return <PageSkeleton />;
  if (!item) return <p>Not found</p>;

  const openEdit = () => {
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      { id, title: editTitle, description: editDescription },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  const openSupersede = () => {
    setSuperTitle('');
    setSuperDescription('');
    setSupersedeOpen(true);
  };

  const handleSupersede = (e: React.FormEvent) => {
    e.preventDefault();
    supersede.mutate(
      { id, title: superTitle, description: superDescription, parties: item.parties || [] },
      { onSuccess: () => { setSupersedeOpen(false); router.push('/accountability/agreements'); } },
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <Badge variant={item.isActive ? 'default' : 'secondary'} className="mt-1">
            {item.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex gap-2">
          {item.isActive && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={openSupersede}>
              <ArrowUpRight className="h-3.5 w-3.5" />
              Supersede
            </Button>
          )}
          {item.isActive && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => deactivate.mutate(id)}>
              <XCircle className="h-3.5 w-3.5" />
              Deactivate
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Description</p>
            <p className="text-sm whitespace-pre-wrap">{item.description}</p>
          </div>

          {item.parties && item.parties.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Parties</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {item.parties.map((party: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{party}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            {item.agreedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Agreed At</p>
                <p className="text-sm">{format(new Date(item.agreedAt), 'PPP')}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(item.createdAt), 'PPp')}</p>
            </div>
          </div>

          {item.supersededById && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Superseded By</p>
                <a href={`/accountability/agreements/${item.supersededById}`} className="text-sm text-primary hover:underline">
                  View New Agreement
                </a>
              </div>
            </>
          )}

          {item.meetingId && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">From Meeting</p>
                <a href={`/meetings/${item.meetingId}`} className="text-sm text-primary hover:underline">View Meeting</a>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Agreement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Supersede Dialog */}
      <Dialog open={supersedeOpen} onOpenChange={setSupersedeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supersede Agreement</DialogTitle>
            <DialogDescription>
              Create a new agreement that replaces this one. The current agreement will be marked as inactive.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSupersede} className="space-y-4">
            <div className="space-y-2">
              <Label>New Agreement Title</Label>
              <Input value={superTitle} onChange={(e) => setSuperTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>New Agreement Description</Label>
              <Textarea value={superDescription} onChange={(e) => setSuperDescription(e.target.value)} rows={4} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSupersedeOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={supersede.isPending}>
                {supersede.isPending ? 'Creating...' : 'Create & Supersede'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Agreement"
        description="This cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => { deleteItem.mutate(id); router.push('/accountability/agreements'); }}
      />
    </div>
  );
}
