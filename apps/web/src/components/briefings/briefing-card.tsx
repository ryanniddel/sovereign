'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useCompleteBriefing } from '@/hooks/use-briefings';
import type { Briefing } from '@sovereign/shared';
import { Sun, Moon, CheckCircle } from 'lucide-react';

interface BriefingCardProps {
  briefing: Briefing;
}

export function BriefingCard({ briefing }: BriefingCardProps) {
  const complete = useCompleteBriefing();
  const isMorning = briefing.type === 'MORNING';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          {isMorning ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-500" />}
          <CardTitle className="text-sm">{isMorning ? 'Morning Briefing' : 'Nightly Review'}</CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{format(new Date(briefing.date), 'MMM d, yyyy')}</span>
          {briefing.isCompleted ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500"><CheckCircle className="mr-1 h-3 w-3" />Read</Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={() => complete.mutate(briefing.id)}>Mark as Read</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {typeof briefing.content === 'string' ? (
            <p>{briefing.content}</p>
          ) : (
            <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(briefing.content, null, 2)}</pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
