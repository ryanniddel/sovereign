'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Target, FileText, CheckSquare } from 'lucide-react';
import Link from 'next/link';

const actions = [
  { label: 'New Meeting', href: '/meetings/new', icon: Calendar },
  { label: 'New Commitment', href: '/accountability/commitments/new', icon: Target },
  { label: 'New Action Item', href: '/accountability/action-items/new', icon: CheckSquare },
  { label: 'New Contact', href: '/contacts/new', icon: FileText },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <Plus className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <Button key={action.href} variant="outline" size="sm" asChild className="justify-start gap-2">
              <Link href={action.href}>
                <action.icon className="h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
