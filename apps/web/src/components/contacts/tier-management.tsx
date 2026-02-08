'use client';

import { useState } from 'react';
import { useContactTiers, useCreateContactTier, useDeleteContactTier } from '@/hooks/use-contact-tiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Plus, Trash2 } from 'lucide-react';
import { PageSkeleton } from '@/components/shared/loading-skeleton';

export function TierManagement() {
  const { data: tiers, isLoading } = useContactTiers();
  const createTier = useCreateContactTier();
  const deleteTier = useDeleteContactTier();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPriority, setNewPriority] = useState('0');

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contact Tiers</h2>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Tier
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tiers?.map((tier) => (
          <Card key={tier.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{tier.name}</CardTitle>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(tier.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Priority: {tier.priority} · Escalation delay: {tier.escalationDelayMinutes}min
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Tier</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Input type="number" value={newPriority} onChange={(e) => setNewPriority(e.target.value)} />
            </div>
            <Button
              className="w-full"
              onClick={() => {
                createTier.mutate({ name: newName, priority: parseInt(newPriority) });
                setNewName('');
                setCreateOpen(false);
              }}
              disabled={!newName}
            >
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Tier"
        description="Contacts in this tier will become untiered."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => { if (deleteId) deleteTier.mutate(deleteId); setDeleteId(null); }}
      />
    </div>
  );
}
