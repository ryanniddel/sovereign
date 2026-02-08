'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, ArrowRight, FileText, Target } from 'lucide-react';
import type { CloseoutSummary as CloseoutSummaryType } from '@sovereign/shared';

interface CloseoutSummaryProps {
  summary: CloseoutSummaryType;
}

export function CloseoutSummary({ summary }: CloseoutSummaryProps) {
  const completionPercent = Math.round(summary.completionRate * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Target className="h-4 w-4" />
          Closeout Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Completion Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion Rate</span>
            <span className="font-semibold">{completionPercent}%</span>
          </div>
          <Progress value={completionPercent} className="h-3" />
        </div>

        {/* Item Counts */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-md border p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="text-xs">Open at Start</span>
            </div>
            <p className="mt-1 text-lg font-semibold">{summary.openItemsAtStart}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-xs">Completed</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-emerald-600">{summary.itemsCompleted}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Rescheduled</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-blue-600">{summary.itemsRescheduled}</p>
          </div>
          <div className="rounded-md border p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-orange-600">
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="text-xs">Delegated</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-orange-600">{summary.itemsDelegated}</p>
          </div>
        </div>

        {/* Agreements Reviewed & Score */}
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Agreements Reviewed</span>
            <p className="font-semibold">{summary.activeAgreementsReviewed}</p>
          </div>
          <div className="text-right text-sm">
            <span className="text-muted-foreground">Score at Close</span>
            <p className="text-lg font-bold">{summary.scoreAtClose}</p>
          </div>
        </div>

        {/* Streaks Updated */}
        {summary.streaksUpdated.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Streaks Updated</span>
            <div className="flex flex-wrap gap-2">
              {summary.streaksUpdated.map((streak) => (
                <Badge key={streak} variant="secondary">
                  {streak}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
