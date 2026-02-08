'use client';

import { useState } from 'react';
import { usePendingOverrides, useResolveOverride, useRejectOverride } from '@/hooks/use-focus-modes';
import { OverrideDialog } from '@/components/focus-modes/override-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { FOCUS_MODE_OVERRIDE_STATUS_LABELS } from '@/lib/constants';
import type { FocusModeOverrideRequest, FocusModeOverrideStatus } from '@sovereign/shared';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500',
  APPROVED: 'bg-emerald-500/10 text-emerald-500',
  REJECTED: 'bg-red-500/10 text-red-500',
  EXPIRED: 'bg-gray-500/10 text-gray-500',
};

export default function FocusModeOverridesPage() {
  const { data: overrides, isLoading } = usePendingOverrides();
  const resolveOverride = useResolveOverride();
  const rejectOverride = useRejectOverride();
  const [selectedRequest, setSelectedRequest] = useState<FocusModeOverrideRequest | null>(null);
  const [resolveCode, setResolveCode] = useState('');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Pending Override Requests</h1>
        <Skeleton className="h-32" /><Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pending Override Requests</h1>
        <Button variant="outline" onClick={() => setResolveDialogOpen(true)}>
          <ShieldCheck className="mr-1 h-4 w-4" />Resolve by Code
        </Button>
      </div>

      {!overrides || overrides.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No pending overrides" description="All override requests have been resolved" />
      ) : (
        <div className="space-y-3">
          {overrides.map((request) => (
            <Card key={request.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRequest(request)}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{request.requesterEmail}</p>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested {format(new Date(request.createdAt), 'PPp')} · Expires {format(new Date(request.expiresAt), 'PPp')}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_COLORS[request.status] || ''}>
                    {FOCUS_MODE_OVERRIDE_STATUS_LABELS[request.status as FocusModeOverrideStatus] || request.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedRequest && (
        <OverrideDialog
          open={!!selectedRequest}
          onOpenChange={(open) => { if (!open) setSelectedRequest(null); }}
          request={selectedRequest}
          onApprove={() => {
            resolveOverride.mutate(
              { overrideCode: selectedRequest.overrideCode },
              { onSuccess: () => setSelectedRequest(null) },
            );
          }}
          onReject={() => {
            rejectOverride.mutate(
              { focusModeId: selectedRequest.focusModeId, overrideId: selectedRequest.id },
              { onSuccess: () => setSelectedRequest(null) },
            );
          }}
          loading={resolveOverride.isPending || rejectOverride.isPending}
        />
      )}

      {/* Resolve by 6-digit code dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Override by Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>6-Digit Override Code</Label>
            <Input
              value={resolveCode}
              onChange={(e) => setResolveCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="font-mono text-center text-lg tracking-widest"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={resolveOverride.isPending || resolveCode.length !== 6}
              onClick={() => {
                resolveOverride.mutate(
                  { overrideCode: resolveCode },
                  { onSuccess: () => { setResolveDialogOpen(false); setResolveCode(''); } },
                );
              }}
            >
              {resolveOverride.isPending ? 'Resolving...' : 'Resolve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
