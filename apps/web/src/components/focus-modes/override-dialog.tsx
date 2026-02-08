'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ShieldAlert } from 'lucide-react';
import type { FocusModeOverrideRequest, FocusModeOverrideStatus } from '@sovereign/shared';

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: FocusModeOverrideRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  loading?: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
  EXPIRED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export function OverrideDialog({ open, onOpenChange, request, onApprove, onReject, loading }: OverrideDialogProps) {
  const isResolved = request.status !== 'PENDING';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            <DialogTitle>Focus Mode Override Request</DialogTitle>
          </div>
          <DialogDescription>
            Someone is requesting to override the active focus mode.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Requester</span>
              <span className="text-sm font-medium">{request.requesterEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Reason</span>
              <span className="text-sm">{request.reason}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Override Code</span>
              <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{request.overrideCode}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Expires At</span>
              <span className="text-sm">{format(new Date(request.expiresAt), 'MMM d, yyyy HH:mm')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Status</span>
              <Badge className={statusColors[request.status as string] ?? ''} variant="outline">
                {request.status}
              </Badge>
            </div>
            {request.resolvedByEmail && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Resolved By</span>
                <span className="text-sm">{request.resolvedByEmail}</span>
              </div>
            )}
          </div>
        </div>

        {!isResolved && (
          <DialogFooter>
            <Button
              variant="outline"
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
              onClick={() => onReject(request.id)}
              disabled={loading}
            >
              Reject
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => onApprove(request.id)}
              disabled={loading}
            >
              Approve
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
