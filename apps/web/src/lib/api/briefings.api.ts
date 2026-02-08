import { api } from './client';
import type { Briefing, BriefingType, BriefingPreference } from '@sovereign/shared';

export interface BriefingEngagementStats {
  total: number;
  readRate: number;
  completionRate: number;
  averageRating: number;
  ratingsCount: number;
  byType: {
    morning: { total: number; read: number; completed: number };
    nightly: { total: number; read: number; completed: number };
  };
}

export interface TodayBriefings {
  morning: Briefing | null;
  nightly: Briefing | null;
}

export const briefingsApi = {
  list: (params?: { type?: BriefingType; date?: string }) =>
    api.get<Briefing[]>('/briefings', params),

  getToday: () => api.get<TodayBriefings>('/briefings/today'),

  getEngagement: (days?: number) =>
    api.get<BriefingEngagementStats>('/briefings/engagement', days ? { days } : undefined),

  getPreferences: () => api.get<BriefingPreference>('/briefings/preferences'),

  updatePreferences: (data: Record<string, unknown>) =>
    api.patch<BriefingPreference>('/briefings/preferences', data),

  getLatestMorning: () => api.get<Briefing>('/briefings/morning/latest'),

  getMorningForDate: (date: string) => api.get<Briefing>(`/briefings/morning/${date}`),

  generateMorning: () => api.post<Briefing>('/briefings/morning/generate'),

  getLatestNightly: () => api.get<Briefing>('/briefings/nightly/latest'),

  getNightlyForDate: (date: string) => api.get<Briefing>(`/briefings/nightly/${date}`),

  generateNightly: () => api.post<Briefing>('/briefings/nightly/generate'),

  markRead: (id: string) => api.post<Briefing>(`/briefings/${id}/read`),

  complete: (id: string) => api.post<Briefing>(`/briefings/${id}/complete`),

  submitFeedback: (id: string, data: { rating: number; notes?: string }) =>
    api.post<Briefing>(`/briefings/${id}/feedback`, data),
};
