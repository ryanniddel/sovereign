'use client';

import { useState } from 'react';
import { useBriefings } from '@/hooks/use-briefings';
import { BriefingCard } from '@/components/briefings/briefing-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Sun, Moon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Briefing, BriefingType } from '@sovereign/shared';

export default function BriefingHistoryPage() {
  const [typeFilter, setTypeFilter] = useState<BriefingType | undefined>(undefined);
  const { data: briefings, isLoading } = useBriefings(typeFilter ? { type: typeFilter } : undefined);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Briefing History</h1>
        <div className="flex gap-2">
          <Button
            variant={typeFilter === undefined ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(undefined)}
          >All</Button>
          <Button
            variant={typeFilter === 'MORNING' as BriefingType ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('MORNING' as BriefingType)}
          ><Sun className="mr-1 h-3 w-3" />Morning</Button>
          <Button
            variant={typeFilter === 'NIGHTLY' as BriefingType ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('NIGHTLY' as BriefingType)}
          ><Moon className="mr-1 h-3 w-3" />Nightly</Button>
        </div>
      </div>

      {!briefings || briefings.length === 0 ? (
        <EmptyState icon={FileText} title="No briefings yet" description="Generate your first briefing to see it here" />
      ) : (
        <div className="space-y-3">
          {briefings.map((briefing: Briefing) => (
            <div key={briefing.id}>
              {expanded === briefing.id ? (
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" onClick={() => setExpanded(null)}>Collapse</Button>
                  <BriefingCard briefing={briefing} />
                </div>
              ) : (
                <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(briefing.id)}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      {briefing.type === 'MORNING' ? (
                        <Sun className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Moon className="h-4 w-4 text-blue-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {briefing.type === 'MORNING' ? 'Morning Briefing' : 'Nightly Review'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(briefing.date), 'EEEE, MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {briefing.isCompleted && (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 text-xs">Completed</Badge>
                      )}
                      {briefing.feedbackRating && (
                        <Badge variant="outline" className="text-xs">{briefing.feedbackRating}/5</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
