'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useProtectionRules, useCreateProtectionRule, useUpdateProtectionRule, useDeleteProtectionRule,
} from '@/hooks/use-calendar';
import { ProtectionRuleType } from '@sovereign/shared';
import type { CalendarProtectionRule } from '@sovereign/shared';
import { ShieldCheck, Plus, Pencil, Trash2, Clock, Ban, Focus, Users } from 'lucide-react';

const RULE_TYPE_CONFIG: Record<string, { label: string; description: string; icon: typeof Clock }> = {
  UNBOOKABLE_HOURS: { label: 'Unbookable Hours', description: 'Block time ranges from being booked', icon: Ban },
  BUFFER_TIME: { label: 'Buffer Time', description: 'Enforce gaps between meetings', icon: Clock },
  FOCUS_PROTECTION: { label: 'Focus Protection', description: 'Protect focus blocks from overlapping events', icon: Focus },
  MAX_DAILY_MEETINGS: { label: 'Max Daily Meetings', description: 'Limit the number of meetings per day', icon: Users },
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  isActive: z.boolean().default(true),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  daysOfWeek: z.array(z.number()).optional(),
  bufferMinutes: z.coerce.number().optional(),
  maxCount: z.coerce.number().optional(),
  requires2faOverride: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export function ProtectionRulesManager() {
  const { data: rules, isLoading } = useProtectionRules();
  const createRule = useCreateProtectionRule();
  const updateRule = useUpdateProtectionRule();
  const deleteRule = useDeleteProtectionRule();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CalendarProtectionRule | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: { isActive: true, requires2faOverride: false, daysOfWeek: [] },
  });

  const ruleType = watch('type');
  const selectedDays = watch('daysOfWeek') || [];

  const openCreate = () => {
    setEditingRule(null);
    reset({ isActive: true, requires2faOverride: false, daysOfWeek: [] });
    setDialogOpen(true);
  };

  const openEdit = (rule: CalendarProtectionRule) => {
    setEditingRule(rule);
    reset({
      name: rule.name,
      type: rule.type,
      isActive: rule.isActive,
      startTime: rule.startTime || '',
      endTime: rule.endTime || '',
      daysOfWeek: rule.daysOfWeek || [],
      bufferMinutes: rule.bufferMinutes,
      maxCount: rule.maxCount,
      requires2faOverride: rule.requires2faOverride,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    const payload = {
      name: data.name,
      type: data.type as ProtectionRuleType,
      isActive: data.isActive,
      startTime: data.startTime || undefined,
      endTime: data.endTime || undefined,
      daysOfWeek: data.daysOfWeek?.length ? data.daysOfWeek : undefined,
      bufferMinutes: data.bufferMinutes || undefined,
      maxCount: data.maxCount || undefined,
      requires2faOverride: data.requires2faOverride,
    };

    if (editingRule) {
      updateRule.mutate({ id: editingRule.id, ...payload }, {
        onSuccess: () => { setDialogOpen(false); reset(); },
      });
    } else {
      createRule.mutate(payload, {
        onSuccess: () => { setDialogOpen(false); reset(); },
      });
    }
  };

  const toggleDay = (day: number) => {
    const current = selectedDays;
    setValue('daysOfWeek', current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  };

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Calendar Protection Rules
              </CardTitle>
              <CardDescription>Define rules to protect your calendar from overbooking</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!rules?.length ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No protection rules configured.</p>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const cfg = RULE_TYPE_CONFIG[rule.type];
                const Icon = cfg?.icon || ShieldCheck;
                return (
                  <div key={rule.id} className="flex items-center justify-between rounded-md border p-4">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{rule.name}</span>
                          <Badge variant="outline" className="text-xs">{cfg?.label || rule.type}</Badge>
                          {!rule.isActive && <Badge variant="secondary" className="text-xs">Disabled</Badge>}
                          {rule.requires2faOverride && <Badge variant="outline" className="text-xs">2FA</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {rule.type === 'UNBOOKABLE_HOURS' && rule.startTime && rule.endTime && `${rule.startTime} – ${rule.endTime}`}
                          {rule.type === 'BUFFER_TIME' && rule.bufferMinutes && `${rule.bufferMinutes} min buffer`}
                          {rule.type === 'MAX_DAILY_MEETINGS' && rule.maxCount && `Max ${rule.maxCount} meetings/day`}
                          {rule.type === 'FOCUS_PROTECTION' && 'Protects focus blocks'}
                          {rule.daysOfWeek?.length ? ` · ${rule.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, isActive: checked })}
                      />
                      <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteRule.mutate(rule.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Protection Rule' : 'Create Protection Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} placeholder="e.g., No meetings before 9 AM" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Rule Type</Label>
              <Select value={ruleType} onValueChange={(v) => setValue('type', v)} disabled={!!editingRule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RULE_TYPE_CONFIG).map(([value, cfg]) => (
                    <SelectItem key={value} value={value}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {ruleType && <p className="text-xs text-muted-foreground">{RULE_TYPE_CONFIG[ruleType]?.description}</p>}
            </div>

            {(ruleType === 'UNBOOKABLE_HOURS') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input id="startTime" type="time" {...register('startTime')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" type="time" {...register('endTime')} />
                </div>
              </div>
            )}

            {ruleType === 'BUFFER_TIME' && (
              <div className="space-y-2">
                <Label htmlFor="bufferMinutes">Buffer (minutes)</Label>
                <Input id="bufferMinutes" type="number" min={5} step={5} {...register('bufferMinutes')} />
              </div>
            )}

            {ruleType === 'MAX_DAILY_MEETINGS' && (
              <div className="space-y-2">
                <Label htmlFor="maxCount">Maximum Meetings Per Day</Label>
                <Input id="maxCount" type="number" min={1} {...register('maxCount')} />
              </div>
            )}

            {(ruleType === 'UNBOOKABLE_HOURS' || ruleType === 'MAX_DAILY_MEETINGS') && (
              <div className="space-y-2">
                <Label>Apply On Days</Label>
                <div className="flex gap-2">
                  {DAY_LABELS.map((label, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <Checkbox
                        checked={selectedDays.includes(i)}
                        onCheckedChange={() => toggleDay(i)}
                      />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={watch('requires2faOverride')}
                onCheckedChange={(checked) => setValue('requires2faOverride', checked)}
              />
              <Label className="text-sm">Require 2FA to override</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createRule.isPending || updateRule.isPending}>
                {editingRule ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
