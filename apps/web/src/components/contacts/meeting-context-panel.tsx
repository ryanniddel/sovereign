'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useContactMeetingContext } from '@/hooks/use-contacts';
import { Target, Users, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface MeetingContextPanelProps {
  contactId: string;
}

export function MeetingContextPanel({ contactId }: MeetingContextPanelProps) {
  const { data: ctx, isLoading } = useContactMeetingContext(contactId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
        <CardContent><Skeleton className="h-32" /></CardContent>
      </Card>
    );
  }

  if (!ctx) return null;

  const { openCommitments, deliveryTrackRecord, meetingHistory } = ctx;

  return (
    <div className="space-y-4">
      {/* Delivery Track Record */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />Delivery Track Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold">{deliveryTrackRecord.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-500">{deliveryTrackRecord.delivered}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-destructive">{deliveryTrackRecord.missed}</p>
              <p className="text-xs text-muted-foreground">Missed</p>
            </div>
            <div>
              <p className="text-lg font-semibold">
                {deliveryTrackRecord.deliveryRate != null ? `${Math.round(deliveryTrackRecord.deliveryRate * 100)}%` : '--'}
              </p>
              <p className="text-xs text-muted-foreground">Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Open Commitments */}
      {(openCommitments.toContact.length > 0 || openCommitments.fromContact.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4" />Open Commitments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openCommitments.toContact.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">To this contact ({openCommitments.toContact.length})</p>
                {openCommitments.toContact.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border p-2 mb-1">
                    <span className="text-sm">{c.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{c.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(c.dueDate), 'MMM d')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {openCommitments.fromContact.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">From this contact ({openCommitments.fromContact.length})</p>
                {openCommitments.fromContact.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md border p-2 mb-1">
                    <span className="text-sm">{c.title}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{c.priority}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(c.dueDate), 'MMM d')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meeting History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />Meeting History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold">{meetingHistory.totalMeetings}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-500">{meetingHistory.completedMeetings}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          {meetingHistory.averageRating != null && (
            <p className="text-xs text-muted-foreground">Avg rating: {meetingHistory.averageRating.toFixed(1)}/5</p>
          )}
          {meetingHistory.recentMeetings.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Recent</p>
              {meetingHistory.recentMeetings.slice(0, 5).map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1">
                  <span className="text-sm truncate mr-2">{m.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">{m.status}</Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />{format(new Date(m.createdAt), 'MMM d')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
