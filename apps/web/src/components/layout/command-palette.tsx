'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useUIStore } from '@/stores/ui-store';
import { useSearch } from '@/hooks/use-search';
import { NAV_ITEMS } from '@/lib/constants';
import { FileText, Calendar, Users, Target, Search } from 'lucide-react';

const ENTITY_ICONS: Record<string, typeof FileText> = {
  contact: Users,
  meeting: Calendar,
  commitment: Target,
  actionItem: FileText,
  agreement: FileText,
};

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const { data: searchResults } = useSearch(query);

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
    (href: string) => {
      setCommandPaletteOpen(false);
      setQuery('');
      router.push(href);
    },
    [router, setCommandPaletteOpen],
  );

  const groupedResults = searchResults?.data?.reduce(
    (acc, item) => {
      const type = item.entityType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    },
    {} as Record<string, typeof searchResults.data>,
  );

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search everything..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {!query && (
          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.href} onSelect={() => handleSelect(item.href)}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {groupedResults &&
          Object.entries(groupedResults).map(([type, items]) => {
            const Icon = ENTITY_ICONS[type] || Search;
            return (
              <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + 's'}>
                {items.map((item) => (
                  <CommandItem key={item.id} onSelect={() => handleSelect(item.url)}>
                    <Icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                    {item.description && (
                      <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
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
