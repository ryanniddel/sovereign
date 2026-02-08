'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useCloseoutHistory } from '@/hooks/use-daily-closeout';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { CloseoutSummary } from '@/components/closeout/closeout-summary';
import { format } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { DailyCloseout } from '@sovereign/shared';

export default function CloseoutHistoryPage() {
  const { data: history, isLoading } = useCloseoutHistory(30);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/closeout"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Closeout History</h1>
      </div>

      {!history || history.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">No closeout history yet. Complete your first daily closeout to see it here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((closeout: DailyCloseout) => {
            const isOpen = expanded === closeout.id;
            const summary = closeout.closeoutSummary;
            const completionRate = summary ? Math.round(summary.completionRate * 100) : null;

            return (
              <Card key={closeout.id}>
                <CardContent className="p-4">
                  {/* Row header */}
                  <button
                    className="flex w-full items-center justify-between text-left"
                    onClick={() => setExpanded(isOpen ? null : closeout.id)}
                  >
                    <div className="flex items-center gap-3">
                      {closeout.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{format(new Date(closeout.date), 'EEEE, MMMM d, yyyy')}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {closeout.isCompleted ? (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 text-xs">Completed</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Incomplete</Badge>
                          )}
                          {completionRate !== null && (
                            <span className="text-xs text-muted-foreground">{completionRate}% completion</span>
                          )}
                          {summary?.scoreAtClose != null && (
                            <span className="text-xs text-muted-foreground">Score: {summary.scoreAtClose}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </button>

                  {/* Expanded details */}
                  {isOpen && (
                    <div className="mt-4 space-y-3">
                      <Separator />

                      {/* Counts row */}
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-lg font-semibold">{closeout.openItemsAtStart}</p>
                          <p className="text-xs text-muted-foreground">Open Items</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-emerald-500">{closeout.itemsCompleted}</p>
                          <p className="text-xs text-muted-foreground">Completed</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-blue-500">{closeout.itemsRescheduled}</p>
                          <p className="text-xs text-muted-foreground">Rescheduled</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-orange-500">{closeout.itemsDelegated}</p>
                          <p className="text-xs text-muted-foreground">Delegated</p>
                        </div>
                      </div>

                      {completionRate !== null && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Completion Rate</span>
                            <span className="font-medium">{completionRate}%</span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Agreements Reviewed</span>
                        <span className="font-medium">{closeout.activeAgreementsReviewed}</span>
                      </div>

                      {closeout.reflectionNotes && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Reflection</p>
                            <p className="text-sm whitespace-pre-wrap">{closeout.reflectionNotes}</p>
                          </div>
                        </>
                      )}

                      {summary?.streaksUpdated && summary.streaksUpdated.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {summary.streaksUpdated.map((s: string) => (
                            <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      )}

                      {closeout.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed at {format(new Date(closeout.completedAt), 'h:mm a')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
