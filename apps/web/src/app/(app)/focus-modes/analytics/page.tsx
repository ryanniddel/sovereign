'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFocusModeAnalytics } from '@/hooks/use-focus-modes';
import { BarChart3, Clock, Shield, ShieldAlert, BellOff } from 'lucide-react';

const DATE_RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '14', label: 'Last 14 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '60', label: 'Last 60 Days' },
  { value: '90', label: 'Last 90 Days' },
];

export default function FocusModeAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data: analytics, isLoading } = useFocusModeAnalytics(days);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Focus Mode Analytics</h1>
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
        <h1 className="text-2xl font-bold tracking-tight">Focus Mode Analytics</h1>
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
            <Shield className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{analytics.totalSessions}</p>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{Math.round(analytics.totalMinutes / 60)}h</p>
            <p className="text-sm text-muted-foreground">Total Focus Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{analytics.averageSessionMinutes > 0 ? `${Math.round(analytics.averageSessionMinutes)}m` : '--'}</p>
            <p className="text-sm text-muted-foreground">Avg Session</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BellOff className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-3xl font-bold">{Math.round(analytics.suppressionStats.suppressionRate * 100)}%</p>
            <p className="text-sm text-muted-foreground">Suppression Rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* By Mode */}
        <Card>
          <CardHeader><CardTitle className="text-sm">By Mode</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {analytics.byMode.map((m) => (
              <div key={m.modeId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{m.modeName}</span>
                  <span className="text-muted-foreground">{m.sessions} sessions · {Math.round(m.totalMinutes / 60)}h</span>
                </div>
                <Progress value={analytics.totalMinutes > 0 ? (m.totalMinutes / analytics.totalMinutes) * 100 : 0} />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{m.notificationsSuppressed} suppressed</span>
                  <span>{m.notificationsAllowed} allowed</span>
                </div>
              </div>
            ))}
            {analytics.byMode.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
          </CardContent>
        </Card>

        {/* Override Stats */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4" />Override Stats</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{analytics.overrideStats.totalRequests}</p>
                <p className="text-xs text-muted-foreground">Total Requests</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-500">{analytics.overrideStats.approved}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{analytics.overrideStats.rejected}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-500">{analytics.overrideStats.expired}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Suppression */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Notification Suppression</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Suppressed</span>
              <Badge variant="outline">{analytics.suppressionStats.totalSuppressed}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Allowed Through</span>
              <Badge variant="outline">{analytics.suppressionStats.totalAllowed}</Badge>
            </div>
            {(analytics.suppressionStats.totalSuppressed + analytics.suppressionStats.totalAllowed) > 0 && (
              <Progress value={analytics.suppressionStats.suppressionRate * 100} />
            )}
          </CardContent>
        </Card>

        {/* Activations by Day */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Activations by Day</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(analytics.activationsByDay)
              .sort(([a], [b]) => a.localeCompare(b))
              .slice(-7)
              .map(([day, count]) => (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{day}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            {Object.keys(analytics.activationsByDay).length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
