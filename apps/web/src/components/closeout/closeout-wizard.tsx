'use client';

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useOpenItems,
  useTodayCloseout,
  useInitiateCloseout,
  useResolveItems,
  useReviewAgreements,
  useCompleteCloseout,
} from '@/hooks/use-daily-closeout';
import { useContacts } from '@/hooks/use-contacts';
import { OpenItemsChecklist } from './open-items-checklist';
import { ReflectionForm } from './reflection-form';
import { CloseoutSummary } from './closeout-summary';
import { ContactSearchCombobox } from '@/components/contacts/contact-search-combobox';
import { Handshake, ArrowRight, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { Priority } from '@sovereign/shared';

type Step = 'review' | 'agreements' | 'reflect' | 'done';

const STEPS: { key: Step; label: string }[] = [
  { key: 'review', label: 'Resolve Items' },
  { key: 'agreements', label: 'Agreements' },
  { key: 'reflect', label: 'Reflect' },
  { key: 'done', label: 'Complete' },
];

type ItemResolution = {
  itemId: string;
  itemType: 'commitment' | 'actionItem';
  resolution: 'completed' | 'rescheduled' | 'delegated';
  newDueDate?: string;
  delegateToId?: string;
};

export function CloseoutWizard() {
  const { data: openItems, isLoading } = useOpenItems();
  const { data: todayCloseout } = useTodayCloseout();
  const initiate = useInitiateCloseout();
  const resolve = useResolveItems();
  const reviewAgreements = useReviewAgreements();
  const completeCloseout = useCompleteCloseout();
  const { data: contactsData } = useContacts({ page: 1, pageSize: 200 });

  const [step, setStep] = useState<Step>('review');
  const [resolutions, setResolutions] = useState<ItemResolution[]>([]);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState('');
  const [activeItemType, setActiveItemType] = useState<'commitment' | 'actionItem'>('actionItem');
  const [newDueDate, setNewDueDate] = useState('');
  const [delegateToId, setDelegateToId] = useState('');

  // Flatten items for OpenItemsChecklist
  const flatItems = useMemo(() => {
    if (!openItems) return [];
    const items: { id: string; title: string; type: 'commitment' | 'actionItem'; priority: string; dueDate: string; status: string }[] = [];
    for (const c of openItems.commitments || []) {
      items.push({
        id: c.id,
        title: c.title,
        type: 'commitment',
        priority: c.priority as string,
        dueDate: c.dueDate as unknown as string,
        status: c.status as string,
      });
    }
    for (const a of openItems.actionItems || []) {
      items.push({
        id: a.id,
        title: a.title,
        type: 'actionItem',
        priority: a.priority as string,
        dueDate: a.dueDate as unknown as string,
        status: a.status as string,
      });
    }
    return items;
  }, [openItems]);

  const agreements = openItems?.activeAgreements || [];
  const contacts = contactsData?.data || [];

  // Items not yet resolved
  const unresolvedItems = useMemo(() => {
    const resolvedIds = new Set(resolutions.map((r) => r.itemId));
    return flatItems.filter((item) => !resolvedIds.has(item.id));
  }, [flatItems, resolutions]);

  const findItemType = useCallback(
    (id: string): 'commitment' | 'actionItem' => {
      const item = flatItems.find((i) => i.id === id);
      return item?.type || 'actionItem';
    },
    [flatItems],
  );

  const handleComplete = (id: string) => {
    setResolutions((prev) => [...prev, { itemId: id, itemType: findItemType(id), resolution: 'completed' }]);
  };

  const openReschedule = (id: string) => {
    setActiveItemId(id);
    setActiveItemType(findItemType(id));
    setNewDueDate('');
    setRescheduleOpen(true);
  };

  const handleReschedule = () => {
    if (!newDueDate) return;
    setResolutions((prev) => [
      ...prev,
      { itemId: activeItemId, itemType: activeItemType, resolution: 'rescheduled', newDueDate: new Date(newDueDate).toISOString() },
    ]);
    setRescheduleOpen(false);
  };

  const openDelegate = (id: string) => {
    setActiveItemId(id);
    setActiveItemType(findItemType(id));
    setDelegateToId('');
    setDelegateOpen(true);
  };

  const handleDelegate = () => {
    if (!delegateToId) return;
    setResolutions((prev) => [
      ...prev,
      { itemId: activeItemId, itemType: activeItemType, resolution: 'delegated', delegateToId },
    ]);
    setDelegateOpen(false);
  };

  const undoResolution = (itemId: string) => {
    setResolutions((prev) => prev.filter((r) => r.itemId !== itemId));
  };

  const handleInitiate = () => {
    initiate.mutate(undefined);
  };

  const handleSubmitResolutions = () => {
    if (resolutions.length === 0 && unresolvedItems.length === 0) {
      // No items to resolve
      setStep(agreements.length > 0 ? 'agreements' : 'reflect');
      return;
    }
    resolve.mutate(resolutions, {
      onSuccess: () => setStep(agreements.length > 0 ? 'agreements' : 'reflect'),
    });
  };

  const handleReviewAgreements = () => {
    reviewAgreements.mutate(agreements.length, {
      onSuccess: () => setStep('reflect'),
    });
  };

  const handleCompleteCloseout = (data: { notes: string }) => {
    completeCloseout.mutate(data.notes || undefined, {
      onSuccess: () => setStep('done'),
    });
  };

  // Already completed today
  if (todayCloseout?.isCompleted && step !== 'done') {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-lg font-semibold">Already Closed Out</h2>
            <p className="text-sm text-muted-foreground">You completed today's closeout at {todayCloseout.completedAt ? format(new Date(todayCloseout.completedAt), 'h:mm a') : 'earlier'}.</p>
          </CardContent>
        </Card>
        {todayCloseout.closeoutSummary && (
          <CloseoutSummary summary={todayCloseout.closeoutSummary} />
        )}
      </div>
    );
  }

  // Step progress indicator
  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, idx) => (
          <div key={s.key} className="flex items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                idx < currentStepIdx
                  ? 'bg-emerald-500 text-white'
                  : idx === currentStepIdx
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {idx < currentStepIdx ? <CheckCircle className="h-4 w-4" /> : idx + 1}
            </div>
            <span className={`text-xs hidden sm:inline ${idx === currentStepIdx ? 'font-medium' : 'text-muted-foreground'}`}>
              {s.label}
            </span>
            {idx < STEPS.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />}
          </div>
        ))}
      </div>

      {/* Step 1: Resolve open items */}
      {step === 'review' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Resolve Open Items</h2>
            <Button onClick={handleInitiate} variant="outline" size="sm" disabled={initiate.isPending}>
              {initiate.isPending ? 'Initiating...' : 'Initiate Closeout'}
            </Button>
          </div>

          {isLoading ? (
            <Skeleton className="h-48" />
          ) : (
            <>
              <OpenItemsChecklist
                items={unresolvedItems}
                onComplete={handleComplete}
                onReschedule={openReschedule}
                onDelegate={openDelegate}
              />

              {/* Resolved items summary */}
              {resolutions.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Resolved ({resolutions.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {resolutions.map((r) => {
                      const item = flatItems.find((i) => i.id === r.itemId);
                      return (
                        <div key={r.itemId} className="flex items-center justify-between rounded-md border p-2">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={
                                r.resolution === 'completed'
                                  ? 'border-emerald-500/30 text-emerald-600'
                                  : r.resolution === 'rescheduled'
                                    ? 'border-blue-500/30 text-blue-600'
                                    : 'border-orange-500/30 text-orange-600'
                              }
                            >
                              {r.resolution}
                            </Badge>
                            <span className="text-sm">{item?.title || r.itemId}</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => undoResolution(r.itemId)}>
                            Undo
                          </Button>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                {unresolvedItems.length > 0 && (
                  <Button variant="outline" onClick={() => setStep(agreements.length > 0 ? 'agreements' : 'reflect')}>
                    Skip Remaining
                  </Button>
                )}
                <Button
                  onClick={handleSubmitResolutions}
                  disabled={resolve.isPending || (resolutions.length === 0 && unresolvedItems.length > 0)}
                >
                  {resolve.isPending ? 'Submitting...' : unresolvedItems.length === 0 ? 'Continue' : `Submit ${resolutions.length} Resolutions`}
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* Step 2: Review agreements */}
      {step === 'agreements' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Review Active Agreements ({agreements.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {agreements.map((a) => (
              <div key={a.id} className="rounded-md border p-3">
                <p className="text-sm font-medium">{a.title}</p>
                {a.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.description}</p>}
                {a.parties?.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {a.parties.map((party: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{party}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('reflect')}>Skip</Button>
              <Button onClick={handleReviewAgreements} disabled={reviewAgreements.isPending}>
                {reviewAgreements.isPending ? 'Reviewing...' : 'Mark All Reviewed'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Reflection */}
      {step === 'reflect' && (
        <ReflectionForm
          onSubmit={handleCompleteCloseout}
          loading={completeCloseout.isPending}
        />
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex flex-col items-center py-12">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <h2 className="mt-4 text-lg font-semibold">Closeout Complete</h2>
              <p className="text-sm text-muted-foreground">Great work today. Rest well.</p>
            </CardContent>
          </Card>
          {todayCloseout?.closeoutSummary && (
            <CloseoutSummary summary={todayCloseout.closeoutSummary} />
          )}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Item</DialogTitle>
            <DialogDescription>Pick a new due date for this item.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Due Date</Label>
              <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
              <Button onClick={handleReschedule} disabled={!newDueDate}>Reschedule</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delegate Dialog */}
      <Dialog open={delegateOpen} onOpenChange={setDelegateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegate Item</DialogTitle>
            <DialogDescription>Select a contact to delegate this item to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Delegate To</Label>
              <ContactSearchCombobox
                contacts={contacts}
                value={delegateToId}
                onSelect={setDelegateToId}
                placeholder="Search contacts..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDelegateOpen(false)}>Cancel</Button>
              <Button onClick={handleDelegate} disabled={!delegateToId}>Delegate</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
