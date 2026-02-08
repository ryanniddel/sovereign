'use client';

import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search.api';

export function useSearch(q: string, entityTypes?: string[]) {
  return useQuery({
    queryKey: ['search', q, entityTypes],
    queryFn: () => searchApi.search({ q, entityTypes }),
    enabled: q.length >= 2,
  });
}
