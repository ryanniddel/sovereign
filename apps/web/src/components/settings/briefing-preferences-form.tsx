'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useBriefingPreferences, useUpdateBriefingPreferences } from '@/hooks/use-briefings';
import { briefingPreferencesSchema, type BriefingPreferencesValues } from '@/lib/validations/briefing-preferences';
import { useEffect } from 'react';

export function BriefingPreferencesForm() {
  const { data: prefs, isLoading } = useBriefingPreferences();
  const update = useUpdateBriefingPreferences();
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<BriefingPreferencesValues>({
    resolver: zodResolver(briefingPreferencesSchema) as never,
    defaultValues: {
      morningTime: '07:00',
      nightlyTime: '21:00',
      morningChannel: 'IN_APP',
      nightlyChannel: 'IN_APP',
      includeMeetingCosts: true,
      includeActionItems: true,
      includeStreaks: true,
      includeReflectionPrompt: true,
      maxScheduleItems: 10,
      maxOverdueItems: 10,
      morningEnabled: true,
      nightlyEnabled: true,
    },
  });

  useEffect(() => {
    if (prefs) {
      reset({
        morningTime: prefs.morningTime || '07:00',
        nightlyTime: prefs.nightlyTime || '21:00',
        morningChannel: prefs.morningChannel || 'IN_APP',
        nightlyChannel: prefs.nightlyChannel || 'IN_APP',
        includeMeetingCosts: prefs.includeMeetingCosts ?? true,
        includeActionItems: prefs.includeActionItems ?? true,
        includeStreaks: prefs.includeStreaks ?? true,
        includeReflectionPrompt: prefs.includeReflectionPrompt ?? true,
        maxScheduleItems: prefs.maxScheduleItems ?? 10,
        maxOverdueItems: prefs.maxOverdueItems ?? 10,
        morningEnabled: prefs.morningEnabled ?? true,
        nightlyEnabled: prefs.nightlyEnabled ?? true,
      });
    }
  }, [prefs, reset]);

  if (isLoading) return <Skeleton className="h-96" />;

  const morningEnabled = watch('morningEnabled');
  const nightlyEnabled = watch('nightlyEnabled');

  return (
    <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-6">
      {/* Morning Briefing Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Morning Briefing</CardTitle>
          <Switch
            checked={morningEnabled}
            onCheckedChange={(checked) => setValue('morningEnabled', checked)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="morningTime">Delivery Time</Label>
              <Input id="morningTime" type="time" {...register('morningTime')} disabled={!morningEnabled} />
              {errors.morningTime && <p className="text-xs text-destructive">{errors.morningTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Delivery Channel</Label>
              <Select
                value={watch('morningChannel')}
                onValueChange={(val) => setValue('morningChannel', val)}
                disabled={!morningEnabled}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-App</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nightly Review Settings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nightly Review</CardTitle>
          <Switch
            checked={nightlyEnabled}
            onCheckedChange={(checked) => setValue('nightlyEnabled', checked)}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nightlyTime">Delivery Time</Label>
              <Input id="nightlyTime" type="time" {...register('nightlyTime')} disabled={!nightlyEnabled} />
              {errors.nightlyTime && <p className="text-xs text-destructive">{errors.nightlyTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Delivery Channel</Label>
              <Select
                value={watch('nightlyChannel')}
                onValueChange={(val) => setValue('nightlyChannel', val)}
                disabled={!nightlyEnabled}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN_APP">In-App</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader><CardTitle>Content Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Include Meeting Costs</Label>
              <Switch checked={watch('includeMeetingCosts')} onCheckedChange={(v) => setValue('includeMeetingCosts', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Include Action Items</Label>
              <Switch checked={watch('includeActionItems')} onCheckedChange={(v) => setValue('includeActionItems', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Include Streaks</Label>
              <Switch checked={watch('includeStreaks')} onCheckedChange={(v) => setValue('includeStreaks', v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Include Reflection Prompt</Label>
              <Switch checked={watch('includeReflectionPrompt')} onCheckedChange={(v) => setValue('includeReflectionPrompt', v)} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxScheduleItems">Max Schedule Items</Label>
              <Input id="maxScheduleItems" type="number" min={1} max={50} {...register('maxScheduleItems')} />
              {errors.maxScheduleItems && <p className="text-xs text-destructive">{errors.maxScheduleItems.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxOverdueItems">Max Overdue Items</Label>
              <Input id="maxOverdueItems" type="number" min={1} max={50} {...register('maxOverdueItems')} />
              {errors.maxOverdueItems && <p className="text-xs text-destructive">{errors.maxOverdueItems.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>
          {update.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </form>
  );
}
