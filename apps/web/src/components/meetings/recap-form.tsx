'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSubmitRecap } from '@/hooks/use-meetings';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

const actionItemSchema = z.object({
  title: z.string().min(1, 'Required'),
  ownerEmail: z.string().email('Valid email required'),
  dueDate: z.string().optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
});

const commitmentSchema = z.object({
  title: z.string().min(1, 'Required'),
  ownerEmail: z.string().email('Valid email required'),
  dueDate: z.string().optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
});

const agreementSchema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  parties: z.string().optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
});

const contradictionSchema = z.object({
  newItem: z.string().min(1, 'Required'),
  existingAgreement: z.string().min(1, 'Required'),
  confidence: z.coerce.number().min(0).max(1).optional(),
});

const schema = z.object({
  transcriptUrl: z.string().optional(),
  recapContent: z.string().optional(),
  actualDurationMinutes: z.coerce.number().min(1).optional(),
  autoCreateItems: z.boolean().default(true),
  actionItems: z.array(actionItemSchema).optional(),
  commitments: z.array(commitmentSchema).optional(),
  agreements: z.array(agreementSchema).optional(),
  contradictions: z.array(contradictionSchema).optional(),
});

type FormValues = z.infer<typeof schema>;

interface RecapFormProps {
  meetingId: string;
  meetingTitle: string;
}

export function RecapForm({ meetingId, meetingTitle }: RecapFormProps) {
  const router = useRouter();
  const submitRecap = useSubmitRecap();
  const [result, setResult] = useState<{ actionItems: number; commitments: number; agreements: number } | null>(null);

  const { register, control, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { autoCreateItems: true, actionItems: [], commitments: [], agreements: [], contradictions: [] },
  });

  const actionItems = useFieldArray({ control, name: 'actionItems' });
  const commitments = useFieldArray({ control, name: 'commitments' });
  const agreements = useFieldArray({ control, name: 'agreements' });
  const contradictions = useFieldArray({ control, name: 'contradictions' });

  const onSubmit = (data: FormValues) => {
    submitRecap.mutate(
      {
        id: meetingId,
        transcriptUrl: data.transcriptUrl || undefined,
        recapContent: data.recapContent || undefined,
        actualDurationMinutes: data.actualDurationMinutes || undefined,
        autoCreateItems: data.autoCreateItems,
        actionItems: data.actionItems?.length ? data.actionItems : undefined,
        commitments: data.commitments?.length ? data.commitments : undefined,
        agreements: data.agreements?.length
          ? data.agreements.map((a) => ({
              ...a,
              parties: a.parties ? a.parties.split(',').map((p) => p.trim()) : undefined,
            }))
          : undefined,
        contradictions: data.contradictions?.length ? data.contradictions : undefined,
      },
      {
        onSuccess: (res) => {
          setResult(res.data.created);
        },
      },
    );
  };

  if (result) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="text-xl font-bold">Recap Submitted</h2>
          <p className="text-sm text-muted-foreground">
            Created {result.actionItems} action items, {result.commitments} commitments, {result.agreements} agreements
          </p>
          <Button onClick={() => router.push(`/meetings/${meetingId}`)}>Back to Meeting</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meeting Recap</CardTitle>
          <CardDescription>{meetingTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recapContent">Recap Summary</Label>
            <Textarea id="recapContent" rows={4} {...register('recapContent')} placeholder="Key takeaways and decisions made..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transcriptUrl">Transcript URL</Label>
              <Input id="transcriptUrl" {...register('transcriptUrl')} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualDurationMinutes">Actual Duration (min)</Label>
              <Input id="actualDurationMinutes" type="number" min={1} {...register('actualDurationMinutes')} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watch('autoCreateItems')} onCheckedChange={(v) => control._formValues.autoCreateItems = v} {...register('autoCreateItems')} />
            <Label className="text-sm">Auto-create items in Accountability Engine</Label>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Action Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => actionItems.append({ title: '', ownerEmail: '' })}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {actionItems.fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input {...register(`actionItems.${i}.title`)} placeholder="Action item..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Owner Email</Label>
                <Input {...register(`actionItems.${i}.ownerEmail`)} placeholder="owner@example.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Due</Label>
                <Input type="date" {...register(`actionItems.${i}.dueDate`)} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => actionItems.remove(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {actionItems.fields.length === 0 && <p className="text-xs text-muted-foreground">No action items extracted</p>}
        </CardContent>
      </Card>

      {/* Commitments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Commitments</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => commitments.append({ title: '', ownerEmail: '' })}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {commitments.fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input {...register(`commitments.${i}.title`)} placeholder="Commitment..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Owner Email</Label>
                <Input {...register(`commitments.${i}.ownerEmail`)} placeholder="owner@example.com" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Due</Label>
                <Input type="date" {...register(`commitments.${i}.dueDate`)} />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => commitments.remove(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {commitments.fields.length === 0 && <p className="text-xs text-muted-foreground">No commitments extracted</p>}
        </CardContent>
      </Card>

      {/* Agreements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Agreements</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => agreements.append({ title: '', description: '' })}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {agreements.fields.map((field, i) => (
            <div key={field.id} className="space-y-2 rounded-md border p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input {...register(`agreements.${i}.title`)} placeholder="Agreement title..." />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => agreements.remove(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea rows={2} {...register(`agreements.${i}.description`)} placeholder="Details..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Parties (comma-separated emails)</Label>
                <Input {...register(`agreements.${i}.parties`)} placeholder="alice@co.com, bob@co.com" />
              </div>
            </div>
          ))}
          {agreements.fields.length === 0 && <p className="text-xs text-muted-foreground">No agreements extracted</p>}
        </CardContent>
      </Card>

      {/* Contradictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Contradictions
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => contradictions.append({ newItem: '', existingAgreement: '' })}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {contradictions.fields.map((field, i) => (
            <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <div className="space-y-1">
                <Label className="text-xs">New Statement</Label>
                <Input {...register(`contradictions.${i}.newItem`)} placeholder="What was said..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Existing Agreement</Label>
                <Input {...register(`contradictions.${i}.existingAgreement`)} placeholder="Previous agreement..." />
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => contradictions.remove(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {contradictions.fields.length === 0 && <p className="text-xs text-muted-foreground">No contradictions detected</p>}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={submitRecap.isPending}>
          {submitRecap.isPending ? 'Submitting...' : 'Submit Recap'}
        </Button>
      </div>
    </form>
  );
}
