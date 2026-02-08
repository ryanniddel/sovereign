'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FileText } from 'lucide-react';
import { SEARCH_ENTITY_TYPE_ICONS, SEARCH_ENTITY_TYPE_COLORS } from '@/lib/constants';
import type { SearchResult, SearchEntityType } from '@sovereign/shared';

interface SearchResultItemProps {
  result: SearchResult;
  onClick?: () => void;
}

export function SearchResultItem({ result, onClick }: SearchResultItemProps) {
  const Icon = SEARCH_ENTITY_TYPE_ICONS[result.type as SearchEntityType] || FileText;
  const colorClass = SEARCH_ENTITY_TYPE_COLORS[result.type as SearchEntityType] || 'text-muted-foreground';

  return (
    <button
      className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', colorClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{result.title}</p>
        {result.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {result.status && (
          <Badge variant="outline" className="text-xs">
            {result.status}
          </Badge>
        )}
        {result.priority && (
          <Badge variant="outline" className="text-xs">
            {result.priority}
          </Badge>
        )}
      </div>
    </button>
  );
}
