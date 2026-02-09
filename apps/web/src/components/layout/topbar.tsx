'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { Breadcrumbs } from './breadcrumbs';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Button } from '@/components/ui/button';
import { Search, Shield } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useActiveFocusMode, useDeactivateFocusMode } from '@/hooks/use-focus-modes';
import { differenceInMinutes } from 'date-fns';
import Link from 'next/link';

function FocusModeIndicator() {
  const { data: active } = useActiveFocusMode();
  const deactivate = useDeactivateFocusMode();
  const [minutes, setMinutes] = useState(0);

  useEffect(() => {
    if (!active?.activatedAt) return;
    const update = () => setMinutes(differenceInMinutes(new Date(), new Date(active.activatedAt!)));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [active?.activatedAt]);

  if (!active) return null;

  const dur = minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

  return (
    <Link
      href="/focus-modes"
      className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
      style={{ borderColor: active.color ?? '#8b5cf6' }}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: active.color ?? '#8b5cf6' }} />
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: active.color ?? '#8b5cf6' }} />
      </span>
      <Shield className="h-3 w-3" />
      <span className="hidden sm:inline">{active.name}</span>
      <span className="text-muted-foreground">{dur}</span>
    </Link>
  );
}

export function Topbar() {
  const { setCommandPaletteOpen } = useUIStore();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <Breadcrumbs />

      <div className="flex items-center gap-2">
        <FocusModeIndicator />
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 text-muted-foreground md:flex"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <kbd className="pointer-events-none ml-2 hidden rounded border bg-muted px-1.5 py-0.5 text-xs font-medium sm:inline-block">
            ⌘K
          </kbd>
        </Button>
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
