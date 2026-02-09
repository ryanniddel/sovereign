'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  useActionItem,
  useUpdateActionItem,
  useCompleteActionItem,
  useRescheduleActionItem,
  useDelegateActionItem,
  useDeleteActionItem,
} from '@/hooks/use-action-items';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/shared/status-badge';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RescheduleDialog } from '@/components/accountability/reschedule-dialog';
import { DelegateDialog } from '@/components/accountability/delegate-dialog';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { CheckCircle2, CalendarClock, Forward, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PRIORITY_LABELS } from '@/lib/constants';
import type { Priority } from '@sovereign/shared';

export default function ActionItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: item, isLoading } = useActionItem(id);
  const update = useUpdateActionItem();
  const complete = useCompleteActionItem();
  const reschedule = useRescheduleActionItem();
  const delegateItem = useDelegateActionItem();
  const deleteItem = useDeleteActionItem();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  if (isLoading) return <PageSkeleton />;
  if (!item) return <p>Not found</p>;

  const isCompleted = item.status === 'COMPLETED';
  const dueDate = new Date(item.dueDate);

  const openEdit = () => {
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditPriority(item.priority || '');
    setEditDueDate(format(dueDate, 'yyyy-MM-dd'));
    setEditOpen(true);
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(
      {
        id,
        title: editTitle,
        description: editDescription || undefined,
        priority: (editPriority || undefined) as Priority | undefined,
        dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      },
      { onSuccess: () => setEditOpen(false) },
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{item.title}</h1>
          <div className="mt-1 flex gap-2">
            <StatusBadge status={item.status} type="actionItem" />
            <StatusBadge status={item.priority} type="priority" />
          </div>
        </div>
        <div className="flex gap-2">
          {!isCompleted && (
            <Button size="sm" className="gap-1.5" onClick={() => complete.mutate(id)} disabled={complete.isPending}>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
          {!isCompleted && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRescheduleOpen(true)}>
              <CalendarClock className="h-3.5 w-3.5" />
              Reschedule
            </Button>
          )}
          {!isCompleted && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDelegateOpen(true)}>
              <Forward className="h-3.5 w-3.5" />
              Delegate
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
          {item.description && (
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm whitespace-pre-wrap">{item.description}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm">
              {format(dueDate, 'PPP')}
              <span className="ml-2 text-xs text-muted-foreground">
                ({formatDistanceToNow(dueDate, { addSuffix: true })})
              </span>
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Source</p>
              <p className="text-sm">{item.externalSystem || 'Manual'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{format(new Date(item.createdAt), 'PPp')}</p>
            </div>
          </div>

          {item.completedAt && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-sm">{format(new Date(item.completedAt), 'PPp')}</p>
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

      {/* Dialogs */}
      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        currentDueDate={item.dueDate as unknown as string}
        onReschedule={(data) =>
          reschedule.mutate(
            { id, dueDate: new Date(data.newDueDate).toISOString() },
            { onSuccess: () => setRescheduleOpen(false) },
          )
        }
        loading={reschedule.isPending}
      />

      <DelegateDialog
        open={delegateOpen}
        onOpenChange={setDelegateOpen}
        onDelegate={(data) =>
          delegateItem.mutate(
            { id, delegateToId: data.delegatedToId },
            { onSuccess: () => setDelegateOpen(false) },
          )
        }
        loading={delegateItem.isPending}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Action Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Action Item"
        description="This cannot be undone."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => { deleteItem.mutate(id); router.push('/accountability/action-items'); }}
      />
    </div>
  );
}
