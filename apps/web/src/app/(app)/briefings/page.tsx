'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { Sun, Moon, TrendingUp, Star, Settings } from 'lucide-react';
import { useTodayBriefings, useBriefingEngagement } from '@/hooks/use-briefings';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function BriefingsPage() {
  const { data: today, isLoading: todayLoading } = useTodayBriefings();
  const { data: engagement, isLoading: engLoading } = useBriefingEngagement(30);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Briefings</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings/briefing-preferences"><Settings className="mr-1 h-4 w-4" />Preferences</Link>
        </Button>
      </div>

      {/* Today's Briefings */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-500" />
            <CardTitle>Morning Briefing</CardTitle>
            {todayLoading ? <Skeleton className="h-5 w-16 ml-auto" /> : today?.morning ? (
              <Badge variant="outline" className="ml-auto text-xs">
                {today.morning.isCompleted ? 'Completed' : today.morning.readAt ? 'Read' : 'New'}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <Skeleton className="h-8" />
            ) : today?.morning ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generated {format(new Date(today.morning.createdAt), 'h:mm a')}
                </p>
                <Button asChild><Link href="/briefings/morning">View Morning Briefing</Link></Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No briefing generated yet today</p>
                <Button asChild><Link href="/briefings/morning">Generate Morning Briefing</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Moon className="h-5 w-5 text-blue-500" />
            <CardTitle>Nightly Review</CardTitle>
            {todayLoading ? <Skeleton className="h-5 w-16 ml-auto" /> : today?.nightly ? (
              <Badge variant="outline" className="ml-auto text-xs">
                {today.nightly.isCompleted ? 'Completed' : today.nightly.readAt ? 'Read' : 'New'}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <Skeleton className="h-8" />
            ) : today?.nightly ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generated {format(new Date(today.nightly.createdAt), 'h:mm a')}
                </p>
                <Button asChild><Link href="/briefings/nightly">View Nightly Review</Link></Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No review generated yet today</p>
                <Button asChild><Link href="/briefings/nightly">Generate Nightly Review</Link></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Engagement Stats (Last 30 Days) */}
      {engLoading ? (
        <Skeleton className="h-48" />
      ) : engagement ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />Engagement (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{engagement.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(engagement.readRate * 100)}%</p>
                <p className="text-xs text-muted-foreground">Read Rate</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round(engagement.completionRate * 100)}%</p>
                <p className="text-xs text-muted-foreground">Completion</p>
              </div>
              <div>
                <p className="text-2xl font-bold flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  {engagement.averageRating > 0 ? engagement.averageRating.toFixed(1) : '--'}
                </p>
                <p className="text-xs text-muted-foreground">Avg Rating ({engagement.ratingsCount})</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1"><Sun className="h-3 w-3 text-yellow-500" />Morning</span>
                  <span className="text-muted-foreground">{engagement.byType.morning.completed}/{engagement.byType.morning.total}</span>
                </div>
                <Progress value={engagement.byType.morning.total > 0 ? (engagement.byType.morning.completed / engagement.byType.morning.total) * 100 : 0} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1"><Moon className="h-3 w-3 text-blue-500" />Nightly</span>
                  <span className="text-muted-foreground">{engagement.byType.nightly.completed}/{engagement.byType.nightly.total}</span>
                </div>
                <Progress value={engagement.byType.nightly.total > 0 ? (engagement.byType.nightly.completed / engagement.byType.nightly.total) * 100 : 0} />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* History Link */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href="/briefings/history">View Briefing History</Link>
        </Button>
      </div>
    </div>
  );
}
