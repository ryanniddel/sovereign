'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCurrentUser, useUpdatePsychometrics } from '@/hooks/use-users';
import { Skeleton } from '@/components/ui/skeleton';
import { psychometricsSchema, type PsychometricsValues } from '@/lib/validations/psychometrics';
import { useEffect } from 'react';

export function PsychometricsForm() {
  const { data: user, isLoading } = useCurrentUser();
  const update = useUpdatePsychometrics();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PsychometricsValues>({
    resolver: zodResolver(psychometricsSchema) as never,
  });

  useEffect(() => {
    if (user?.psychometrics) {
      const p = user.psychometrics as Record<string, unknown>;
      const disc = p.disc as Record<string, number> | undefined;
      const bigFive = p.bigFive as Record<string, number> | undefined;
      reset({
        discD: disc?.dominance,
        discI: disc?.influence,
        discS: disc?.steadiness,
        discC: disc?.conscientiousness,
        mbtiType: p.mbtiType as string,
        enneagramType: p.enneagramType as number,
        kolbeProfile: (p.kolbe || p.kolbeProfile) as string,
        bigFiveOpenness: bigFive?.openness,
        bigFiveConscientiousness: bigFive?.conscientiousness,
        bigFiveExtraversion: bigFive?.extraversion,
        bigFiveAgreeableness: bigFive?.agreeableness,
        bigFiveNeuroticism: bigFive?.neuroticism,
      });
    }
  }, [user, reset]);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <form onSubmit={handleSubmit((data) => update.mutate(data as never))} className="space-y-6">
      {/* DISC Profile */}
      <Card>
        <CardHeader>
          <CardTitle>DISC Profile</CardTitle>
          <CardDescription>Your DISC behavioral assessment scores (0-100). Used to tailor communication style in escalations and briefings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium">D (Dominance)</Label>
              <Input type="number" min={0} max={100} {...register('discD')} placeholder="0-100" />
              {errors.discD && <p className="text-xs text-destructive">{errors.discD.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">I (Influence)</Label>
              <Input type="number" min={0} max={100} {...register('discI')} placeholder="0-100" />
              {errors.discI && <p className="text-xs text-destructive">{errors.discI.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">S (Steadiness)</Label>
              <Input type="number" min={0} max={100} {...register('discS')} placeholder="0-100" />
              {errors.discS && <p className="text-xs text-destructive">{errors.discS.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">C (Conscientiousness)</Label>
              <Input type="number" min={0} max={100} {...register('discC')} placeholder="0-100" />
              {errors.discC && <p className="text-xs text-destructive">{errors.discC.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Other Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>Other Assessments</CardTitle>
          <CardDescription>Additional personality and cognitive profiles.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mbtiType">MBTI Type</Label>
              <Input id="mbtiType" {...register('mbtiType')} placeholder="e.g. ENTJ" />
              {errors.mbtiType && <p className="text-xs text-destructive">{errors.mbtiType.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="enneagramType">Enneagram Type</Label>
              <Input id="enneagramType" type="number" min={1} max={9} {...register('enneagramType')} placeholder="1-9" />
              {errors.enneagramType && <p className="text-xs text-destructive">{errors.enneagramType.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="kolbeProfile">Kolbe Profile</Label>
              <Input id="kolbeProfile" {...register('kolbeProfile')} placeholder="e.g. 8-3-6-2" />
              {errors.kolbeProfile && <p className="text-xs text-destructive">{errors.kolbeProfile.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Big Five */}
      <Card>
        <CardHeader>
          <CardTitle>Big Five Personality Traits</CardTitle>
          <CardDescription>OCEAN model scores (0-100). Used to personalize interaction style and briefing tone.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Openness</Label>
              <Input type="number" min={0} max={100} {...register('bigFiveOpenness')} placeholder="0-100" />
              {errors.bigFiveOpenness && <p className="text-xs text-destructive">{errors.bigFiveOpenness.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Conscientiousness</Label>
              <Input type="number" min={0} max={100} {...register('bigFiveConscientiousness')} placeholder="0-100" />
              {errors.bigFiveConscientiousness && <p className="text-xs text-destructive">{errors.bigFiveConscientiousness.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Extraversion</Label>
              <Input type="number" min={0} max={100} {...register('bigFiveExtraversion')} placeholder="0-100" />
              {errors.bigFiveExtraversion && <p className="text-xs text-destructive">{errors.bigFiveExtraversion.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Agreeableness</Label>
              <Input type="number" min={0} max={100} {...register('bigFiveAgreeableness')} placeholder="0-100" />
              {errors.bigFiveAgreeableness && <p className="text-xs text-destructive">{errors.bigFiveAgreeableness.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Neuroticism</Label>
              <Input type="number" min={0} max={100} {...register('bigFiveNeuroticism')} placeholder="0-100" />
              {errors.bigFiveNeuroticism && <p className="text-xs text-destructive">{errors.bigFiveNeuroticism.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Saving...' : 'Save Psychometrics'}</Button>
      </div>
    </form>
  );
}
