'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { briefingsApi } from '@/lib/api/briefings.api';
import { toast } from 'sonner';
export function useBriefings(params?: Parameters<typeof briefingsApi.list>[0]) {
  return useQuery({
    queryKey: ['briefings', params],
    queryFn: () => briefingsApi.list(params),
    select: (res) => res.data,
  });
}

export function useTodayBriefings() {
  return useQuery({
    queryKey: ['briefings', 'today'],
    queryFn: () => briefingsApi.getToday(),
    select: (res) => res.data,
  });
}

export function useBriefingEngagement(days?: number) {
  return useQuery({
    queryKey: ['briefings', 'engagement', days],
    queryFn: () => briefingsApi.getEngagement(days),
    select: (res) => res.data,
  });
}

export function useBriefingPreferences() {
  return useQuery({
    queryKey: ['briefings', 'preferences'],
    queryFn: () => briefingsApi.getPreferences(),
    select: (res) => res.data,
  });
}

export function useUpdateBriefingPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => briefingsApi.updatePreferences(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefings', 'preferences'] });
      toast.success('Briefing preferences updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useLatestMorningBriefing() {
  return useQuery({
    queryKey: ['briefings', 'morning', 'latest'],
    queryFn: () => briefingsApi.getLatestMorning(),
    select: (res) => res.data,
    retry: (count, err) => {
      // Don't retry 404s (no briefing yet)
      if (err && 'status' in err && (err as { status: number }).status === 404) return false;
      return count < 2;
    },
  });
}

export function useLatestNightlyBriefing() {
  return useQuery({
    queryKey: ['briefings', 'nightly', 'latest'],
    queryFn: () => briefingsApi.getLatestNightly(),
    select: (res) => res.data,
    retry: (count, err) => {
      if (err && 'status' in err && (err as { status: number }).status === 404) return false;
      return count < 2;
    },
  });
}

export function useMorningForDate(date: string) {
  return useQuery({
    queryKey: ['briefings', 'morning', date],
    queryFn: () => briefingsApi.getMorningForDate(date),
    enabled: !!date,
    select: (res) => res.data,
  });
}

export function useNightlyForDate(date: string) {
  return useQuery({
    queryKey: ['briefings', 'nightly', date],
    queryFn: () => briefingsApi.getNightlyForDate(date),
    enabled: !!date,
    select: (res) => res.data,
  });
}

export function useGenerateMorningBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: briefingsApi.generateMorning,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefings'] });
      toast.success('Morning briefing generated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGenerateNightlyBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: briefingsApi.generateNightly,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefings'] });
      toast.success('Nightly review generated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMarkBriefingRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: briefingsApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefings'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompleteBriefing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: briefingsApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefings'] });
      toast.success('Briefing completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmitBriefingFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rating, notes }: { id: string; rating: number; notes?: string }) =>
      briefingsApi.submitFeedback(id, { rating, notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['briefings'] });
      toast.success('Feedback submitted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
