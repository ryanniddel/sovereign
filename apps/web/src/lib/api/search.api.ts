import { api } from './client';
import type {
  SearchResult, GroupedSearchResults, SavedSearch, RecentSearch, SearchEntityType,
} from '@sovereign/shared';

type SearchQuery = {
  q: string; page?: number; pageSize?: number;
  entityTypes?: string[]; status?: string; priority?: string;
  from?: string; to?: string; grouped?: boolean;
};

type SavedSearchInput = {
  name: string; query: string; entityTypes?: SearchEntityType[];
  filters?: Record<string, unknown>; shortcutKey?: string;
};

export const searchApi = {
  // Universal search
  search: (params: SearchQuery) =>
    api.get<{ results: SearchResult[]; groups?: GroupedSearchResults['groups']; totalResults: number; queryTimeMs: number }>(
      '/search',
      {
        ...params,
        entityTypes: params.entityTypes?.join(','),
      } as Record<string, string | number | boolean>,
    ),

  // Quick search (optimized for command palette, top 8 results)
  quickSearch: (q: string) =>
    api.get<SearchResult[]>('/search/quick', { q }),

  // Suggestions (recent + saved search matches)
  getSuggestions: (q: string) =>
    api.get<{ recentSearches: RecentSearch[]; savedSearches: SavedSearch[] }>('/search/suggestions', { q }),

  // Saved searches
  getSavedSearches: () => api.get<SavedSearch[]>('/search/saved'),
  createSavedSearch: (data: SavedSearchInput) => api.post<SavedSearch>('/search/saved', data),
  updateSavedSearch: (id: string, data: Partial<SavedSearchInput>) => api.patch<SavedSearch>(`/search/saved/${id}`, data),
  deleteSavedSearch: (id: string) => api.delete(`/search/saved/${id}`),
  executeSavedSearch: (id: string, page?: number, pageSize?: number) =>
    api.post<{ results: SearchResult[]; totalResults: number; queryTimeMs: number }>(
      `/search/saved/${id}/execute`, { page, pageSize },
    ),

  // Recent searches
  getRecentSearches: (limit?: number) =>
    api.get<RecentSearch[]>('/search/recent', limit ? { limit } : undefined),
  recordSearch: (data: { query: string; entityTypes?: string[]; resultCount?: number; selectedResultId?: string; selectedResultType?: string }) =>
    api.post<RecentSearch>('/search/recent', data),
  clearRecentSearches: () => api.delete('/search/recent'),
};
