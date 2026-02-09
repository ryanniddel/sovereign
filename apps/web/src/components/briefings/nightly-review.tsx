'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Moon, TrendingUp, TrendingDown, Minus, Flame, CheckCircle, AlertTriangle, CalendarDays, Handshake, Users, FileText, Clock } from 'lucide-react';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import type { NightlyReviewContent } from '@sovereign/shared';
import type { Priority } from '@sovereign/shared';

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
      {/* Day Recap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Moon className="h-5 w-5 text-blue-500" />
            Day Recap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{content.dayRecap.meetingsAttended}</p>
              <p className="text-xs text-muted-foreground">Meetings</p>
            </div>
            <div>
              <p className="text-2xl font-bold">${content.dayRecap.meetingCostTotal}</p>
              <p className="text-xs text-muted-foreground">Cost</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-500">
                {content.dayRecap.commitmentsCompleted + content.dayRecap.actionItemsCompleted}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <Separator className="my-3" />
          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            <div>
              <p className="font-semibold text-emerald-500">{content.dayRecap.commitmentsCompleted}</p>
              <p className="text-xs text-muted-foreground">Commits Done</p>
            </div>
            <div>
              <p className="font-semibold text-red-500">{content.dayRecap.commitmentsMissed}</p>
              <p className="text-xs text-muted-foreground">Commits Missed</p>
            </div>
            <div>
              <p className="font-semibold text-emerald-500">{content.dayRecap.actionItemsCompleted}</p>
              <p className="text-xs text-muted-foreground">Actions Done</p>
            </div>
            <div>
              <p className="font-semibold text-red-500">{content.dayRecap.actionItemsMissed}</p>
              <p className="text-xs text-muted-foreground">Actions Missed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scorecard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Scorecard
            <TrendIcon direction={content.scorecard.trendDirection} />
            <span className="text-xs text-muted-foreground font-normal ml-1">
              {content.scorecard.trendDirection === 'UP' ? 'Improving' : content.scorecard.trendDirection === 'DOWN' ? 'Declining' : 'Stable'}
            </span>
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

      {/* Open Items */}
      {content.openItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Open Items ({content.openItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {content.openItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{item.title}</span>
                  <Badge variant="outline" className="text-xs capitalize">{item.type === 'actionItem' ? 'Action' : 'Commit'}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[item.priority as Priority] || ''}`}>
                    {PRIORITY_LABELS[item.priority as Priority] || item.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tomorrow Prep */}
      {content.tomorrowPrep.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-indigo-500" />
              Tomorrow&apos;s Meetings ({content.tomorrowPrep.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {content.tomorrowPrep.map((meeting, i) => (
              <div key={i} className="rounded-md border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{meeting.meetingTitle}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />{meeting.startTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {meeting.meetingType && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {meeting.meetingType.replace(/_/g, ' ').toLowerCase()}
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${meeting.preReadSent ? 'border-emerald-500/30 text-emerald-600' : 'border-orange-500/30 text-orange-600'}`}>
                    {meeting.preReadSent ? 'Pre-read sent' : 'No pre-read'}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${meeting.agendaConfirmed ? 'border-emerald-500/30 text-emerald-600' : 'border-orange-500/30 text-orange-600'}`}>
                    {meeting.agendaConfirmed ? 'Agenda set' : 'No agenda'}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />{meeting.participantCount}
                  </span>
                  {meeting.meetingCost != null && meeting.meetingCost > 0 && (
                    <span className="text-xs text-muted-foreground">${meeting.meetingCost}</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Streaks + Active Agreements */}
      <div className="grid gap-4 sm:grid-cols-2">
        {content.streaks.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Streaks</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {content.streaks.map((streak) => (
                  <div key={streak.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">{streak.type.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                    <div className="text-sm">
                      <span className="font-bold">{streak.current}</span>
                      <span className="text-xs text-muted-foreground ml-1">(best: {streak.longest})</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Status</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Closeout</span>
              <Badge variant={content.closeoutStatus.isCompleted ? 'default' : 'secondary'}>
                {content.closeoutStatus.isCompleted ? 'Completed' : 'Not Completed'}
              </Badge>
            </div>
            {content.activeAgreements > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm flex items-center gap-1"><Handshake className="h-3.5 w-3.5" />Active Agreements</span>
                <span className="text-sm font-bold">{content.activeAgreements}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reflection Prompt */}
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
