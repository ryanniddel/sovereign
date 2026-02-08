'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useMarkBriefingRead, useCompleteBriefing, useSubmitBriefingFeedback } from '@/hooks/use-briefings';
import { MorningBriefing } from '@/components/briefings/morning-briefing';
import { NightlyReview } from '@/components/briefings/nightly-review';
import type { Briefing, MorningBriefingContent, NightlyReviewContent } from '@sovereign/shared';
import { Sun, Moon, CheckCircle, Star, Eye } from 'lucide-react';

interface BriefingCardProps {
  briefing: Briefing;
}

export function BriefingCard({ briefing }: BriefingCardProps) {
  const markRead = useMarkBriefingRead();
  const complete = useCompleteBriefing();
  const submitFeedback = useSubmitBriefingFeedback();
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const isMorning = briefing.type === 'MORNING';

  const handleFeedback = () => {
    if (rating > 0) {
      submitFeedback.mutate({ id: briefing.id, rating, notes: notes || undefined }, {
        onSuccess: () => setShowFeedback(false),
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {isMorning ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-500" />}
            <CardTitle className="text-sm">{isMorning ? 'Morning Briefing' : 'Nightly Review'}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{format(new Date(briefing.date), 'MMM d, yyyy')}</span>
            {briefing.readAt && (
              <Badge variant="outline" className="text-xs"><Eye className="mr-1 h-3 w-3" />Read</Badge>
            )}
            {briefing.isCompleted ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
            ) : (
              <div className="flex gap-1">
                {!briefing.readAt && (
                  <Button size="sm" variant="outline" onClick={() => markRead.mutate(briefing.id)} disabled={markRead.isPending}>
                    Mark Read
                  </Button>
                )}
                <Button size="sm" onClick={() => complete.mutate(briefing.id)} disabled={complete.isPending}>
                  Complete
                </Button>
              </div>
            )}
            {briefing.feedbackRating ? (
              <Badge variant="outline" className="text-xs">
                <Star className="mr-1 h-3 w-3 fill-yellow-500 text-yellow-500" />{briefing.feedbackRating}/5
              </Badge>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowFeedback(!showFeedback)}>
                <Star className="mr-1 h-3 w-3" />Rate
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Feedback form */}
      {showFeedback && !briefing.feedbackRating && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="p-1"
                >
                  <Star className={`h-5 w-5 ${s <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} />
                </button>
              ))}
              <span className="text-sm text-muted-foreground ml-2">{rating > 0 ? `${rating}/5` : 'Select rating'}</span>
            </div>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional feedback notes..."
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFeedback(false)}>Cancel</Button>
              <Button size="sm" onClick={handleFeedback} disabled={rating === 0 || submitFeedback.isPending}>
                {submitFeedback.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rich content */}
      {isMorning ? (
        <MorningBriefing content={briefing.content as MorningBriefingContent} />
      ) : (
        <NightlyReview content={briefing.content as NightlyReviewContent} />
      )}
    </div>
  );
}
