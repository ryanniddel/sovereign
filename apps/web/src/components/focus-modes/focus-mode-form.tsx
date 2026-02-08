'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FOCUS_MODE_TRIGGER_LABELS, CALENDAR_EVENT_TYPE_LABELS, FOCUS_MODE_ICON_OPTIONS, FOCUS_MODE_ICON_MAP } from '@/lib/constants';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  triggerType: z.string().optional(),
  triggerCalendarEventType: z.string().optional(),
  scheduleStartTime: z.string().optional(),
  scheduleEndTime: z.string().optional(),
  scheduleDays: z.array(z.number()).optional(),
  autoDeactivateMinutes: z.coerce.number().min(5).max(1440).optional().or(z.literal('')),
  allowCriticalOnly: z.boolean().optional(),
  allowMeetingPrep: z.boolean().optional(),
  allowAll: z.boolean().optional(),
  requires2faOverride: z.boolean().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface FocusModeFormProps {
  onSubmit: (data: FormValues) => void;
  loading?: boolean;
  defaultValues?: Partial<FormValues>;
}

export function FocusModeForm({ onSubmit, loading, defaultValues }: FocusModeFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      allowCriticalOnly: true,
      requires2faOverride: false,
      scheduleDays: [],
      ...defaultValues,
    },
  });

  const triggerType = watch('triggerType');
  const scheduleDays = watch('scheduleDays') || [];

  const toggleDay = (day: number) => {
    const current = scheduleDays;
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setValue('scheduleDays', updated);
  };

  const handleFormSubmit = (data: FormValues) => {
    const cleaned = { ...data };
    if (cleaned.autoDeactivateMinutes === '' || cleaned.autoDeactivateMinutes === undefined) {
      delete (cleaned as Record<string, unknown>).autoDeactivateMinutes;
    }
    onSubmit(cleaned);
  };

  return (
    <Card>
      <CardHeader><CardTitle>Focus Mode</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Select onValueChange={(v) => setValue('icon', v)} defaultValue={defaultValues?.icon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select icon">
                    {watch('icon') && (() => {
                      const IconComp = FOCUS_MODE_ICON_MAP[watch('icon') || ''];
                      const label = FOCUS_MODE_ICON_OPTIONS.find((o) => o.value === watch('icon'))?.label;
                      return IconComp ? <span className="flex items-center gap-2"><IconComp className="h-4 w-4" />{label}</span> : null;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FOCUS_MODE_ICON_OPTIONS.map(({ value, label }) => {
                    const IconComp = FOCUS_MODE_ICON_MAP[value];
                    return (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">{IconComp && <IconComp className="h-4 w-4" />}{label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" type="color" className="h-10 w-full" {...register('color')} />
            </div>
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

          {triggerType === 'CALENDAR_EVENT' && (
            <div className="space-y-2">
              <Label>Calendar Event Type</Label>
              <Select onValueChange={(v) => setValue('triggerCalendarEventType', v)} defaultValue={defaultValues?.triggerCalendarEventType}>
                <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CALENDAR_EVENT_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {triggerType === 'SCHEDULED' && (
            <div className="space-y-3 rounded-md border p-3">
              <Label className="text-sm font-medium">Schedule</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduleStartTime" className="text-xs text-muted-foreground">Start Time</Label>
                  <Input id="scheduleStartTime" type="time" {...register('scheduleStartTime')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduleEndTime" className="text-xs text-muted-foreground">End Time</Label>
                  <Input id="scheduleEndTime" type="time" {...register('scheduleEndTime')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Active Days</Label>
                <div className="flex gap-2">
                  {DAYS.map((day, i) => (
                    <label key={day} className="flex flex-col items-center gap-1">
                      <Checkbox
                        checked={scheduleDays.includes(i)}
                        onCheckedChange={() => toggleDay(i)}
                      />
                      <span className="text-xs">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="autoDeactivateMinutes">Auto-deactivate after (minutes)</Label>
            <Input id="autoDeactivateMinutes" type="number" min={5} max={1440} placeholder="Leave empty for no limit" {...register('autoDeactivateMinutes')} />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Notification Filtering</Label>
            <div className="flex items-center gap-2">
              <Switch checked={watch('allowAll')} onCheckedChange={(v) => { setValue('allowAll', v); if (v) { setValue('allowCriticalOnly', false); setValue('allowMeetingPrep', false); } }} />
              <Label>Allow all notifications</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={watch('allowCriticalOnly')} onCheckedChange={(v) => { setValue('allowCriticalOnly', v); if (v) setValue('allowAll', false); }} disabled={watch('allowAll')} />
              <Label>Allow critical notifications only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={watch('allowMeetingPrep')} onCheckedChange={(v) => { setValue('allowMeetingPrep', v); if (v) setValue('allowAll', false); }} disabled={watch('allowAll')} />
              <Label>Allow meeting prep notifications</Label>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border p-3">
            <Switch checked={watch('requires2faOverride')} onCheckedChange={(v) => setValue('requires2faOverride', v)} />
            <div>
              <Label>Require 2FA to override (Ulysses Contract)</Label>
              <p className="text-xs text-muted-foreground">When enabled, overriding this focus mode requires a 6-digit confirmation code</p>
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
