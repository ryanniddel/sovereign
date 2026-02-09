'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sun, Clock, AlertTriangle, Target, Flame, CheckSquare, ClipboardList, CalendarDays, Handshake, Users, Focus, Star } from 'lucide-react';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import type { MorningBriefingContent } from '@sovereign/shared';
import type { Priority } from '@sovereign/shared';

interface MorningBriefingProps {
  content: MorningBriefingContent;
}

export function MorningBriefing({ content }: MorningBriefingProps) {
  return (
    <div className="space-y-4">
      {/* Today's Schedule */}
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
                  <div className="flex items-center gap-2">
                    {item.prepReady === false && (
                      <Badge variant="outline" className="text-xs text-orange-500 border-orange-500/30">Prep needed</Badge>
                    )}
                    {item.meetingCost != null && item.meetingCost > 0 && (
                      <span className="text-xs text-muted-foreground">${item.meetingCost}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commitments Due Today */}
      {content.commitmentsDueToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-5 w-5 text-purple-500" />
              Commitments Due Today ({content.commitmentsDueToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {content.commitmentsDueToday.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.title}</span>
                <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[item.priority as Priority] || ''}`}>
                  {PRIORITY_LABELS[item.priority as Priority] || item.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Items Due Today */}
      {content.actionItemsDueToday.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-5 w-5 text-indigo-500" />
              Action Items Due Today ({content.actionItemsDueToday.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {content.actionItemsDueToday.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.title}</span>
                <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[item.priority as Priority] || ''}`}>
                  {PRIORITY_LABELS[item.priority as Priority] || item.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overdue Items */}
      {content.overdueItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Overdue ({content.overdueItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {content.overdueItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{item.title}</span>
                  <Badge variant="outline" className="text-xs capitalize">{item.type === 'actionItem' ? 'Action Item' : 'Commitment'}</Badge>
                </div>
                <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[item.priority as Priority] || ''}`}>
                  {PRIORITY_LABELS[item.priority as Priority] || item.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contact Context */}
      {content.contactContext?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-teal-500" />
              People You&apos;ll Meet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {content.contactContext.map((contact) => (
              <div key={contact.contactId} className="rounded-md border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{contact.name}</span>
                    {contact.company && (
                      <span className="text-xs text-muted-foreground ml-2">{contact.company}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium">{contact.relationshipScore}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{contact.meetingTitle}</p>
                {contact.discProfile && (
                  <div className="flex gap-2 text-xs">
                    <span className="text-red-500">D:{contact.discProfile.D}</span>
                    <span className="text-yellow-500">I:{contact.discProfile.I}</span>
                    <span className="text-green-500">S:{contact.discProfile.S}</span>
                    <span className="text-blue-500">C:{contact.discProfile.C}</span>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
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

      {/* Tomorrow Preview + Active Agreements */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Tomorrow Preview
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{content.tomorrowPreview.meetingCount} meeting{content.tomorrowPreview.meetingCount !== 1 ? 's' : ''}</p>
                {content.tomorrowPreview.totalMeetingCost > 0 && (
                  <p>Meeting cost: ${content.tomorrowPreview.totalMeetingCost}</p>
                )}
                {content.tomorrowPreview.firstMeeting && (
                  <p>First: {content.tomorrowPreview.firstMeeting}</p>
                )}
              </div>
            </div>
            {content.activeAgreements > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                  Active Agreements
                </div>
                <p className="text-2xl font-bold">{content.activeAgreements}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Priority Ranking */}
      {content.priorityRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority Focus</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1">
              {content.priorityRanking.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">{i + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Focus Recommendation */}
      {content.focusRecommendation && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <Focus className="h-4 w-4 mt-0.5 text-violet-500 shrink-0" />
              <p className="text-sm">{content.focusRecommendation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insight */}
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
