import { api } from './client';
import type { FocusMode, FocusModeTrigger, CalendarEventType } from '@sovereign/shared';

export const focusModesApi = {
  list: () => api.get<FocusMode[]>('/focus-modes'),

  getActive: () => api.get<FocusMode | null>('/focus-modes/active'),

  get: (id: string) => api.get<FocusMode>(`/focus-modes/${id}`),

  create: (data: {
    name: string; description?: string; allowCriticalOnly?: boolean;
    allowMeetingPrep?: boolean; allowAll?: boolean; triggerType?: FocusModeTrigger;
    triggerCalendarEventType?: CalendarEventType; requires2faOverride?: boolean;
  }) => api.post<FocusMode>('/focus-modes', data),

  update: (id: string, data: {
    name?: string; description?: string; allowCriticalOnly?: boolean;
    allowMeetingPrep?: boolean; allowAll?: boolean; triggerType?: FocusModeTrigger;
    triggerCalendarEventType?: CalendarEventType; requires2faOverride?: boolean;
  }) => api.patch<FocusMode>(`/focus-modes/${id}`, data),

  activate: (id: string) => api.post<FocusMode>(`/focus-modes/${id}/activate`),

  deactivate: (id: string) => api.post<FocusMode>(`/focus-modes/${id}/deactivate`),

  override: (id: string, confirmationCode: string) =>
    api.post<FocusMode>(`/focus-modes/${id}/override`, { confirmationCode }),

  delete: (id: string) => api.delete(`/focus-modes/${id}`),
};
