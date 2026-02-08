'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Trash2 } from 'lucide-react';
import type { MeetingParticipant } from '@sovereign/shared';

interface ParticipantListProps {
  participants: MeetingParticipant[];
  onRemove?: (participantId: string) => void;
  onAcknowledge?: (participantId: string) => void;
  canManage?: boolean;
}

export function ParticipantList({ participants, onRemove, onAcknowledge, canManage }: ParticipantListProps) {
  if (participants.length === 0) {
    return <p className="text-sm text-muted-foreground">No participants added yet</p>;
  }

  return (
    <div className="space-y-2">
      {participants.map((p) => (
        <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{p.role}</Badge>
            {p.hasAcknowledged ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            {canManage && onRemove && (
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onRemove(p.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
