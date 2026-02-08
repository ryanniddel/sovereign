import { api } from './client';
import type {
  SchedulerHealth, ScheduledJobRun, ScheduledJobStatus,
} from '@sovereign/shared';

type HistoryQuery = {
  jobName?: string;
  status?: ScheduledJobStatus;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

type HistoryStats = {
  successCount: number;
  failureCount: number;
  averageDurationMs: number;
  averageItemsProcessed: number;
};

export const schedulerApi = {
  getHealth: () =>
    api.get<SchedulerHealth>('/scheduler/health'),

  getHistory: (params?: HistoryQuery) =>
    api.getPaginated<ScheduledJobRun>('/scheduler/history', params as Record<string, string | number>).then(
      (res) => ({ ...res, stats: (res as unknown as { stats: HistoryStats }).stats }),
    ),

  triggerJob: (jobName: string) =>
    api.post<{ triggered: string; at: string }>(`/scheduler/trigger/${jobName}`),
};
