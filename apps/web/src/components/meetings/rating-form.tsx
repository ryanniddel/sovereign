'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Star } from 'lucide-react';
import { useRateMeeting } from '@/hooks/use-meetings';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface RatingFormProps {
  meetingId: string;
}

export function RatingForm({ meetingId }: RatingFormProps) {
  const router = useRouter();
  const rateMeeting = useRateMeeting();
  const [rating, setRating] = useState(0);
  const [valueScore, setValueScore] = useState(0);
  const [wasNecessary, setWasNecessary] = useState(true);

  const handleSubmit = () => {
    rateMeeting.mutate(
      { id: meetingId, rating, valueScore: valueScore || undefined, wasNecessary },
      { onSuccess: () => router.push(`/meetings/${meetingId}`) },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate This Meeting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Overall Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)}>
                <Star
                  className={cn(
                    'h-8 w-8 transition-colors',
                    star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground',
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Value Score</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setValueScore(star)}>
                <Star
                  className={cn(
                    'h-6 w-6 transition-colors',
                    star <= valueScore ? 'fill-blue-500 text-blue-500' : 'text-muted-foreground',
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch checked={wasNecessary} onCheckedChange={setWasNecessary} />
          <Label>This meeting was necessary</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => router.back()}>Skip</Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || rateMeeting.isPending}>
            {rateMeeting.isPending ? 'Submitting...' : 'Submit Rating'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
