'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PriorityBadge } from './priority-badge';
import {
  COMMITMENT_STATUS_LABELS,
  ACTION_ITEM_STATUS_LABELS,
} from '@/lib/constants';
import {
  X,
  CalendarDays,
  User,
  Forward,
  Link2,
  Clock,
} from 'lucide-react';
import { CommitmentStatus, ActionItemStatus } from '@sovereign/shared';
import type { Commitment, ActionItem } from '@sovereign/shared';

interface ItemDetailPanelProps {
  item: Commitment | ActionItem;
  itemType: 'commitment' | 'action-item';
  onClose?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  COMPLETED: 'bg-green-500/10 text-green-500 border-green-500/20',
  OVERDUE: 'bg-red-500/10 text-red-500 border-red-500/20',
  RESCHEDULED: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  DELEGATED: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

function isCommitment(item: Commitment | ActionItem): item is Commitment {
  return 'isDelegated' in item;
}

export function ItemDetailPanel({ item, itemType, onClose }: ItemDetailPanelProps) {
  const statusLabels =
    itemType === 'commitment' ? COMMITMENT_STATUS_LABELS : ACTION_ITEM_STATUS_LABELS;
  const statusLabel =
    statusLabels[item.status as CommitmentStatus & ActionItemStatus] || item.status;
  const statusColor = STATUS_COLORS[item.status] || '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{item.title}</CardTitle>
          <p className="text-xs text-muted-foreground capitalize">
            {itemType === 'action-item' ? 'Action Item' : 'Commitment'}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status & Priority */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColor}>
            {statusLabel}
          </Badge>
          <PriorityBadge priority={item.priority} />
        </div>

        {/* Description */}
        {item.description && (
          <div className="space-y-1">
            <p className="text-sm font-medium">Description</p>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        )}

        <Separator />

        {/* Due Date */}
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Due Date:</span>
          <span className="text-muted-foreground">
            {new Date(item.dueDate).toLocaleDateString()}
          </span>
        </div>

        {/* Owner Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Owner:</span>
          <span className="text-muted-foreground">
            {item.ownerId} ({item.ownerType})
          </span>
        </div>

        {/* Delegation Info (commitments only) */}
        {isCommitment(item) && item.isDelegated && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Forward className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Delegated to:</span>
                <span className="text-muted-foreground">{item.delegatedToId}</span>
              </div>
              {item.delegatedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Delegated at:</span>
                  <span className="text-muted-foreground">
                    {new Date(item.delegatedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Retains accountability:</span>{' '}
                <span className="text-muted-foreground">
                  {item.delegatorRetainsAccountability ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Meeting Link */}
        {item.meetingId && (
          <>
            <Separator />
            <div className="flex items-center gap-2 text-sm">
              <Link2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Linked Meeting:</span>
              <span className="text-muted-foreground">{item.meetingId}</span>
            </div>
          </>
        )}

        {/* Timestamps */}
        <Separator />
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>Created: {new Date(item.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(item.updatedAt).toLocaleString()}</p>
          {item.completedAt && (
            <p>Completed: {new Date(item.completedAt).toLocaleString()}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
