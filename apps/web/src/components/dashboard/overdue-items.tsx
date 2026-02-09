'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useAccountabilityDashboard, useAccountabilityItems } from '@/hooks/use-accountability';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { PRIORITY_COLORS } from '@/lib/constants';
import { format, formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export function OverdueItems() {
  const { data: dashboard, isLoading: dashLoading } = useAccountabilityDashboard();
  const { data: items, isLoading: itemsLoading } = useAccountabilityItems('overdue');

  const isLoading = dashLoading || itemsLoading;
  const overdueItems = items?.items || [];
  const totalOverdue = items?.counts?.total || 0;
  const dueToday = dashboard ? dashboard.dueToday.commitments + dashboard.dueToday.actionItems : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
        <div className="flex items-center gap-2">
          {totalOverdue > 0 && (
            <Badge variant="destructive" className="text-xs">
              {totalOverdue} overdue
            </Badge>
          )}
          {dueToday > 0 && (
            <Badge variant="outline" className="border-orange-500/30 text-xs text-orange-500">
              {dueToday} due today
            </Badge>
          )}
          <AlertTriangle className={`h-4 w-4 ${totalOverdue > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : totalOverdue === 0 && dueToday === 0 ? (
          <p className="text-sm text-muted-foreground">No overdue or due-today items</p>
        ) : (
          <div className="space-y-1">
            {overdueItems.slice(0, 5).map((item) => {
              const isCommitment = item.itemType === 'commitment';
              const href = isCommitment
                ? `/accountability/commitments/${item.id}`
                : `/accountability/action-items/${item.id}`;
              const dueDate = new Date(item.dueDate);

              return (
                <Link
                  key={item.id}
                  href={href}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-accent transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.priority && (
                        <span className={`inline-block h-1.5 w-1.5 rounded-full ${PRIORITY_COLORS[item.priority]?.split(' ')[0] || 'bg-gray-400'}`} />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Due {format(dueDate, 'MMM d')} ({formatDistanceToNow(dueDate, { addSuffix: true })})
                    </p>
                  </div>
                  <StatusBadge status="OVERDUE" type={isCommitment ? 'commitment' : 'actionItem'} />
                </Link>
              );
            })}
          </div>
        )}
        {totalOverdue > 5 && (
          <Link
            href="/accountability"
            className="mt-2 flex items-center justify-center gap-1 rounded-md border border-dashed py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
          >
            View all {totalOverdue} overdue items <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
