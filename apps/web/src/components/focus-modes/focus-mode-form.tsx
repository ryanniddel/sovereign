'use client';

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
import { FOCUS_MODE_TRIGGER_LABELS, CALENDAR_EVENT_TYPE_LABELS } from '@/lib/constants';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  triggerType: z.string().optional(),
  triggerCalendarEventType: z.string().optional(),
  allowCriticalOnly: z.boolean().optional(),
  allowMeetingPrep: z.boolean().optional(),
  requires2faOverride: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FocusModeFormProps {
  onSubmit: (data: FormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
}

export function FocusModeForm({ onSubmit, loading, defaultValues }: FocusModeFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { allowCriticalOnly: true, requires2faOverride: false, ...defaultValues },
  });

  return (
    <Card>
      <CardHeader><CardTitle>Focus Mode</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            <Label>Trigger</Label>
            <Select onValueChange={(v) => setValue('triggerType', v)} defaultValue={defaultValues?.triggerType}>
              <SelectTrigger><SelectValue placeholder="Select trigger" /></SelectTrigger>
              <SelectContent>
                {Object.entries(FOCUS_MODE_TRIGGER_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {watch('triggerType') === 'CALENDAR_EVENT' && (
            <div className="space-y-2">
              <Label>Calendar Event Type</Label>
              <Select onValueChange={(v) => setValue('triggerCalendarEventType', v)}>
                <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CALENDAR_EVENT_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={watch('allowCriticalOnly')} onCheckedChange={(v) => setValue('allowCriticalOnly', v)} />
              <Label>Allow critical notifications only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={watch('allowMeetingPrep')} onCheckedChange={(v) => setValue('allowMeetingPrep', v)} />
              <Label>Allow meeting prep notifications</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={watch('requires2faOverride')} onCheckedChange={(v) => setValue('requires2faOverride', v)} />
              <Label>Require 2FA to override</Label>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
