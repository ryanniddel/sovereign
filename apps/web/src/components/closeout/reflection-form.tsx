'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ReflectionFormProps {
  onSubmit: (data: { notes: string }) => void;
  defaultValue?: string;
  loading?: boolean;
}

const MAX_CHARS = 2000;

const PROMPTS = [
  'What was your biggest win today?',
  'What challenged you most? How did you handle it?',
  'What would you do differently if you could redo today?',
  'Who helped you today, and how can you reciprocate?',
  'What did you learn that you can apply tomorrow?',
  'Which commitments are you most proud of completing?',
  'What patterns do you notice in what gets rescheduled?',
];

export function ReflectionForm({ onSubmit, defaultValue = '', loading }: ReflectionFormProps) {
  const [notes, setNotes] = useState(defaultValue);
  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ notes: notes.trim() });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Daily Reflection</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reflection-notes">{prompt}</Label>
            <Textarea
              id="reflection-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, MAX_CHARS))}
              rows={5}
              placeholder="Take a moment to reflect on your day..."
            />
            <div className="flex justify-end">
              <span className="text-xs text-muted-foreground">
                {notes.length}/{MAX_CHARS}
              </span>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onSubmit({ notes: '' })} disabled={loading}>
              Skip
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Completing...' : 'Complete Closeout'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
