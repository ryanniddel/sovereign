'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountabilityApi } from '@/lib/api/accountability.api';
import { toast } from 'sonner';

export function useAccountabilityScores(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['accountability', 'scores', params],
    queryFn: () => accountabilityApi.getScores(params),
    select: (res) => res.data,
  });
}

export function useAccountabilityStreaks() {
  return useQuery({
    queryKey: ['accountability', 'streaks'],
    queryFn: () => accountabilityApi.getStreaks(),
    select: (res) => res.data,
  });
}

export function useAccountabilityDashboard() {
  return useQuery({
    queryKey: ['accountability', 'dashboard'],
    queryFn: () => accountabilityApi.getDashboard(),
    select: (res) => res.data,
  });
}

export function useAccountabilityTrends(period?: '7d' | '30d' | '90d') {
  return useQuery({
    queryKey: ['accountability', 'trends', period],
    queryFn: () => accountabilityApi.getTrends(period),
    select: (res) => res.data,
  });
}

export function useAccountabilityItems(filter?: 'overdue' | 'due-today' | 'upcoming') {
  return useQuery({
    queryKey: ['accountability', 'items', filter],
    queryFn: () => accountabilityApi.getItems(filter),
    select: (res) => res.data,
  });
}

export function useDetectOverdue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountabilityApi.detectOverdue,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['accountability'] });
      qc.invalidateQueries({ queryKey: ['commitments'] });
      qc.invalidateQueries({ queryKey: ['action-items'] });
      const data = res.data;
      toast.success(`Marked ${data.commitmentsMarkedOverdue} commitments and ${data.actionItemsMarkedOverdue} action items as overdue`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
