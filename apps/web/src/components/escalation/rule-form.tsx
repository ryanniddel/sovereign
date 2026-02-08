'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { WorkflowBuilder } from './workflow-builder';
import { ESCALATION_TRIGGER_LABELS } from '@/lib/constants';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  triggerType: z.string().min(1, 'Trigger type is required'),
  isActive: z.boolean().optional(),
  maxRetries: z.coerce.number().int().min(1).max(20).optional(),
  cooldownMinutes: z.coerce.number().int().min(0).max(10080).optional(),
  stopOnResponse: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EscalationStep {
  id: string;
  stepOrder: number;
  channel: string;
  delayMinutes: number;
  tone: string;
  messageTemplate: string;
}

interface RuleFormProps {
  onSubmit: (data: FormValues & { steps: EscalationStep[] }) => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues & { steps: EscalationStep[] }>;
}

export function RuleForm({ onSubmit, loading, defaultValues }: RuleFormProps) {
  const [steps, setSteps] = useState<EscalationStep[]>(defaultValues?.steps || []);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { isActive: true, maxRetries: 3, cooldownMinutes: 60, stopOnResponse: true, ...defaultValues },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Escalation Rule</CardTitle></CardHeader>
        <CardContent>
          <form id="rule-form" onSubmit={handleSubmit((data) => onSubmit({ ...data, steps }))} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select onValueChange={(v) => setValue('triggerType', v)} defaultValue={defaultValues?.triggerType}>
                <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESCALATION_TRIGGER_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.triggerType && <p className="text-xs text-destructive">{errors.triggerType.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={watch('isActive')} onCheckedChange={(v) => setValue('isActive', v)} />
              <Label>Active</Label>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Max Retries</Label>
                <Input id="maxRetries" type="number" min={1} max={20} {...register('maxRetries')} />
                {errors.maxRetries && <p className="text-xs text-destructive">{errors.maxRetries.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cooldownMinutes">Cooldown (minutes)</Label>
                <Input id="cooldownMinutes" type="number" min={0} max={10080} {...register('cooldownMinutes')} />
                {errors.cooldownMinutes && <p className="text-xs text-destructive">{errors.cooldownMinutes.message}</p>}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={watch('stopOnResponse')} onCheckedChange={(v) => setValue('stopOnResponse', v)} />
              <Label>Stop on Response</Label>
            </div>
          </form>
        </CardContent>
      </Card>

      <WorkflowBuilder steps={steps} onChange={setSteps} />

      <div className="flex justify-end">
        <Button type="submit" form="rule-form" disabled={loading}>
          {loading ? 'Saving...' : 'Save Rule'}
        </Button>
      </div>
    </div>
  );
}
