import { api } from './client';
import type { AccountabilityScore, Streak } from '@sovereign/shared';

export const accountabilityApi = {
  getScores: (params?: { startDate?: string; endDate?: string }) =>
    api.get<AccountabilityScore[]>('/accountability/scores', params),

  getStreaks: () => api.get<Streak[]>('/accountability/streaks'),

  getDashboard: () => api.get<{
    scores: AccountabilityScore[];
    streaks: Streak[];
    summary: { totalCommitments: number; delivered: number; missed: number; onTimeRate: number };
  }>('/accountability/dashboard'),
};
