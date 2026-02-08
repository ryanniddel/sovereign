'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useOpenItems, useInitiateCloseout, useResolveItems, useCompleteCloseout } from '@/hooks/use-daily-closeout';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle } from 'lucide-react';

export function CloseoutWizard() {
  const { data: openItems, isLoading } = useOpenItems();
  const initiate = useInitiateCloseout();
  const resolve = useResolveItems();
  const complete = useCompleteCloseout();
  const [step, setStep] = useState<'review' | 'reflect' | 'done'>('review');
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  const [reflection, setReflection] = useState('');

  const handleInitiate = () => {
    initiate.mutate(undefined);
  };

  const toggleResolved = (itemId: string) => {
    const next = new Set(resolved);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    setResolved(next);
  };

  const handleResolve = () => {
    const resolutions = Array.from(resolved).map((itemId) => ({
      itemId,
      itemType: 'actionItem' as const,
      resolution: 'completed' as const,
    }));
    resolve.mutate(resolutions, { onSuccess: () => setStep('reflect') });
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
              <CardTitle>Open Items</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32" />
              ) : !openItems?.length ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No open items!</p>
                  <Button className="mt-2" onClick={() => setStep('reflect')}>Continue to Reflection</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(openItems as Array<{ id: string; title: string; type: string }>).map((item) => (
                    <div key={item.id} className="flex items-center gap-3 rounded-md border p-3">
                      <Checkbox
                        checked={resolved.has(item.id)}
                        onCheckedChange={() => toggleResolved(item.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {openItems && openItems.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep('reflect')}>Skip</Button>
              <Button onClick={handleResolve} disabled={resolved.size === 0}>Resolve Selected</Button>
            </div>
          )}
          <Button onClick={handleInitiate} variant="outline" disabled={initiate.isPending}>
            {initiate.isPending ? 'Initiating...' : 'Initiate Closeout'}
          </Button>
        </>
      )}

      {step === 'reflect' && (
        <Card>
          <CardHeader><CardTitle>Daily Reflection</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>How did today go? What did you learn?</Label>
              <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} rows={4} />
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
