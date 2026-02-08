'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ESCALATION_CHANNEL_LABELS, ESCALATION_TONE_LABELS } from '@/lib/constants';
import type { EscalationStep } from '@sovereign/shared';

const schema = z.object({
  stepOrder: z.coerce.number().min(1, 'Step order is required'),
  channel: z.string().min(1, 'Channel is required'),
  delayMinutes: z.coerce.number().min(0, 'Delay must be 0 or more'),
  tone: z.string().min(1, 'Tone is required'),
  messageTemplate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface StepFormProps {
  onSubmit: (data: EscalationStep) => void;
  defaultValues?: Partial<EscalationStep>;
  onCancel: () => void;
  loading?: boolean;
}

export function StepForm({ onSubmit, defaultValues, onCancel, loading }: StepFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      stepOrder: defaultValues?.stepOrder ?? 1,
      channel: defaultValues?.channel ?? '',
      delayMinutes: defaultValues?.delayMinutes ?? 30,
      tone: defaultValues?.tone ?? '',
      messageTemplate: defaultValues?.messageTemplate ?? '',
    },
  });

  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data as EscalationStep);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stepOrder">Step Order</Label>
          <Input id="stepOrder" type="number" min={1} {...register('stepOrder')} />
          {errors.stepOrder && <p className="text-xs text-destructive">{errors.stepOrder.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="delayMinutes">Delay (minutes)</Label>
          <Input id="delayMinutes" type="number" min={0} {...register('delayMinutes')} />
          {errors.delayMinutes && <p className="text-xs text-destructive">{errors.delayMinutes.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Channel</Label>
        <Select value={watch('channel')} onValueChange={(v) => setValue('channel', v)}>
          <SelectTrigger><SelectValue placeholder="Select channel" /></SelectTrigger>
          <SelectContent>
            {Object.entries(ESCALATION_CHANNEL_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.channel && <p className="text-xs text-destructive">{errors.channel.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Tone</Label>
        <Select value={watch('tone')} onValueChange={(v) => setValue('tone', v)}>
          <SelectTrigger><SelectValue placeholder="Select tone" /></SelectTrigger>
          <SelectContent>
            {Object.entries(ESCALATION_TONE_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.tone && <p className="text-xs text-destructive">{errors.tone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="messageTemplate">Message Template (optional)</Label>
        <Textarea id="messageTemplate" {...register('messageTemplate')} placeholder="Custom message template..." />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Step'}
        </Button>
      </div>
    </form>
  );
}
