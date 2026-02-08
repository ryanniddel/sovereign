'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEscalationRule, useUpdateEscalationRule, useDeleteEscalationRule } from '@/hooks/use-escalation';
import { RuleForm } from '@/components/escalation/rule-form';
import { WorkflowPreview } from '@/components/escalation/workflow-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ESCALATION_TRIGGER_LABELS } from '@/lib/constants';
import type { EscalationTrigger } from '@sovereign/shared';
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

      {/* Rule Summary */}
      <Card>
        <CardContent className="flex items-center gap-4 py-3">
          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
            {rule.isActive ? 'Active' : 'Inactive'}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Trigger: {ESCALATION_TRIGGER_LABELS[rule.triggerType as EscalationTrigger] || rule.triggerType}
          </span>
          <span className="text-sm text-muted-foreground">
            {rule.steps?.length || 0} steps · Max {rule.maxRetries} retries · {rule.cooldownMinutes}m cooldown
          </span>
          {rule.stopOnResponse && (
            <Badge variant="outline" className="text-xs">Stops on response</Badge>
          )}
        </CardContent>
      </Card>

      {/* Visual Workflow Preview */}
      {rule.steps && rule.steps.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Workflow Preview</CardTitle></CardHeader>
          <CardContent>
            <WorkflowPreview steps={rule.steps} />
          </CardContent>
        </Card>
      )}

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
              triggerType: data.triggerType,
              isActive: data.isActive,
              maxRetries: data.maxRetries,
              cooldownMinutes: data.cooldownMinutes,
              stopOnResponse: data.stopOnResponse,
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
