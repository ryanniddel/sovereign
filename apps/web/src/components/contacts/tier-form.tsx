'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  priority: z.coerce.number().min(1, 'Priority must be at least 1'),
  escalationDelayMinutes: z.coerce.number().min(0, 'Must be 0 or more'),
  calendarAccessLevel: z.enum(['full', 'extended', 'standard', 'limited']),
  communicationPriority: z.enum(['critical', 'high', 'normal', 'low']),
});

type TierFormValues = z.infer<typeof schema>;

interface TierFormProps {
  onSubmit: (data: TierFormValues) => void;
  defaultValues?: Partial<TierFormValues>;
  onCancel?: () => void;
  loading?: boolean;
}

export function TierForm({ onSubmit, defaultValues, onCancel, loading }: TierFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TierFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: '',
      priority: 1,
      escalationDelayMinutes: 30,
      calendarAccessLevel: 'standard',
      communicationPriority: 'normal',
      ...defaultValues,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultValues?.name ? 'Edit Tier' : 'New Tier'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Input id="priority" type="number" min={1} {...register('priority')} />
              {errors.priority && <p className="text-xs text-destructive">{errors.priority.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="escalationDelayMinutes">Escalation Delay (min)</Label>
              <Input id="escalationDelayMinutes" type="number" min={0} {...register('escalationDelayMinutes')} />
              {errors.escalationDelayMinutes && (
                <p className="text-xs text-destructive">{errors.escalationDelayMinutes.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Calendar Access</Label>
              <Select
                onValueChange={(val) => setValue('calendarAccessLevel', val as TierFormValues['calendarAccessLevel'])}
                defaultValue={defaultValues?.calendarAccessLevel ?? 'standard'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full</SelectItem>
                  <SelectItem value="extended">Extended</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                </SelectContent>
              </Select>
              {errors.calendarAccessLevel && (
                <p className="text-xs text-destructive">{errors.calendarAccessLevel.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Communication Priority</Label>
              <Select
                onValueChange={(val) => setValue('communicationPriority', val as TierFormValues['communicationPriority'])}
                defaultValue={defaultValues?.communicationPriority ?? 'normal'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              {errors.communicationPriority && (
                <p className="text-xs text-destructive">{errors.communicationPriority.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : defaultValues?.name ? 'Update Tier' : 'Create Tier'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
