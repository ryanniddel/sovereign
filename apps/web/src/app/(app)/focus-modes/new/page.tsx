'use client';

import { useRouter } from 'next/navigation';
import { FocusModeForm } from '@/components/focus-modes/focus-mode-form';
import { useCreateFocusMode } from '@/hooks/use-focus-modes';

export default function NewFocusModePage() {
  const router = useRouter();
  const create = useCreateFocusMode();

  return (
    <div className="mx-auto max-w-2xl">
      <FocusModeForm
        loading={create.isPending}
        onSubmit={(data) => {
          create.mutate(data as never, { onSuccess: () => router.push('/focus-modes') });
        }}
      />
    </div>
  );
}
