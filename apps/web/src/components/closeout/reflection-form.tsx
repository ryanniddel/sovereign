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

export function ReflectionForm({ onSubmit, defaultValue = '', loading }: ReflectionFormProps) {
  const [notes, setNotes] = useState(defaultValue);

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
            <Label htmlFor="reflection-notes">
              How did today go? What did you learn?
            </Label>
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
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !notes.trim()}>
              {loading ? 'Saving...' : 'Save Reflection'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
