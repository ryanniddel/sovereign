'use client';

import { useRouter } from 'next/navigation';
import { ContactForm } from '@/components/contacts/contact-form';
import { useCreateContact } from '@/hooks/use-contacts';

export default function NewContactPage() {
  const router = useRouter();
  const create = useCreateContact();

  return (
    <div className="mx-auto max-w-2xl">
      <ContactForm
        loading={create.isPending}
        onSubmit={(data) => {
          create.mutate(data, { onSuccess: () => router.push('/contacts') });
        }}
      />
    </div>
  );
}
