'use client';

import { useRouter } from 'next/navigation';
import { SearchResultItem } from './search-result-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import type { SearchResult } from '@sovereign/shared';

interface SearchGroup {
  type: string;
  label: string;
  results: SearchResult[];
  total: number;
}

interface SearchResultsProps {
  results?: SearchResult[];
  groups?: SearchGroup[];
  grouped?: boolean;
  loading?: boolean;
  queryTimeMs?: number;
  onResultClick?: (result: SearchResult) => void;
}

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

export function SearchResults({
  results,
  groups,
  grouped,
  loading,
  queryTimeMs,
  onResultClick,
}: SearchResultsProps) {
  const router = useRouter();

  const handleClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
      return;
    }
    const base = ENTITY_ROUTES[result.type] || '/dashboard';
    router.push(`${base}/${result.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  if (grouped && groups) {
    return (
      <div className="space-y-4">
        {queryTimeMs !== undefined && (
          <p className="px-3 text-xs text-muted-foreground">{queryTimeMs}ms</p>
        )}
        {groups.map((group) => (
          <div key={group.type}>
            <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label} ({group.total})
            </p>
            <div className="space-y-0.5">
              {group.results.map((result) => (
                <SearchResultItem
                  key={result.id}
                  result={result}
                  onClick={() => handleClick(result)}
                />
              ))}
            </div>
            <Separator className="mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!results?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">No results found</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {queryTimeMs !== undefined && (
        <p className="px-3 py-1 text-xs text-muted-foreground">{results.length} results in {queryTimeMs}ms</p>
      )}
      {results.map((result) => (
        <SearchResultItem
          key={result.id}
          result={result}
          onClick={() => handleClick(result)}
        />
      ))}
    </div>
  );
}
