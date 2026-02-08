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

export function useLatestMorningBriefing() {
  return useQuery({
    queryKey: ['briefings', 'morning', 'latest'],
    queryFn: () => briefingsApi.getLatestMorning(),
    select: (res) => res.data,
  });
}

export function useLatestNightlyBriefing() {
  return useQuery({
    queryKey: ['briefings', 'nightly', 'latest'],
    queryFn: () => briefingsApi.getLatestNightly(),
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
