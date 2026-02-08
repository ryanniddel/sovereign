'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const settingsLinks = [
  { label: 'Profile', href: '/settings/profile' },
  { label: 'Working Hours', href: '/settings/working-hours' },
  { label: 'Psychometrics', href: '/settings/psychometrics' },
  { label: 'Briefing Preferences', href: '/settings/briefing-preferences' },
  { label: 'Scheduler', href: '/settings/scheduler' },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {settingsLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            'rounded-md px-3 py-2 text-sm transition-colors',
            pathname === link.href
              ? 'bg-accent font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
