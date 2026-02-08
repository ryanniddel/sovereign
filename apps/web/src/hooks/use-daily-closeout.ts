'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyCloseoutApi } from '@/lib/api/daily-closeout.api';
import { toast } from 'sonner';

export function useTodayCloseout() {
  return useQuery({
    queryKey: ['daily-closeout', 'today'],
    queryFn: () => dailyCloseoutApi.getToday(),
    select: (res) => res.data,
  });
}

export function useOpenItems() {
  return useQuery({
    queryKey: ['daily-closeout', 'open-items'],
    queryFn: () => dailyCloseoutApi.getOpenItems(),
    select: (res) => res.data,
  });
}

export function useCloseoutHistory(limit?: number) {
  return useQuery({
    queryKey: ['daily-closeout', 'history', limit],
    queryFn: () => dailyCloseoutApi.getHistory(limit),
    select: (res) => res.data,
  });
}

export function useInitiateCloseout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dailyCloseoutApi.initiate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-closeout'] });
      toast.success('Closeout initiated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResolveItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dailyCloseoutApi.resolveItems,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-closeout'] });
      toast.success('Items resolved');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReviewAgreements() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dailyCloseoutApi.reviewAgreements,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-closeout'] });
      toast.success('Agreements reviewed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompleteCloseout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dailyCloseoutApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-closeout'] });
      qc.invalidateQueries({ queryKey: ['accountability'] });
      toast.success('Daily closeout completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
