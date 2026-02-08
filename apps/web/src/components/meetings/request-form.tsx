'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateMeeting } from '@/hooks/use-meetings';
import { useRouter } from 'next/navigation';
import { MEETING_TYPE_LABELS } from '@/lib/constants';

type FormValues = {
  title: string;
  purpose: string;
  description?: string;
  decisionRequired?: string;
  estimatedDurationMinutes?: number;
  meetingType?: string;
  agendaUrl?: string;
  preReadUrl?: string;
};

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  description: z.string().optional(),
  decisionRequired: z.string().optional(),
  estimatedDurationMinutes: z.coerce.number().min(15).optional(),
  meetingType: z.string().optional(),
  agendaUrl: z.string().url().optional().or(z.literal('')),
  preReadUrl: z.string().url().optional().or(z.literal('')),
});

export function MeetingRequestForm() {
  const router = useRouter();
  const createMeeting = useCreateMeeting();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { estimatedDurationMinutes: 30 },
  });

  const onSubmit = (data: FormValues) => {
    createMeeting.mutate(
      {
        title: data.title,
        purpose: data.purpose,
        description: data.description,
        decisionRequired: data.decisionRequired,
        estimatedDurationMinutes: data.estimatedDurationMinutes,
        meetingType: data.meetingType as never,
        agendaUrl: data.agendaUrl || undefined,
        preReadUrl: data.preReadUrl || undefined,
      },
      { onSuccess: (res) => router.push(`/meetings/${res.data.id}`) },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request a Meeting</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea id="purpose" {...register('purpose')} placeholder="Why is this meeting needed?" />
            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Meeting Type</Label>
              <Select onValueChange={(val) => setValue('meetingType', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEETING_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDurationMinutes">Duration (min)</Label>
              <Input id="estimatedDurationMinutes" type="number" min={15} {...register('estimatedDurationMinutes')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="decisionRequired">Decision Required</Label>
            <Input id="decisionRequired" {...register('decisionRequired')} placeholder="What decision will be made?" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agendaUrl">Agenda URL</Label>
              <Input id="agendaUrl" {...register('agendaUrl')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preReadUrl">Pre-Read URL</Label>
              <Input id="preReadUrl" {...register('preReadUrl')} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
