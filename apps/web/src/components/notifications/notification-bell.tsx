'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUnreadCount } from '@/hooks/use-notifications';
import Link from 'next/link';

export function NotificationBell() {
  const { data: unread } = useUnreadCount();
  const total = unread?.total ?? 0;

  return (
    <Button variant="ghost" size="icon" className="relative h-9 w-9" asChild>
      <Link href="/notifications">
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </Link>
    </Button>
  );
}
