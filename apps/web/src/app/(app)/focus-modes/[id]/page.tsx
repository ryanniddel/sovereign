'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  useFocusMode, useUpdateFocusMode, useDeleteFocusMode,
  useActivateFocusMode, useDeactivateFocusMode,
  useRequestOverride, useModeSessions,
} from '@/hooks/use-focus-modes';
import { FocusModeForm } from '@/components/focus-modes/focus-mode-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FOCUS_MODE_DEACTIVATION_REASON_LABELS } from '@/lib/constants';
import type { FocusModeDeactivationReason, FocusModeSession } from '@sovereign/shared';
import { format } from 'date-fns';
import { Shield, ShieldOff, ShieldAlert, Clock } from 'lucide-react';

export default function FocusModeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: mode, isLoading } = useFocusMode(id);
  const update = useUpdateFocusMode();
  const deleteMode = useDeleteFocusMode();
  const activate = useActivateFocusMode();
  const deactivate = useDeactivateFocusMode();
  const requestOverride = useRequestOverride();
  const [sessionPage] = useState(1);
  const { data: sessionsData } = useModeSessions(id, { page: sessionPage, pageSize: 5 });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideEmail, setOverrideEmail] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  if (isLoading) return <PageSkeleton />;
  if (!mode) return <p>Not found</p>;

  const sessions = sessionsData?.data || [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {mode.isActive ? <Shield className="h-5 w-5 text-emerald-500" /> : <ShieldOff className="h-5 w-5 text-muted-foreground" />}
          <h1 className="text-2xl font-bold">Edit Focus Mode</h1>
          <Badge variant={mode.isActive ? 'default' : 'secondary'}>
            {mode.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex gap-2">
          {mode.isActive ? (
            <>
              <Button size="sm" variant="outline" onClick={() => deactivate.mutate(id)}>Deactivate</Button>
              {mode.requires2faOverride && (
                <Button size="sm" variant="outline" onClick={() => setOverrideOpen(true)}>
                  <ShieldAlert className="mr-1 h-3 w-3" />Request Override
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" onClick={() => activate.mutate(id)}>Activate</Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
        </div>
      </div>

      <FocusModeForm
        defaultValues={mode as never}
        loading={update.isPending}
        onSubmit={(data) => {
          update.mutate({ id, ...data } as never, { onSuccess: () => router.push('/focus-modes') });
        }}
      />

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />Recent Sessions</CardTitle>
            <Button size="sm" variant="ghost" asChild><a href="/focus-modes/sessions">View All</a></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.map((session: FocusModeSession) => (
              <div key={session.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div>
                  <span>{format(new Date(session.activatedAt), 'MMM d, h:mm a')}</span>
                  {session.deactivatedAt && (
                    <span className="text-muted-foreground"> — {format(new Date(session.deactivatedAt), 'h:mm a')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {session.durationMinutes != null && (
                    <span className="text-xs text-muted-foreground">{session.durationMinutes}m</span>
                  )}
                  {session.deactivationReason && (
                    <Badge variant="outline" className="text-xs">
                      {FOCUS_MODE_DEACTIVATION_REASON_LABELS[session.deactivationReason as FocusModeDeactivationReason] || session.deactivationReason}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Focus Mode" description="This cannot be undone." variant="destructive" confirmLabel="Delete" onConfirm={() => { deleteMode.mutate(id); router.push('/focus-modes'); }} />

      {/* Override Request Dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request 2FA Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Requester Email</Label>
              <Input value={overrideEmail} onChange={(e) => setOverrideEmail(e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Why do you need to override this focus mode?" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button
              disabled={requestOverride.isPending || !overrideEmail || !overrideReason}
              onClick={() => {
                requestOverride.mutate(
                  { id, requesterEmail: overrideEmail, reason: overrideReason },
                  { onSuccess: () => { setOverrideOpen(false); setOverrideEmail(''); setOverrideReason(''); } },
                );
              }}
            >
              {requestOverride.isPending ? 'Sending...' : 'Send Override Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
