'use client';

import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';
import { Breadcrumbs } from './breadcrumbs';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

export function Topbar() {
  const { setCommandPaletteOpen } = useUIStore();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <Breadcrumbs />

      <div className="flex items-center gap-2">
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
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
