'use client';

import { useRouter } from 'next/navigation';
import { ItemForm } from '@/components/accountability/item-form';
import { useCreateActionItem } from '@/hooks/use-action-items';
import { OwnerType } from '@sovereign/shared';
import type { Priority } from '@sovereign/shared';

export default function NewActionItemPage() {
  const router = useRouter();
  const create = useCreateActionItem();

  return (
    <div className="mx-auto max-w-2xl">
      <ItemForm
        type="action-item"
        loading={create.isPending}
        onSubmit={(data) => {
          create.mutate(
            {
              title: data.title,
              description: data.description,
              dueDate: new Date(data.dueDate).toISOString(),
              priority: data.priority as Priority | undefined,
              ownerId: 'self',
              ownerType: OwnerType.USER,
            },
            { onSuccess: () => router.push('/accountability/action-items') },
          );
        }}
      />
    </div>
  );
}
