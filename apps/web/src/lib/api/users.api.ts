import { api } from './client';
import type { User } from '@sovereign/shared';

export const usersApi = {
  getMe: () => api.get<User>('/users/me'),

  updateMe: (data: { name?: string; timezone?: string; avatarUrl?: string; defaultHourlyRate?: number }) =>
    api.patch<User>('/users/me', data),

  updatePsychometrics: (data: {
    discD?: number; discI?: number; discS?: number; discC?: number;
    kolbeProfile?: string; mbtiType?: string; enneagramType?: number;
    bigFiveOpenness?: number; bigFiveConscientiousness?: number;
    bigFiveExtraversion?: number; bigFiveAgreeableness?: number; bigFiveNeuroticism?: number;
  }) => api.patch<User>('/users/me/psychometrics', data),

  updateWorkingHours: (data: { workingHoursStart: string; workingHoursEnd: string }) =>
    api.patch<User>('/users/me/working-hours', data),

  updateBriefingPreferences: (data: { morningBriefingTime: string; nightlyReviewTime: string }) =>
    api.patch<User>('/users/me/briefing-preferences', data),
};
