'use client';

import { useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { ESCALATION_CHANNEL_LABELS, ESCALATION_TONE_LABELS } from '@/lib/constants';

interface EscalationStep {
  id: string;
  stepOrder: number;
  channel: string;
  delayMinutes: number;
  tone: string;
  messageTemplate: string;
}

interface WorkflowBuilderProps {
  steps: EscalationStep[];
  onChange: (steps: EscalationStep[]) => void;
}

function SortableStep({
  step,
  onUpdate,
  onRemove,
}: {
  step: EscalationStep;
  onUpdate: (updates: Partial<EscalationStep>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="rounded-md border bg-card p-3">
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-2 cursor-grab text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Step {step.stepOrder}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Channel</Label>
              <Select value={step.channel} onValueChange={(v) => onUpdate({ channel: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESCALATION_CHANNEL_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Delay (min)</Label>
              <Input className="h-8" type="number" min={0} value={step.delayMinutes} onChange={(e) => onUpdate({ delayMinutes: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label className="text-xs">Tone</Label>
              <Select value={step.tone} onValueChange={(v) => onUpdate({ tone: v })}>
                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ESCALATION_TONE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Message Template</Label>
            <Input className="h-8" value={step.messageTemplate} onChange={(e) => onUpdate({ messageTemplate: e.target.value })} placeholder="Optional custom message" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowBuilder({ steps, onChange }: WorkflowBuilderProps) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex).map((s, i) => ({ ...s, stepOrder: i + 1 }));
    onChange(reordered);
  };

  const addStep = () => {
    const newStep: EscalationStep = {
      id: `step-${Date.now()}`,
      stepOrder: steps.length + 1,
      channel: 'IN_APP',
      delayMinutes: 30,
      tone: 'PROFESSIONAL',
      messageTemplate: '',
    };
    onChange([...steps, newStep]);
  };

  const updateStep = (id: string, updates: Partial<EscalationStep>) => {
    onChange(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeStep = (id: string) => {
    onChange(steps.filter((s) => s.id !== id).map((s, i) => ({ ...s, stepOrder: i + 1 })));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">Workflow Steps</CardTitle>
        <Button size="sm" variant="outline" onClick={addStep}>
          <Plus className="mr-1 h-4 w-4" />
          Add Step
        </Button>
      </CardHeader>
      <CardContent>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {steps.map((step) => (
                <SortableStep
                  key={step.id}
                  step={step}
                  onUpdate={(updates) => updateStep(step.id, updates)}
                  onRemove={() => removeStep(step.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {steps.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">No steps yet. Add a step to build your workflow.</p>
        )}
      </CardContent>
    </Card>
  );
}
