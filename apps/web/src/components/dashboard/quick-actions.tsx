'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Target, FileText, CheckSquare, Search, Moon } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import Link from 'next/link';

const createActions = [
  { label: 'New Meeting', href: '/meetings/new', icon: Calendar },
  { label: 'New Commitment', href: '/accountability/commitments/new', icon: Target },
  { label: 'New Action Item', href: '/accountability/action-items/new', icon: CheckSquare },
  { label: 'New Contact', href: '/contacts/new', icon: FileText },
];

export function QuickActions() {
  const { setCommandPaletteOpen } = useUIStore();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <Plus className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {createActions.map((action) => (
            <Button key={action.href} variant="outline" size="sm" asChild className="justify-start gap-2">
              <Link href={action.href}>
                <action.icon className="h-4 w-4" />
                {action.label}
              </Link>
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="justify-start gap-2"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="h-4 w-4" />
            Search
            <kbd className="ml-auto rounded border bg-muted px-1 text-[10px]">&#8984;K</kbd>
          </Button>
          <Button variant="secondary" size="sm" asChild className="justify-start gap-2">
            <Link href="/closeout">
              <Moon className="h-4 w-4" />
              Daily Closeout
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
