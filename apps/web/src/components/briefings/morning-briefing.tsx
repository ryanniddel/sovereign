'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sun, Clock, AlertTriangle, Target, Flame } from 'lucide-react';
import type { MorningBriefingContent } from '@sovereign/shared';

interface MorningBriefingProps {
  content: MorningBriefingContent;
}

export function MorningBriefing({ content }: MorningBriefingProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-5 w-5 text-yellow-500" />
            Today&apos;s Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          {content.schedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">No meetings today</p>
          ) : (
            <div className="space-y-2">
              {content.schedule.map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="w-16 text-muted-foreground">{item.time}</span>
                  <span className="flex-1">{item.title}</span>
                  {item.meetingCost && <span className="text-muted-foreground">${item.meetingCost}</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {content.overdueItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue ({content.overdueItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {content.overdueItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <span>{item.title}</span>
                  <Badge variant="outline" className="text-xs">{item.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-blue-500" />
            Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{content.metrics.accountabilityScore}%</p>
              <p className="text-xs text-muted-foreground">Score</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{Math.round(content.metrics.onTimeRate * 100)}%</p>
              <p className="text-xs text-muted-foreground">On-Time</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <p className="text-2xl font-bold">{content.metrics.currentStreak}</p>
              </div>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {content.aiInsight && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm italic text-muted-foreground">&ldquo;{content.aiInsight}&rdquo;</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
