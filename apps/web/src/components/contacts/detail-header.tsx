'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, Mail, Phone } from 'lucide-react';
import type { Contact } from '@sovereign/shared';

interface DetailHeaderProps {
  contact: Contact;
  tierName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

function scoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function DetailHeader({ contact, tierName, onEdit, onDelete }: DetailHeaderProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {getInitials(contact.name)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{contact.name}</h1>
            {tierName && <Badge variant="secondary">{tierName}</Badge>}
          </div>

          {(contact.title || contact.company) && (
            <p className="text-sm text-muted-foreground">
              {contact.title}
              {contact.title && contact.company && ' at '}
              {contact.company}
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              <span>{contact.email}</span>
            </div>
            {contact.phone && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{contact.phone}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">Relationship</span>
            <Progress value={contact.relationshipScore} className="h-2 w-24" />
            <span className={`text-sm font-semibold ${scoreColor(contact.relationshipScore)}`}>
              {contact.relationshipScore}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-1 h-4 w-4" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
