'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Moon, TrendingUp, TrendingDown, Minus, Flame, CheckCircle } from 'lucide-react';
import type { NightlyReviewContent } from '@sovereign/shared';

interface NightlyReviewProps {
  content: NightlyReviewContent;
}

const TrendIcon = ({ direction }: { direction: string }) => {
  if (direction === 'UP') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (direction === 'DOWN') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

export function NightlyReview({ content }: NightlyReviewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-5 w-5 text-blue-500" />
            Day Recap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{content.dayRecap.meetingsAttended}</p>
              <p className="text-xs text-muted-foreground">Meetings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">${content.dayRecap.meetingCostTotal}</p>
              <p className="text-xs text-muted-foreground">Meeting Cost</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">{content.dayRecap.commitmentsCompleted}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{content.dayRecap.commitmentsMissed}</p>
              <p className="text-xs text-muted-foreground">Missed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Scorecard
            <TrendIcon direction={content.scorecard.trendDirection} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Today&apos;s Score</span>
              <span className="font-bold">{content.scorecard.todayScore}%</span>
            </div>
            <Progress value={content.scorecard.todayScore} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>On-Time: {Math.round(content.scorecard.onTimeRate * 100)}%</div>
            <div>Delivered: {content.scorecard.commitmentsDelivered}/{content.scorecard.commitmentsMade}</div>
          </div>
        </CardContent>
      </Card>

      {content.streaks.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Streaks</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {content.streaks.map((streak) => (
                <div key={streak.type} className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{streak.current}</span>
                  <span className="text-xs text-muted-foreground">{streak.type.replace(/_/g, ' ').toLowerCase()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5" />
            Closeout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={content.closeoutStatus.isCompleted ? 'default' : 'secondary'}>
            {content.closeoutStatus.isCompleted ? 'Completed' : 'Not Completed'}
          </Badge>
        </CardContent>
      </Card>

      {content.reflectionPrompt && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm italic text-muted-foreground">&ldquo;{content.reflectionPrompt}&rdquo;</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
