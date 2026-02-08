'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useOpenItems, useInitiateCloseout, useResolveItems, useReviewAgreements, useCompleteCloseout } from '@/hooks/use-daily-closeout';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Target, ClipboardList, Handshake } from 'lucide-react';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import type { Priority } from '@sovereign/shared';

type FlatItem = { id: string; title: string; itemType: 'commitment' | 'actionItem'; priority?: Priority; dueDate?: string };

export function CloseoutWizard() {
  const { data: openItems, isLoading } = useOpenItems();
  const initiate = useInitiateCloseout();
  const resolve = useResolveItems();
  const reviewAgreements = useReviewAgreements();
  const complete = useCompleteCloseout();
  const [step, setStep] = useState<'review' | 'agreements' | 'reflect' | 'done'>('review');
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [itemTypeMap, setItemTypeMap] = useState<Record<string, 'commitment' | 'actionItem'>>({});
  const [reflection, setReflection] = useState('');

  // Flatten commitments + action items into one list
  const flatItems = useMemo<FlatItem[]>(() => {
    if (!openItems) return [];
    const items: FlatItem[] = [];
    for (const c of openItems.commitments || []) {
      items.push({ id: c.id, title: c.title, itemType: 'commitment', priority: c.priority as Priority, dueDate: c.dueDate as unknown as string });
    }
    for (const a of openItems.actionItems || []) {
      items.push({ id: a.id, title: a.title, itemType: 'actionItem', priority: a.priority as Priority, dueDate: a.dueDate as unknown as string });
    }
    return items;
  }, [openItems]);

  const agreements = openItems?.activeAgreements || [];

  const handleInitiate = () => {
    initiate.mutate(undefined);
  };

  const toggleResolved = (item: FlatItem) => {
    const next = new Set(resolved);
    const nextMap = { ...itemTypeMap };
    if (next.has(item.id)) {
      next.delete(item.id);
      delete nextMap[item.id];
    } else {
      next.add(item.id);
      nextMap[item.id] = item.itemType;
    }
    setResolved(next);
    setItemTypeMap(nextMap);
  };

  const handleResolve = () => {
    const resolutions = Array.from(resolved).map((itemId) => ({
      itemId,
      itemType: itemTypeMap[itemId] || ('actionItem' as const),
      resolution: 'completed' as const,
    }));
    resolve.mutate(resolutions, {
      onSuccess: () => setStep(agreements.length > 0 ? 'agreements' : 'reflect'),
    });
  };

  const handleReviewAgreements = () => {
    reviewAgreements.mutate(agreements.length, {
      onSuccess: () => setStep('reflect'),
    });
  };

  const handleComplete = () => {
    complete.mutate(reflection || undefined, { onSuccess: () => setStep('done') });
  };

  if (step === 'done') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <CheckCircle className="h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-lg font-semibold">Closeout Complete</h2>
          <p className="text-sm text-muted-foreground">Great work today. Rest well.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {step === 'review' && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Open Items</CardTitle>
                <Button onClick={handleInitiate} variant="outline" size="sm" disabled={initiate.isPending}>
                  {initiate.isPending ? 'Initiating...' : 'Initiate Closeout'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32" />
              ) : flatItems.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No open items!</p>
                  <Button className="mt-2" onClick={() => setStep(agreements.length > 0 ? 'agreements' : 'reflect')}>
                    Continue
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {flatItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-md border p-3">
                      <Checkbox
                        checked={resolved.has(item.id)}
                        onCheckedChange={() => toggleResolved(item)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.itemType === 'commitment' ? (
                            <Target className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ClipboardList className="h-3 w-3 text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium">{item.title}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">{item.itemType === 'commitment' ? 'Commitment' : 'Action Item'}</Badge>
                          {item.priority && (
                            <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[item.priority]}`}>
                              {PRIORITY_LABELS[item.priority]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {flatItems.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(agreements.length > 0 ? 'agreements' : 'reflect')}>Skip</Button>
              <Button onClick={handleResolve} disabled={resolved.size === 0 || resolve.isPending}>
                {resolve.isPending ? 'Resolving...' : `Resolve ${resolved.size} Selected`}
              </Button>
            </div>
          )}
        </>
      )}

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
                {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                {a.parties?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Parties: {a.parties.join(', ')}</p>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('reflect')}>Skip</Button>
              <Button onClick={handleReviewAgreements} disabled={reviewAgreements.isPending}>
                {reviewAgreements.isPending ? 'Reviewing...' : 'Mark Reviewed'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'reflect' && (
        <Card>
          <CardHeader><CardTitle>Daily Reflection</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>How did today go? What did you learn?</Label>
              <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} rows={4} placeholder="Reflect on your day..." />
              <p className="text-xs text-muted-foreground text-right">{reflection.length}/2000</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleComplete}>Skip</Button>
              <Button onClick={handleComplete} disabled={complete.isPending}>
                {complete.isPending ? 'Completing...' : 'Complete Closeout'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
