'use client';

import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Phone, Hash, ArrowDown } from 'lucide-react';
import { ESCALATION_CHANNEL_LABELS, ESCALATION_TONE_LABELS } from '@/lib/constants';
import type { EscalationStep, EscalationChannel, EscalationTone } from '@sovereign/shared';

interface WorkflowPreviewProps {
  steps: EscalationStep[];
}

const channelIcons: Record<string, React.ElementType> = {
  IN_APP: Bell,
  EMAIL: Mail,
  SMS: MessageSquare,
  PHONE_CALL: Phone,
  SLACK: Hash,
};

export function WorkflowPreview({ steps }: WorkflowPreviewProps) {
  const sorted = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  if (sorted.length === 0) {
    return (
      <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
        No steps to preview.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {sorted.map((step, idx) => {
        const Icon = channelIcons[step.channel] ?? Bell;

        return (
          <div key={`${step.stepOrder}-${idx}`}>
            {/* Delay arrow between steps */}
            {idx > 0 && (
              <div className="flex items-center gap-2 py-2 pl-5">
                <div className="flex flex-col items-center">
                  <div className="h-4 w-px bg-border" />
                  <ArrowDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">
                  wait {step.delayMinutes} min
                </span>
              </div>
            )}

            {/* Step node */}
            <div className="flex items-start gap-3">
              <div className="relative flex flex-col items-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                {idx < sorted.length - 1 && (
                  <div className="h-full w-px bg-border" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Step {step.stepOrder}</span>
                  <Badge variant="outline">
                    {ESCALATION_CHANNEL_LABELS[step.channel as EscalationChannel] ?? step.channel}
                  </Badge>
                  <Badge variant="secondary">
                    {ESCALATION_TONE_LABELS[step.tone as EscalationTone] ?? step.tone}
                  </Badge>
                </div>
                {step.messageTemplate && (
                  <p className="mt-1 text-xs text-muted-foreground">{step.messageTemplate}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
