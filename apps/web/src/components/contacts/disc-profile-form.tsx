'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const schema = z.object({
  discD: z.coerce.number().min(0).max(100),
  discI: z.coerce.number().min(0).max(100),
  discS: z.coerce.number().min(0).max(100),
  discC: z.coerce.number().min(0).max(100),
});

type DISCFormValues = z.infer<typeof schema>;

interface DISCProfileFormProps {
  defaultValues?: { discD?: number | null; discI?: number | null; discS?: number | null; discC?: number | null };
  onSubmit: (data: DISCFormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const traits = [
  { key: 'discD' as const, label: 'D - Dominance', color: 'text-red-600', borderColor: 'border-red-500' },
  { key: 'discI' as const, label: 'I - Influence', color: 'text-yellow-600', borderColor: 'border-yellow-500' },
  { key: 'discS' as const, label: 'S - Steadiness', color: 'text-green-600', borderColor: 'border-green-500' },
  { key: 'discC' as const, label: 'C - Conscientiousness', color: 'text-blue-600', borderColor: 'border-blue-500' },
];

export function DISCProfileForm({ defaultValues, onSubmit, onCancel, loading }: DISCProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DISCFormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      discD: defaultValues?.discD ?? 50,
      discI: defaultValues?.discI ?? 50,
      discS: defaultValues?.discS ?? 50,
      discC: defaultValues?.discC ?? 50,
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

          <div className="flex justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
