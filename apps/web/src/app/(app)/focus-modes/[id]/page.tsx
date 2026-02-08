'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFocusMode, useUpdateFocusMode, useDeleteFocusMode } from '@/hooks/use-focus-modes';
import { FocusModeForm } from '@/components/focus-modes/focus-mode-form';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useState } from 'react';

export default function FocusModeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: mode, isLoading } = useFocusMode(id);
  const update = useUpdateFocusMode();
  const deleteMode = useDeleteFocusMode();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!mode) return <p>Not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Focus Mode</h1>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
      </div>

      <FocusModeForm
        defaultValues={mode as never}
        loading={update.isPending}
        onSubmit={(data) => {
          update.mutate({ id, ...data } as never, { onSuccess: () => router.push('/focus-modes') });
        }}
      />

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Focus Mode" description="This cannot be undone." variant="destructive" confirmLabel="Delete" onConfirm={() => { deleteMode.mutate(id); router.push('/focus-modes'); }} />
    </div>
  );
}
