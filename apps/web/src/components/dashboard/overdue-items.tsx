'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { useActionItems } from '@/hooks/use-action-items';
import { useCommitments } from '@/hooks/use-commitments';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/status-badge';
import { format } from 'date-fns';
import Link from 'next/link';

export function OverdueItems() {
  const { data: actionItems, isLoading: aiLoading } = useActionItems({ status: 'OVERDUE' as never, pageSize: 5 });
  const { data: commitments, isLoading: cLoading } = useCommitments({ status: 'OVERDUE' as never, pageSize: 5 });

  const isLoading = aiLoading || cLoading;
  const overdueActionItems = actionItems?.data || [];
  const overdueCommitments = commitments?.data || [];
  const totalOverdue = (actionItems?.pagination?.total || 0) + (commitments?.pagination?.total || 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
        <div className="flex items-center gap-2">
          {totalOverdue > 0 && (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
              {totalOverdue}
            </span>
          )}
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : totalOverdue === 0 ? (
          <p className="text-sm text-muted-foreground">No overdue items</p>
        ) : (
          <div className="space-y-2">
            {overdueCommitments.slice(0, 3).map((item) => (
              <Link
                key={item.id}
                href={`/accountability/commitments/${item.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-accent transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Due {format(new Date(item.dueDate), 'MMM d')}</p>
                </div>
                <StatusBadge status="OVERDUE" type="commitment" />
              </Link>
            ))}
            {overdueActionItems.slice(0, 2).map((item) => (
              <Link
                key={item.id}
                href={`/accountability/action-items/${item.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-accent transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Due {format(new Date(item.dueDate), 'MMM d')}</p>
                </div>
                <StatusBadge status="OVERDUE" type="actionItem" />
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
