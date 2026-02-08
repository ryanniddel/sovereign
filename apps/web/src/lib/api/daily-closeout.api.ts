import { api } from './client';
import type { DailyCloseout, Commitment, ActionItem, Agreement } from '@sovereign/shared';

type ItemResolution = {
  itemId: string;
  itemType: 'commitment' | 'actionItem';
  resolution: 'completed' | 'rescheduled' | 'delegated';
  newDueDate?: string;
  delegateToId?: string;
};

type OpenItems = {
  commitments: Commitment[];
  actionItems: ActionItem[];
  activeAgreements: Agreement[];
};

export const dailyCloseoutApi = {
  initiate: () => api.post<DailyCloseout>('/daily-closeout/initiate'),

  getToday: () => api.get<DailyCloseout>('/daily-closeout/today'),

  getOpenItems: () => api.get<OpenItems>('/daily-closeout/today/open-items'),

  resolveItems: (resolutions: ItemResolution[]) =>
    api.post<DailyCloseout>('/daily-closeout/today/resolve', { resolutions }),

  reviewAgreements: (count: number) =>
    api.post<DailyCloseout>('/daily-closeout/today/review-agreements', { count }),

  complete: (reflectionNotes?: string) =>
    api.post<DailyCloseout>('/daily-closeout/today/complete', { reflectionNotes }),

  getHistory: (limit?: number) =>
    api.get<DailyCloseout[]>('/daily-closeout/history', limit ? { limit } : undefined),
};
