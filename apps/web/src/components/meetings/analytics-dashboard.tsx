'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useMeetingAnalytics } from '@/hooks/use-meetings';
import { MEETING_TYPE_LABELS, MEETING_STATUS_LABELS } from '@/lib/constants';
import type { MeetingType, MeetingStatus } from '@sovereign/shared';
import {
  DollarSign, Clock, TrendingUp, Star, BarChart3, Users, XCircle, CheckCircle2,
} from 'lucide-react';

export function MeetingAnalyticsDashboard() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const params = {
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };
  const { data: analytics, isLoading } = useMeetingAnalytics(
    Object.keys(params).length > 0 ? params : undefined,
  );

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <div className="flex gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" className="h-8 text-xs w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" className="h-8 text-xs w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {analytics && (
        <>
          {/* Top-line metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{analytics.totalMeetings}</p>
                </div>
                <p className="text-xs text-muted-foreground">Total Meetings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">${analytics.totalCost.toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{analytics.totalHoursInMeetings}h</p>
                </div>
                <p className="text-xs text-muted-foreground">Hours in Meetings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <p className="text-2xl font-bold">{analytics.averageRating?.toFixed(1) ?? '--'}</p>
                </div>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-bold">{(analytics.qualificationRate * 100).toFixed(0)}%</p>
                </div>
                <p className="text-xs text-muted-foreground">Qualification Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-bold">${analytics.costPerMeeting.toFixed(0)}</p>
                </div>
                <p className="text-xs text-muted-foreground">Cost per Meeting</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-bold">{analytics.averageDurationMinutes}min</p>
                </div>
                <p className="text-xs text-muted-foreground">Avg Duration</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <p className="text-lg font-bold">{analytics.meetingsRatedUnnecessary}</p>
                </div>
                <p className="text-xs text-muted-foreground">Rated Unnecessary</p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdowns */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">By Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(analytics.meetingsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm">{MEETING_STATUS_LABELS[status as MeetingStatus] || status}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">By Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(analytics.meetingsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{MEETING_TYPE_LABELS[type as MeetingType] || type}</span>
                    <Badge variant="outline">{count as number}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Value metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Value Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics.completedMeetings}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Completed
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics.cancelledMeetings}</p>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" /> Cancelled
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{analytics.averageValueScore?.toFixed(1) ?? '--'}</p>
                  <p className="text-xs text-muted-foreground">Avg Value Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
