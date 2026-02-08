'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEscalationRule, useUpdateEscalationRule, useDeleteEscalationRule } from '@/hooks/use-escalation';
import { RuleForm } from '@/components/escalation/rule-form';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useState } from 'react';

export default function EscalationRuleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: rule, isLoading } = useEscalationRule(id);
  const update = useUpdateEscalationRule();
  const deleteRule = useDeleteEscalationRule();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!rule) return <p>Not found</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Escalation Rule</h1>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
      </div>

      <RuleForm
        defaultValues={{
          ...rule,
          steps: rule.steps?.map((s, i) => ({ ...s, id: `step-${i}` })) || [],
        } as never}
        loading={update.isPending}
        onSubmit={(data) => {
          update.mutate(
            {
              id,
              name: data.name,
              description: data.description,
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

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Rule" description="This cannot be undone." variant="destructive" confirmLabel="Delete" onConfirm={() => { deleteRule.mutate(id); router.push('/escalation'); }} />
    </div>
  );
}
