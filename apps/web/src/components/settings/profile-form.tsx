'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser, useUpdateProfile } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

type FormValues = {
  name: string;
  timezone?: string;
  avatarUrl?: string;
  defaultHourlyRate?: number;
};

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  timezone: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  defaultHourlyRate: z.coerce.number().min(0).optional(),
});

export function ProfileForm() {
  const { data: user, isLoading } = useCurrentUser();
  const update = useUpdateProfile();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        timezone: user.timezone || '',
        avatarUrl: user.avatarUrl || '',
        defaultHourlyRate: user.defaultHourlyRate || 0,
      });
    }
  }, [user, reset]);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" {...register('timezone')} placeholder="America/New_York" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input id="avatarUrl" {...register('avatarUrl')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultHourlyRate">Default Hourly Rate ($)</Label>
            <Input id="defaultHourlyRate" type="number" step="0.01" {...register('defaultHourlyRate')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
