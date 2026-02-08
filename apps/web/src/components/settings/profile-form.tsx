'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrentUser, useUpdateProfile } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

type FormValues = {
  name: string;
  timezone: string;
  avatarUrl?: string;
  defaultHourlyRate?: number;
};

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  defaultHourlyRate: z.coerce.number().min(0).optional(),
});

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Zurich',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export function ProfileForm() {
  const { data: user, isLoading } = useCurrentUser();
  const update = useUpdateProfile();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        timezone: user.timezone || 'America/New_York',
        avatarUrl: user.avatarUrl || '',
        defaultHourlyRate: user.defaultHourlyRate || 0,
      });
    }
  }, [user, reset]);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your personal information and display preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-4">
          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Managed by your identity provider</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={watch('timezone')} onValueChange={(val) => setValue('timezone', val)}>
              <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.timezone && <p className="text-xs text-destructive">{errors.timezone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input id="avatarUrl" {...register('avatarUrl')} placeholder="https://example.com/avatar.jpg" />
            {errors.avatarUrl && <p className="text-xs text-destructive">{errors.avatarUrl.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultHourlyRate">Default Hourly Rate ($)</Label>
            <Input id="defaultHourlyRate" type="number" step="0.01" {...register('defaultHourlyRate')} />
            <p className="text-xs text-muted-foreground">Used to calculate meeting costs</p>
            {errors.defaultHourlyRate && <p className="text-xs text-destructive">{errors.defaultHourlyRate.message}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
