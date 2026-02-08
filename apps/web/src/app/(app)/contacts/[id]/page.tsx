'use client';

import { useParams, useRouter } from 'next/navigation';
import { useContact, useDeleteContact } from '@/hooks/use-contacts';
import { DISCProfileDisplay } from '@/components/contacts/disc-profile-display';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { format } from 'date-fns';
import { useState } from 'react';
import { Mail, Phone, Building, Briefcase } from 'lucide-react';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contact, isLoading } = useContact(id);
  const deleteContact = useDeleteContact();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (!contact) return <p>Not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{contact.name}</h1>
          <div className="mt-1 flex items-center gap-2">
            {contact.relationshipScore && <Badge variant="outline">Score: {contact.relationshipScore}</Badge>}
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Delete</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{contact.email}</span></div>
            {contact.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{contact.phone}</span></div>}
            {contact.company && <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{contact.company}</span></div>}
            {contact.title && <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{contact.title}</span></div>}
            <div><p className="text-xs text-muted-foreground">Last Interaction</p><p className="text-sm">{contact.lastInteractionAt ? format(new Date(contact.lastInteractionAt), 'PPp') : 'Never'}</p></div>
          </CardContent>
        </Card>

        <DISCProfileDisplay disc={contact.disc} />
      </div>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Contact" description="This cannot be undone." variant="destructive" confirmLabel="Delete" onConfirm={() => { deleteContact.mutate(id); router.push('/contacts'); }} />
    </div>
  );
}
