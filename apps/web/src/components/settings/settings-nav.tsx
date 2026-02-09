'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User, Clock, Brain, Bell, Activity, Plug, type LucideIcon } from 'lucide-react';

const settingsLinks: { label: string; href: string; icon: LucideIcon; description: string }[] = [
  { label: 'Profile', href: '/settings/profile', icon: User, description: 'Name, timezone, hourly rate' },
  { label: 'Working Hours', href: '/settings/working-hours', icon: Clock, description: 'Start and end times' },
  { label: 'Psychometrics', href: '/settings/psychometrics', icon: Brain, description: 'DISC, MBTI, Big Five' },
  { label: 'Briefing Preferences', href: '/settings/briefing-preferences', icon: Bell, description: 'Morning & nightly delivery' },
  { label: 'Integrations', href: '/settings/integrations', icon: Plug, description: 'CRM & external services' },
  { label: 'Scheduler', href: '/settings/scheduler', icon: Activity, description: 'Job health & monitoring' },
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
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            pathname === link.href
              ? 'bg-accent font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground',
          )}
        >
          <link.icon className="h-4 w-4 shrink-0" />
          <div>
            <p className="leading-none">{link.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{link.description}</p>
          </div>
        </Link>
      ))}
    </nav>
  );
}
