'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Contact } from '@sovereign/shared';

interface ContactsTableProps {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeDate(date?: Date | string | null): string {
  if (!date) return '--';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

export function ContactsTable({ contacts, onSelect }: ContactsTableProps) {
  if (!contacts.length) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-sm text-muted-foreground">No contacts found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Last Interaction</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow
              key={contact.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelect(contact)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {getInitials(contact.name)}
                  </div>
                  <span className="font-medium">{contact.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contact.email}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contact.company || '--'}
              </TableCell>
              <TableCell>
                {contact.tierId ? (
                  <Badge variant="secondary">Tiered</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">--</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={contact.relationshipScore}
                    className="h-2 w-16"
                  />
                  <span
                    className={`text-xs font-medium ${scoreColor(contact.relationshipScore)}`}
                  >
                    {contact.relationshipScore}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatRelativeDate(contact.lastInteractionAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
