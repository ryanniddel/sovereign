'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/constants';
import { Priority } from '@sovereign/shared';

interface OpenItem {
  id: string;
  title: string;
  type: 'commitment' | 'actionItem';
  priority: string;
  dueDate: string;
  status: string;
}

interface OpenItemsChecklistProps {
  items: OpenItem[];
  onComplete: (id: string) => void;
  onReschedule: (id: string) => void;
  onDelegate?: (id: string) => void;
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return `Due in ${diffDays}d`;
}

export function OpenItemsChecklist({ items, onComplete, onReschedule, onDelegate }: OpenItemsChecklistProps) {
  if (!items.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Open Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No open items to resolve. You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Open Items ({items.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const priorityKey = item.priority as Priority;
          const priorityLabel = PRIORITY_LABELS[priorityKey] ?? item.priority;
          const priorityColor = PRIORITY_COLORS[priorityKey] ?? '';

          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border p-3"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.type === 'actionItem' ? 'Action Item' : 'Commitment'}
                  </Badge>
                  <Badge variant="outline" className={priorityColor}>
                    {priorityLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDueDate(item.dueDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                  onClick={() => onComplete(item.id)}
                  title="Complete"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => onReschedule(item.id)}
                  title="Reschedule"
                >
                  <Clock className="h-4 w-4" />
                </Button>
                {onDelegate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                    onClick={() => onDelegate(item.id)}
                    title="Delegate"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
