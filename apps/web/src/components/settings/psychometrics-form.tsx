'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser, useUpdatePsychometrics } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

type FormValues = {
  discD?: number;
  discI?: number;
  discS?: number;
  discC?: number;
  mbtiType?: string;
  enneagramType?: number | '';
  kolbeProfile?: string;
};

const schema = z.object({
  discD: z.coerce.number().min(0).max(100).optional(),
  discI: z.coerce.number().min(0).max(100).optional(),
  discS: z.coerce.number().min(0).max(100).optional(),
  discC: z.coerce.number().min(0).max(100).optional(),
  mbtiType: z.string().optional(),
  enneagramType: z.coerce.number().min(1).max(9).optional().or(z.literal('')),
  kolbeProfile: z.string().optional(),
});

export function PsychometricsForm() {
  const { data: user, isLoading } = useCurrentUser();
  const update = useUpdatePsychometrics();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
  });

  useEffect(() => {
    if (user?.psychometrics) {
      const p = user.psychometrics as Record<string, unknown>;
      reset({
        discD: (p.disc as Record<string, number>)?.dominance,
        discI: (p.disc as Record<string, number>)?.influence,
        discS: (p.disc as Record<string, number>)?.steadiness,
        discC: (p.disc as Record<string, number>)?.conscientiousness,
        mbtiType: p.mbtiType as string,
        enneagramType: p.enneagramType as number,
        kolbeProfile: p.kolbeProfile as string,
      });
    }
  }, [user, reset]);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader><CardTitle>Psychometrics</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit((data) => update.mutate(data as never))} className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">DISC Profile</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs">D</Label>
                <Input type="number" min={0} max={100} {...register('discD')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">I</Label>
                <Input type="number" min={0} max={100} {...register('discI')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">S</Label>
                <Input type="number" min={0} max={100} {...register('discS')} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">C</Label>
                <Input type="number" min={0} max={100} {...register('discC')} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mbtiType">MBTI Type</Label>
              <Input id="mbtiType" {...register('mbtiType')} placeholder="e.g. ENTJ" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enneagramType">Enneagram</Label>
              <Input id="enneagramType" type="number" min={1} max={9} {...register('enneagramType')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kolbeProfile">Kolbe</Label>
              <Input id="kolbeProfile" {...register('kolbeProfile')} />
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
