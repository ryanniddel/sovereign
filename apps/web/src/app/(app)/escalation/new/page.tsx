'use client';

import { useRouter } from 'next/navigation';
import { RuleForm } from '@/components/escalation/rule-form';
import { useCreateEscalationRule } from '@/hooks/use-escalation';

export default function NewEscalationRulePage() {
  const router = useRouter();
  const create = useCreateEscalationRule();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Create Escalation Rule</h1>
      <RuleForm
        loading={create.isPending}
        onSubmit={(data) => {
          create.mutate(
            {
              name: data.name,
              description: data.description,
              triggerType: data.triggerType as never,
              isActive: data.isActive,
              steps: data.steps.map((s) => ({
                stepOrder: s.stepOrder,
                channel: s.channel,
                delayMinutes: s.delayMinutes,
                tone: s.tone,
                messageTemplate: s.messageTemplate || undefined,
              })),
            },
            { onSuccess: () => router.push('/escalation') },
          );
        }}
      />
    </div>
  );
}
