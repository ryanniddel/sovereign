'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser, useUpdateBriefingPreferences } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

const schema = z.object({
  morningBriefingTime: z.string().min(1, 'Required'),
  nightlyReviewTime: z.string().min(1, 'Required'),
});

export function BriefingPreferencesForm() {
  const { data: user, isLoading } = useCurrentUser();
  const update = useUpdateBriefingPreferences();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (user) {
      reset({
        morningBriefingTime: (user as unknown as Record<string, unknown>).morningBriefingTime as string || '07:00',
        nightlyReviewTime: (user as unknown as Record<string, unknown>).nightlyReviewTime as string || '21:00',
      });
    }
  }, [user, reset]);

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader><CardTitle>Briefing Preferences</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => update.mutate(data))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="morningBriefingTime">Morning Briefing Time</Label>
              <Input id="morningBriefingTime" type="time" {...register('morningBriefingTime')} />
              {errors.morningBriefingTime && <p className="text-xs text-destructive">{errors.morningBriefingTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nightlyReviewTime">Nightly Review Time</Label>
              <Input id="nightlyReviewTime" type="time" {...register('nightlyReviewTime')} />
              {errors.nightlyReviewTime && <p className="text-xs text-destructive">{errors.nightlyReviewTime.message}</p>}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
