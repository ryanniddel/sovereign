'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser, useUpdateWorkingHours } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

const schema = z.object({
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
});

type FormValues = z.infer<typeof schema>;

export function WorkingHoursForm() {
  const { data: user, isLoading } = useCurrentUser();
  const update = useUpdateWorkingHours();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({
        workingHoursStart: user.workingHoursStart || '09:00',
        workingHoursEnd: user.workingHoursEnd || '17:00',
      });
    }
  }, [user, reset]);

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Working Hours</CardTitle>
        <CardDescription>Define your standard working hours. Used for scheduling, focus modes, and escalation timing.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workingHoursStart">Start Time</Label>
              <Input id="workingHoursStart" type="time" {...register('workingHoursStart')} />
              {errors.workingHoursStart && <p className="text-xs text-destructive">{errors.workingHoursStart.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHoursEnd">End Time</Label>
              <Input id="workingHoursEnd" type="time" {...register('workingHoursEnd')} />
              {errors.workingHoursEnd && <p className="text-xs text-destructive">{errors.workingHoursEnd.message}</p>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Notifications and escalations outside these hours will be deferred unless flagged as critical.
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
