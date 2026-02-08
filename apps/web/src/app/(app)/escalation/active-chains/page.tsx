'use client';

import {
  useActiveEscalationChains,
  usePauseEscalation,
  useResumeEscalation,
  useCancelEscalation,
} from '@/hooks/use-escalation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Progress } from '@/components/ui/progress';
import { ESCALATION_STATUS_LABELS, ESCALATION_TARGET_TYPE_LABELS } from '@/lib/constants';
import type { EscalationStatus, EscalationTargetType, ActiveEscalationChain } from '@sovereign/shared';
import { Link2, Pause, Play, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500',
  SENT: 'bg-blue-500/10 text-blue-500',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500',
  RESPONDED: 'bg-green-500/10 text-green-500',
  CANCELLED: 'bg-gray-500/10 text-gray-500',
  PAUSED: 'bg-orange-500/10 text-orange-500',
};

export default function ActiveChainsPage() {
  const { data: chains, isLoading } = useActiveEscalationChains();
  const pause = usePauseEscalation();
  const resume = useResumeEscalation();
  const cancel = useCancelEscalation();
  const [cancelTarget, setCancelTarget] = useState<ActiveEscalationChain | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Active Escalation Chains</h1>
        <Skeleton className="h-32" /><Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Active Escalation Chains</h1>

      {!chains || chains.length === 0 ? (
        <EmptyState icon={Link2} title="No active chains" description="No escalation chains are currently running" />
      ) : (
        <div className="space-y-3">
          {chains.map((chain) => (
            <Card key={`${chain.targetType}-${chain.targetId}`}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{chain.targetTitle}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{ESCALATION_TARGET_TYPE_LABELS[chain.targetType as EscalationTargetType] || chain.targetType}</span>
                      <span>·</span>
                      <span>{chain.ruleName}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Last escalated: {format(new Date(chain.lastEscalatedAt), 'PPp')}</span>
                      {chain.nextStepAt && (
                        <span>Next step: {format(new Date(chain.nextStepAt), 'PPp')}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={STATUS_COLORS[chain.status] || ''}>
                      {ESCALATION_STATUS_LABELS[chain.status as EscalationStatus] || chain.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Step {chain.currentStep} of {chain.totalSteps}</span>
                    <span>{Math.round((chain.currentStep / chain.totalSteps) * 100)}%</span>
                  </div>
                  <Progress value={(chain.currentStep / chain.totalSteps) * 100} />
                </div>

                <div className="mt-3 flex gap-2">
                  {chain.status === 'PAUSED' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resume.isPending}
                      onClick={() => resume.mutate({ targetId: chain.targetId, targetType: chain.targetType })}
                    >
                      <Play className="mr-1 h-3 w-3" />Resume
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pause.isPending}
                      onClick={() => pause.mutate({ targetId: chain.targetId, targetType: chain.targetType })}
                    >
                      <Pause className="mr-1 h-3 w-3" />Pause
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setCancelTarget(chain)}
                  >
                    <XCircle className="mr-1 h-3 w-3" />Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => { if (!open) setCancelTarget(null); }}
        title="Cancel Escalation"
        description={cancelTarget ? `Cancel the escalation chain for "${cancelTarget.targetTitle}"? This cannot be undone.` : ''}
        variant="destructive"
        confirmLabel="Cancel Escalation"
        onConfirm={() => {
          if (cancelTarget) {
            cancel.mutate(
              { targetId: cancelTarget.targetId, targetType: cancelTarget.targetType },
              { onSuccess: () => setCancelTarget(null) },
            );
          }
        }}
      />
    </div>
  );
}
