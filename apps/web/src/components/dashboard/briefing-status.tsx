'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sun, Moon, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useTodayBriefings } from '@/hooks/use-briefings';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export function BriefingStatus() {
  const { data: today, isLoading } = useTodayBriefings();

  const morning = today?.morning;
  const nightly = today?.nightly;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Today&apos;s Briefings</CardTitle>
        <Sun className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Morning briefing */}
            <Link
              href="/briefings/morning"
              className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
            >
              <Sun className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Morning Briefing</p>
                <p className="text-xs text-muted-foreground">
                  {morning ? (morning.readAt ? 'Read' : morning.isCompleted ? 'Completed' : 'Available') : 'Not generated'}
                </p>
              </div>
              {morning ? (
                morning.readAt || morning.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Badge variant="default" className="text-xs shrink-0">New</Badge>
                )
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </Link>

            {/* Nightly review */}
            <Link
              href="/briefings/nightly"
              className="flex items-center gap-3 rounded-md p-2 hover:bg-accent transition-colors"
            >
              <Moon className="h-4 w-4 text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Nightly Review</p>
                <p className="text-xs text-muted-foreground">
                  {nightly ? (nightly.readAt ? 'Read' : nightly.isCompleted ? 'Completed' : 'Available') : 'Not generated'}
                </p>
              </div>
              {nightly ? (
                nightly.readAt || nightly.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <Badge variant="default" className="text-xs shrink-0">New</Badge>
                )
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </Link>
          </div>
        )}
        <Link
          href="/briefings"
          className="mt-3 flex items-center justify-center gap-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          View Briefings <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}
