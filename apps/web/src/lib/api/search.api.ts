import { api } from './client';

type SearchQuery = {
  q: string; page?: number; pageSize?: number;
  sortBy?: string; sortOrder?: string; entityTypes?: string[];
};

type SearchResult = {
  id: string; entityType: string; title: string;
  description?: string; url: string;
};

export const searchApi = {
  search: (params: SearchQuery) =>
    api.getPaginated<SearchResult>('/search', {
      ...params,
      entityTypes: params.entityTypes?.join(','),
    } as Record<string, string | number>),
};
