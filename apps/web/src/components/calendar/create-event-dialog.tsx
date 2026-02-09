'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, ChevronDown, Shield, Clock } from 'lucide-react';
import { useCreateEvent, useUpdateEvent, useConflictCheck } from '@/hooks/use-calendar';
import { CalendarEventType } from '@sovereign/shared';
import type { CalendarEvent } from '@sovereign/shared';
import { CALENDAR_EVENT_TYPE_LABELS } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  eventType: z.string().optional(),
  isAllDay: z.boolean().optional(),
  isProtected: z.boolean().optional(),
  bufferBeforeMinutes: z.coerce.number().min(0).optional(),
  bufferAfterMinutes: z.coerce.number().min(0).optional(),
  travelBufferMinutes: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  editEvent?: CalendarEvent | null;
}

export function CreateEventDialog({ open, onOpenChange, defaultDate, editEvent }: CreateEventDialogProps) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const isEditing = !!editEvent;
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      startTime: defaultDate ? `${defaultDate}T09:00` : '',
      endTime: defaultDate ? `${defaultDate}T10:00` : '',
      isAllDay: false,
      isProtected: false,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      travelBufferMinutes: 0,
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (editEvent && open) {
      const toLocal = (d: Date | string) => format(new Date(d), "yyyy-MM-dd'T'HH:mm");
      const toDate = (d: Date | string) => format(new Date(d), 'yyyy-MM-dd');
      reset({
        title: editEvent.title,
        description: editEvent.description || '',
        startTime: editEvent.isAllDay ? toDate(editEvent.startTime) : toLocal(editEvent.startTime),
        endTime: editEvent.isAllDay ? toDate(editEvent.endTime) : toLocal(editEvent.endTime),
        location: editEvent.location || '',
        eventType: editEvent.eventType || '',
        isAllDay: editEvent.isAllDay,
        isProtected: editEvent.isProtected,
        bufferBeforeMinutes: editEvent.bufferBeforeMinutes || 0,
        bufferAfterMinutes: editEvent.bufferAfterMinutes || 0,
        travelBufferMinutes: editEvent.travelBufferMinutes || 0,
      });
      if (editEvent.bufferBeforeMinutes || editEvent.bufferAfterMinutes || editEvent.travelBufferMinutes || editEvent.isProtected) {
        setAdvancedOpen(true);
      }
    }
  }, [editEvent, open, reset]);

  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const isAllDay = watch('isAllDay');

  const startISO = startTime ? new Date(startTime).toISOString() : '';
  const endISO = endTime ? new Date(endTime).toISOString() : '';

  const { data: conflictData } = useConflictCheck(startISO, endISO, editEvent?.id);

  const onSubmit = (data: FormValues) => {
    const payload = {
      title: data.title,
      description: data.description,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString(),
      location: data.location,
      eventType: data.eventType as CalendarEventType | undefined,
      isAllDay: data.isAllDay,
      isProtected: data.isProtected,
      bufferBeforeMinutes: data.bufferBeforeMinutes || undefined,
      bufferAfterMinutes: data.bufferAfterMinutes || undefined,
      travelBufferMinutes: data.travelBufferMinutes || undefined,
    };

    const onSuccess = () => {
      reset();
      setAdvancedOpen(false);
      onOpenChange(false);
    };

    if (isEditing) {
      updateEvent.mutate({ id: editEvent!.id, ...payload }, { onSuccess });
    } else {
      createEvent.mutate(payload, { onSuccess });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'Create Event'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} rows={2} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={isAllDay}
                onCheckedChange={(checked) => setValue('isAllDay', checked)}
              />
              <Label className="text-sm">All day</Label>
            </div>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start</Label>
                <Input id="startTime" type="datetime-local" {...register('startTime')} />
                {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End</Label>
                <Input id="endTime" type="datetime-local" {...register('endTime')} />
                {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
              </div>
            </div>
          )}

          {isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Date</Label>
                <Input id="startTime" type="date" {...register('startTime')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Date</Label>
                <Input id="endTime" type="date" {...register('endTime')} />
              </div>
            </div>
          )}

          {/* Conflict Warning */}
          {conflictData && conflictData.hasConflicts && (
            <div className="flex items-start gap-2 rounded-md border border-orange-500/30 bg-orange-500/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
              <div className="text-sm">
                <p className="font-medium text-orange-500">
                  {conflictData.hardConflicts} conflict{conflictData.hardConflicts !== 1 ? 's' : ''} detected
                </p>
                {conflictData.conflicts.slice(0, 3).map((c, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{c.message}</p>
                ))}
                {conflictData.protectionViolations > 0 && (
                  <Badge variant="outline" className="mt-1 border-red-500/30 text-xs text-red-500">
                    <Shield className="mr-1 h-3 w-3" />
                    {conflictData.protectionViolations} protection violation{conflictData.protectionViolations !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...register('location')} />
          </div>

          <div className="space-y-2">
            <Label>Event Type</Label>
            <Select value={watch('eventType') || ''} onValueChange={(val) => setValue('eventType', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CALENDAR_EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" type="button" className="w-full justify-between">
                Advanced Options
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={watch('isProtected')}
                  onCheckedChange={(checked) => setValue('isProtected', checked)}
                />
                <Label className="text-sm">
                  <Shield className="mr-1 inline h-3.5 w-3.5" />
                  Protected time (requires 2FA to override)
                </Label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="bufferBefore" className="text-xs">
                    <Clock className="mr-1 inline h-3 w-3" />
                    Buffer Before
                  </Label>
                  <Input id="bufferBefore" type="number" min={0} step={5} placeholder="0 min" {...register('bufferBeforeMinutes')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bufferAfter" className="text-xs">
                    <Clock className="mr-1 inline h-3 w-3" />
                    Buffer After
                  </Label>
                  <Input id="bufferAfter" type="number" min={0} step={5} placeholder="0 min" {...register('bufferAfterMinutes')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelBuffer" className="text-xs">
                    <Clock className="mr-1 inline h-3 w-3" />
                    Travel Time
                  </Label>
                  <Input id="travelBuffer" type="number" min={0} step={5} placeholder="0 min" {...register('travelBufferMinutes')} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
              {isEditing
                ? updateEvent.isPending ? 'Saving...' : 'Save'
                : createEvent.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
