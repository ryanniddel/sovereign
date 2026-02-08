import { api } from './client';
import type { Briefing, BriefingType } from '@sovereign/shared';

export const briefingsApi = {
  list: (params?: { type?: BriefingType; date?: string }) =>
    api.get<Briefing[]>('/briefings', params),

  getLatestMorning: () => api.get<Briefing | null>('/briefings/morning/latest'),

  getLatestNightly: () => api.get<Briefing | null>('/briefings/nightly/latest'),

  generateMorning: () => api.post<Briefing>('/briefings/morning/generate'),

  generateNightly: () => api.post<Briefing>('/briefings/nightly/generate'),

  complete: (id: string) => api.post<Briefing>(`/briefings/${id}/complete`),
};
