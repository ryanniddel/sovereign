'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { useUIStore } from '@/stores/ui-store';
import { useQuickSearch, useRecordSearch, useRecentSearches } from '@/hooks/use-search';
import { NAV_ITEMS, SEARCH_ENTITY_TYPE_ICONS, SEARCH_ENTITY_TYPE_LABELS, SEARCH_ENTITY_TYPE_ROUTES } from '@/lib/constants';
import { Search, Clock, ArrowRight, Loader2 } from 'lucide-react';
import type { SearchResult } from '@sovereign/shared';

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounce search query by 250ms
  useEffect(() => {
    timerRef.current = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const { data: results, isFetching } = useQuickSearch(debouncedQuery);
  const { data: recentSearches } = useRecentSearches(5);
  const recordSearch = useRecordSearch();

  // Reset query when palette closes
  useEffect(() => {
    if (!commandPaletteOpen) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [commandPaletteOpen]);

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
      const base = SEARCH_ENTITY_TYPE_ROUTES[result.type] || '/dashboard';
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

  const handleRecentSelect = useCallback(
    (recentQuery: string) => {
      setQuery(recentQuery);
      setDebouncedQuery(recentQuery);
    },
    [],
  );

  const handleViewAll = useCallback(() => {
    setCommandPaletteOpen(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setQuery('');
  }, [router, setCommandPaletteOpen, query]);

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
        {isFetching && debouncedQuery.length >= 2 && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {!isFetching && debouncedQuery.length >= 2 && !results?.length && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {/* Recent searches when query is empty */}
        {!query && recentSearches && recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((recent) => (
              <CommandItem key={recent.id} onSelect={() => handleRecentSelect(recent.query)}>
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate">{recent.query}</span>
                <span className="text-xs text-muted-foreground">{recent.resultCount} results</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

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
          const Icon = SEARCH_ENTITY_TYPE_ICONS[type as keyof typeof SEARCH_ENTITY_TYPE_ICONS] || Search;
          const label = SEARCH_ENTITY_TYPE_LABELS[type as keyof typeof SEARCH_ENTITY_TYPE_LABELS] || type;
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

        {/* View all results link */}
        {debouncedQuery.length >= 2 && results && results.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleViewAll}>
                <ArrowRight className="mr-2 h-4 w-4" />
                <span>View all results for &ldquo;{query}&rdquo;</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
