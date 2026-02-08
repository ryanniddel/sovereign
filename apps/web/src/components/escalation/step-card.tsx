'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Phone, Hash } from 'lucide-react';
import { ESCALATION_CHANNEL_LABELS, ESCALATION_TONE_LABELS } from '@/lib/constants';
import type { EscalationStep, EscalationChannel, EscalationTone } from '@sovereign/shared';

interface StepCardProps {
  step: EscalationStep;
  index: number;
}

const channelIcons: Record<string, React.ElementType> = {
  IN_APP: Bell,
  EMAIL: Mail,
  SMS: MessageSquare,
  PHONE_CALL: Phone,
  SLACK: Hash,
};

export function StepCard({ step, index }: StepCardProps) {
  const Icon = channelIcons[step.channel] ?? Bell;

  return (
    <Card className="border bg-card">
      <CardContent className="flex items-center gap-3 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {step.stepOrder ?? index + 1}
        </div>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <Badge variant="outline">
            {ESCALATION_CHANNEL_LABELS[step.channel as EscalationChannel] ?? step.channel}
          </Badge>
          <Badge variant="secondary">
            {ESCALATION_TONE_LABELS[step.tone as EscalationTone] ?? step.tone}
          </Badge>
          <span className="text-xs text-muted-foreground">
            after {step.delayMinutes} min
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
