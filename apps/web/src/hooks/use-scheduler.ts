'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulerApi } from '@/lib/api/scheduler.api';
import { toast } from 'sonner';
import type { ScheduledJobStatus } from '@sovereign/shared';

// ── Health ──

export function useSchedulerHealth() {
  return useQuery({
    queryKey: ['scheduler', 'health'],
    queryFn: () => schedulerApi.getHealth(),
    select: (res) => res.data,
    refetchInterval: 30_000,
  });
}

// ── Job history ──

export function useSchedulerHistory(params?: {
  jobName?: string;
  status?: ScheduledJobStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['scheduler', 'history', params],
    queryFn: () => schedulerApi.getHistory(params),
  });
}

// ── Trigger job ──

export function useTriggerJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: schedulerApi.triggerJob,
    onSuccess: (_data, jobName) => {
      qc.invalidateQueries({ queryKey: ['scheduler'] });
      toast.success(`Job "${jobName}" triggered`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
