'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEscalationAnalytics } from '@/hooks/use-escalation';
import { ESCALATION_CHANNEL_LABELS, ESCALATION_TONE_LABELS, ESCALATION_TARGET_TYPE_LABELS } from '@/lib/constants';
import type { EscalationChannel, EscalationTone, EscalationTargetType } from '@sovereign/shared';
import { BarChart3, Clock, MessageSquare, Link2 } from 'lucide-react';

const DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '14', label: 'Last 14 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '60', label: 'Last 60 Days' },
  { value: '90', label: 'Last 90 Days' },
];

export default function EscalationAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data: analytics, isLoading } = useEscalationAnalytics(days);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Escalation Analytics</h1>
          <Skeleton className="h-10 w-[160px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
      </div>
    );
  }

  if (!analytics) return <p>No analytics data available</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Escalation Analytics</h1>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATE_RANGE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{analytics.totalEscalations}</p>
            <p className="text-sm text-muted-foreground">Total Escalations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{Math.round(analytics.responseRate * 100)}%</p>
            <p className="text-sm text-muted-foreground">Response Rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{analytics.averageResponseTimeMinutes > 0 ? `${Math.round(analytics.averageResponseTimeMinutes)}m` : '--'}</p>
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Link2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{analytics.activeChains}</p>
            <p className="text-sm text-muted-foreground">Active Chains</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* By Channel */}
        <Card>
          <CardHeader><CardTitle className="text-sm">By Channel</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.byChannel).map(([channel, count]) => (
              <div key={channel} className="flex items-center justify-between">
                <span className="text-sm">
                  {ESCALATION_CHANNEL_LABELS[channel as EscalationChannel] || channel}
                </span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {Object.keys(analytics.byChannel).length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* By Tone */}
        <Card>
          <CardHeader><CardTitle className="text-sm">By Tone</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.byTone).map(([tone, count]) => (
              <div key={tone} className="flex items-center justify-between">
                <span className="text-sm">
                  {ESCALATION_TONE_LABELS[tone as EscalationTone] || tone}
                </span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {Object.keys(analytics.byTone).length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* By Target Type */}
        <Card>
          <CardHeader><CardTitle className="text-sm">By Target Type</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(analytics.byTargetType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm">
                  {ESCALATION_TARGET_TYPE_LABELS[type as EscalationTargetType] || type}
                </span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
            {Object.keys(analytics.byTargetType).length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        {/* Resolution */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Resolution</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Resolved by Response</span>
              <Badge variant="outline">{analytics.resolvedByResponse}</Badge>
            </div>
            {analytics.totalEscalations > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Resolution Rate</span>
                  <span>{Math.round((analytics.resolvedByResponse / analytics.totalEscalations) * 100)}%</span>
                </div>
                <Progress value={(analytics.resolvedByResponse / analytics.totalEscalations) * 100} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
