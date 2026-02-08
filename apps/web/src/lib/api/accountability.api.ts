import { api } from './client';
import type {
  AccountabilityScore, AccountabilityTrend, AccountabilityDashboard,
  Streak, Commitment, ActionItem,
} from '@sovereign/shared';

type ItemsFilter = 'overdue' | 'due-today' | 'upcoming';

type UnifiedItems = {
  items: Array<(Commitment | ActionItem) & { itemType: 'commitment' | 'actionItem' }>;
  counts: { commitments: number; actionItems: number; total: number };
};

export const accountabilityApi = {
  getScores: (params?: { startDate?: string; endDate?: string }) =>
    api.get<AccountabilityScore[]>('/accountability/scores', params),

  getStreaks: () => api.get<Streak[]>('/accountability/streaks'),

  getDashboard: () => api.get<AccountabilityDashboard>('/accountability/dashboard'),

  getTrends: (period?: '7d' | '30d' | '90d') =>
    api.get<AccountabilityTrend>('/accountability/trends', period ? { period } : undefined),

  getItems: (filter?: ItemsFilter) =>
    api.get<UnifiedItems>('/accountability/items', filter ? { filter } : undefined),

  detectOverdue: () =>
    api.post<{ commitmentsMarkedOverdue: number; actionItemsMarkedOverdue: number }>(
      '/accountability/detect-overdue',
    ),
};
