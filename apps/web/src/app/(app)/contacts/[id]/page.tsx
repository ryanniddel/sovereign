'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useContact, useUpdateContact, useUpdateContactDisc, useAssignContactTier, useDeleteContact, useBoostRelationshipScore } from '@/hooks/use-contacts';
import { useContactTiers } from '@/hooks/use-contact-tiers';
import { DetailHeader } from '@/components/contacts/detail-header';
import { DISCProfileDisplay } from '@/components/contacts/disc-profile-display';
import { DISCProfileForm } from '@/components/contacts/disc-profile-form';
import { MeetingContextPanel } from '@/components/contacts/meeting-context-panel';
import { TierBadge } from '@/components/contacts/tier-badge';
import { ContactForm } from '@/components/contacts/contact-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CalendarCheck, CheckCircle2, MessageSquare, CalendarPlus } from 'lucide-react';
import type { RelationshipBoostType } from '@sovereign/shared';

const BOOST_ACTIONS: { type: RelationshipBoostType; label: string; icon: typeof CalendarCheck }[] = [
  { type: 'meeting_completed', label: 'Meeting', icon: CalendarCheck },
  { type: 'commitment_delivered', label: 'Delivered', icon: CheckCircle2 },
  { type: 'responded', label: 'Responded', icon: MessageSquare },
  { type: 'meeting_scheduled', label: 'Scheduled', icon: CalendarPlus },
];

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-red-500';
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contact, isLoading } = useContact(id);
  const { data: tiers } = useContactTiers();
  const updateContact = useUpdateContact();
  const updateDisc = useUpdateContactDisc();
  const assignTier = useAssignContactTier();
  const deleteContact = useDeleteContact();
  const boost = useBoostRelationshipScore();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingDisc, setEditingDisc] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!contact) return <p>Not found</p>;

  const tierName = contact.tier?.name ?? tiers?.find((t) => t.id === contact.tierId)?.name;

  return (
    <div className="space-y-6">
      {/* Header with edit/delete */}
      <DetailHeader
        contact={contact}
        tierName={tierName}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {/* Tier Assignment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {tierName && <TierBadge tierName={tierName} priority={contact.tier?.priority} />}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">Assign Tier</Label>
                  <Select
                    value={contact.tierId ?? ''}
                    onValueChange={(val) => assignTier.mutate({ id: contact.id, tierId: val })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select tier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tiers?.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>{tier.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Relationship Score + Boost */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Relationship Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Progress value={contact.relationshipScore} className="h-3 flex-1" />
                <span className={`text-lg font-bold ${scoreColor(contact.relationshipScore)}`}>
                  {contact.relationshipScore}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Log an interaction to boost score</p>
                <div className="flex flex-wrap gap-2">
                  {BOOST_ACTIONS.map((action) => (
                    <Button
                      key={action.type}
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={boost.isPending}
                      onClick={() => boost.mutate({ id: contact.id, interactionType: action.type })}
                    >
                      <action.icon className="h-3.5 w-3.5" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DISC Profile — display or edit mode */}
          {editingDisc ? (
            <DISCProfileForm
              defaultValues={{
                discD: contact.discD,
                discI: contact.discI,
                discS: contact.discS,
                discC: contact.discC,
              }}
              onSubmit={(data) => {
                updateDisc.mutate({ id: contact.id, ...data }, {
                  onSuccess: () => setEditingDisc(false),
                });
              }}
              onCancel={() => setEditingDisc(false)}
              loading={updateDisc.isPending}
            />
          ) : (
            <DISCProfileDisplay
              discD={contact.discD}
              discI={contact.discI}
              discS={contact.discS}
              discC={contact.discC}
              onEdit={() => setEditingDisc(true)}
            />
          )}
        </div>

        {/* Right column — Meeting Context Intelligence */}
        <MeetingContextPanel contactId={id} />
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
          <ContactForm
            isEdit
            defaultValues={{
              name: contact.name,
              email: contact.email,
              phone: contact.phone ?? undefined,
              company: contact.company ?? undefined,
              title: contact.title ?? undefined,
              tierId: contact.tierId ?? undefined,
            }}
            loading={updateContact.isPending}
            onSubmit={(data) => {
              updateContact.mutate({ id: contact.id, ...data }, {
                onSuccess: () => setEditOpen(false),
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Contact"
        description="This cannot be undone. All associated data will be removed."
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={() => {
          deleteContact.mutate(id, { onSuccess: () => router.push('/contacts') });
        }}
      />
    </div>
  );
}
