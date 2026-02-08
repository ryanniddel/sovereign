'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DISCProfile } from '@sovereign/shared';

const schema = z.object({
  dominance: z.coerce.number().min(0).max(100),
  influence: z.coerce.number().min(0).max(100),
  steadiness: z.coerce.number().min(0).max(100),
  conscientiousness: z.coerce.number().min(0).max(100),
});

interface DISCProfileFormProps {
  defaultValues?: DISCProfile;
  onSubmit: (data: DISCProfile) => void;
  loading?: boolean;
}

const traits = [
  { key: 'dominance' as const, label: 'D - Dominance', color: 'text-red-600', borderColor: 'border-red-500' },
  { key: 'influence' as const, label: 'I - Influence', color: 'text-yellow-600', borderColor: 'border-yellow-500' },
  { key: 'steadiness' as const, label: 'S - Steadiness', color: 'text-green-600', borderColor: 'border-green-500' },
  { key: 'conscientiousness' as const, label: 'C - Conscientiousness', color: 'text-blue-600', borderColor: 'border-blue-500' },
];

export function DISCProfileForm({ defaultValues, onSubmit, loading }: DISCProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DISCProfile>({
    resolver: zodResolver(schema) as never,
    defaultValues: defaultValues ?? {
      dominance: 50,
      influence: 50,
      steadiness: 50,
      conscientiousness: 50,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Edit DISC Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {traits.map((trait) => (
            <div key={trait.key} className="space-y-2">
              <Label htmlFor={trait.key} className={trait.color}>
                {trait.label}
              </Label>
              <Input
                id={trait.key}
                type="number"
                min={0}
                max={100}
                className={`${trait.borderColor} focus-visible:ring-current`}
                {...register(trait.key)}
              />
              {errors[trait.key] && (
                <p className="text-xs text-destructive">{errors[trait.key]?.message}</p>
              )}
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
