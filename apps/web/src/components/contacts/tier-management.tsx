'use client';

import { useState } from 'react';
import { useContactTiers, useCreateContactTier, useUpdateContactTier, useDeleteContactTier } from '@/hooks/use-contact-tiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { TierForm } from '@/components/contacts/tier-form';
import { Plus, Trash2, Pencil, Users } from 'lucide-react';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import type { ContactTier } from '@sovereign/shared';

const ACCESS_LABELS: Record<string, string> = {
  full: 'Full', extended: 'Extended', standard: 'Standard', limited: 'Limited',
};
const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical', high: 'High', normal: 'Normal', low: 'Low',
};

export function TierManagement() {
  const { data: tiers, isLoading } = useContactTiers();
  const createTier = useCreateContactTier();
  const updateTier = useUpdateContactTier();
  const deleteTier = useDeleteContactTier();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTier, setEditTier] = useState<ContactTier | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm">{tier.name}</CardTitle>
                <Badge variant="outline" className="text-xs">P{tier.priority}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditTier(tier)}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(tier.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Escalation: {tier.escalationDelayMinutes}min</div>
                <div>Calendar: {ACCESS_LABELS[tier.calendarAccessLevel] ?? tier.calendarAccessLevel}</div>
                <div>Comms: {PRIORITY_LABELS[tier.communicationPriority] ?? tier.communicationPriority}</div>
                {tier._count?.contacts != null && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />{tier._count.contacts} contacts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Tier</DialogTitle></DialogHeader>
          <TierForm
            onSubmit={(data) => {
              createTier.mutate(data, { onSuccess: () => setCreateOpen(false) });
            }}
            onCancel={() => setCreateOpen(false)}
            loading={createTier.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTier} onOpenChange={() => setEditTier(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Tier</DialogTitle></DialogHeader>
          {editTier && (
            <TierForm
              defaultValues={{
                name: editTier.name,
                priority: editTier.priority,
                escalationDelayMinutes: editTier.escalationDelayMinutes,
                calendarAccessLevel: editTier.calendarAccessLevel as 'full' | 'extended' | 'standard' | 'limited',
                communicationPriority: editTier.communicationPriority as 'critical' | 'high' | 'normal' | 'low',
              }}
              onSubmit={(data) => {
                updateTier.mutate({ id: editTier.id, ...data }, { onSuccess: () => setEditTier(null) });
              }}
              onCancel={() => setEditTier(null)}
              loading={updateTier.isPending}
            />
          )}
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
