import { api } from './client';
import type { DailyCloseout } from '@sovereign/shared';

type ItemResolution = {
  itemId: string;
  itemType: 'commitment' | 'actionItem';
  resolution: 'completed' | 'rescheduled' | 'delegated';
  newDueDate?: string;
  delegateToId?: string;
};

export const dailyCloseoutApi = {
  initiate: () => api.post<DailyCloseout>('/daily-closeout/initiate'),

  getToday: () => api.get<DailyCloseout>('/daily-closeout/today'),

  getOpenItems: () => api.get<unknown[]>('/daily-closeout/today/open-items'),

  resolveItems: (resolutions: ItemResolution[]) =>
    api.post<DailyCloseout>('/daily-closeout/today/resolve', { resolutions }),

  complete: (reflectionNotes?: string) =>
    api.post<DailyCloseout>('/daily-closeout/today/complete', { reflectionNotes }),
};
