'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search.api';
import { toast } from 'sonner';

// ── Universal search ──

export function useSearch(params: {
  q: string;
  page?: number;
  pageSize?: number;
  entityTypes?: string[];
  status?: string;
  priority?: string;
  from?: string;
  to?: string;
  grouped?: boolean;
}) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchApi.search(params),
    enabled: params.q.length >= 2,
    select: (res) => res.data,
  });
}

// ── Quick search (command palette) ──

export function useQuickSearch(q: string) {
  return useQuery({
    queryKey: ['search', 'quick', q],
    queryFn: () => searchApi.quickSearch(q),
    enabled: q.length >= 2,
    select: (res) => res.data,
    staleTime: 10_000,
  });
}

// ── Suggestions ──

export function useSearchSuggestions(q: string) {
  return useQuery({
    queryKey: ['search', 'suggestions', q],
    queryFn: () => searchApi.getSuggestions(q),
    enabled: q.length >= 1,
    select: (res) => res.data,
    staleTime: 15_000,
  });
}

// ── Saved searches ──

export function useSavedSearches() {
  return useQuery({
    queryKey: ['search', 'saved'],
    queryFn: () => searchApi.getSavedSearches(),
    select: (res) => res.data,
  });
}

export function useCreateSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: searchApi.createSavedSearch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['search', 'saved'] });
      toast.success('Search saved');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof searchApi.updateSavedSearch>[1]) =>
      searchApi.updateSavedSearch(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['search', 'saved'] });
      toast.success('Saved search updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSavedSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: searchApi.deleteSavedSearch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['search', 'saved'] });
      toast.success('Saved search deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useExecuteSavedSearch() {
  return useMutation({
    mutationFn: ({ id, page, pageSize }: { id: string; page?: number; pageSize?: number }) =>
      searchApi.executeSavedSearch(id, page, pageSize),
  });
}

// ── Recent searches ──

export function useRecentSearches(limit?: number) {
  return useQuery({
    queryKey: ['search', 'recent', limit],
    queryFn: () => searchApi.getRecentSearches(limit),
    select: (res) => res.data,
  });
}

export function useRecordSearch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: searchApi.recordSearch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['search', 'recent'] });
    },
  });
}

export function useClearRecentSearches() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: searchApi.clearRecentSearches,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['search', 'recent'] });
      toast.success('Recent searches cleared');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
