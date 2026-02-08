'use client';

import { useRouter } from 'next/navigation';
import { ItemForm } from '@/components/accountability/item-form';
import { useCreateCommitment } from '@/hooks/use-commitments';
import { OwnerType } from '@sovereign/shared';

export default function NewCommitmentPage() {
  const router = useRouter();
  const create = useCreateCommitment();

  return (
    <div className="mx-auto max-w-2xl">
      <ItemForm
        type="commitment"
        loading={create.isPending}
        onSubmit={(data) => {
          create.mutate(
            {
              title: data.title,
              description: data.description,
              dueDate: new Date(data.dueDate).toISOString(),
              priority: data.priority as never,
              ownerId: 'self',
              ownerType: OwnerType.USER,
              affectsScore: true,
            },
            { onSuccess: () => router.push('/accountability/commitments') },
          );
        }}
      />
    </div>
  );
}
