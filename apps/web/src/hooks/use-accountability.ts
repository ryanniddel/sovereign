'use client';

import { useQuery } from '@tanstack/react-query';
import { accountabilityApi } from '@/lib/api/accountability.api';

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
