'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useUIStore } from '@/stores/ui-store';
import { useQuickSearch, useRecordSearch } from '@/hooks/use-search';
import { NAV_ITEMS } from '@/lib/constants';
import {
  FileText, Calendar, Users, Target, Search, Shield, Bell, Zap, ClipboardList, CalendarDays,
} from 'lucide-react';
import type { SearchResult } from '@sovereign/shared';

const ENTITY_ICONS: Record<string, typeof FileText> = {
  contact: Users,
  meeting: Calendar,
  commitment: Target,
  actionItem: ClipboardList,
  agreement: FileText,
  calendarEvent: CalendarDays,
  escalationRule: Zap,
  briefing: Bell,
  focusMode: Shield,
};

const ENTITY_ROUTES: Record<string, string> = {
  contact: '/contacts',
  meeting: '/meetings',
  commitment: '/accountability/commitments',
  actionItem: '/accountability/action-items',
  agreement: '/accountability/agreements',
  calendarEvent: '/calendar',
  escalationRule: '/escalation',
  briefing: '/briefings',
  focusMode: '/focus-modes',
};

const ENTITY_LABELS: Record<string, string> = {
  contact: 'Contacts',
  meeting: 'Meetings',
  commitment: 'Commitments',
  actionItem: 'Action Items',
  agreement: 'Agreements',
  calendarEvent: 'Calendar',
  escalationRule: 'Escalation Rules',
  briefing: 'Briefings',
  focusMode: 'Focus Modes',
};

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const { data: results } = useQuickSearch(query);
  const recordSearch = useRecordSearch();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setCommandPaletteOpen(false);
      recordSearch.mutate({
        query,
        resultCount: results?.length,
        selectedResultId: result.id,
        selectedResultType: result.type,
      });
      setQuery('');
      const base = ENTITY_ROUTES[result.type] || '/dashboard';
      router.push(`${base}/${result.id}`);
    },
    [router, setCommandPaletteOpen, query, results, recordSearch],
  );

  const handleNavSelect = useCallback(
    (href: string) => {
      setCommandPaletteOpen(false);
      setQuery('');
      router.push(href);
    },
    [router, setCommandPaletteOpen],
  );

  // Group results by type
  const grouped = (results || []).reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<string, SearchResult[]>,
  );

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search everything..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {!query && (
          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.href} onSelect={() => handleNavSelect(item.href)}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {Object.entries(grouped).map(([type, items]) => {
          const Icon = ENTITY_ICONS[type] || Search;
          const label = ENTITY_LABELS[type] || type;
          return (
            <CommandGroup key={type} heading={label}>
              {items.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
                  <Icon className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{item.title}</span>
                  {item.subtitle && (
                    <span className="ml-2 text-xs text-muted-foreground truncate">{item.subtitle}</span>
                  )}
                  {item.status && (
                    <span className="ml-2 text-xs text-muted-foreground">{item.status}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
