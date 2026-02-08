import { api } from './client';
import type {
  FocusMode, FocusModeTrigger, CalendarEventType,
  FocusModeSession, FocusModeOverrideRequest, FocusModeAnalytics,
} from '@sovereign/shared';

type FocusModeInput = {
  name: string; description?: string;
  allowCriticalOnly?: boolean; allowMeetingPrep?: boolean; allowAll?: boolean;
  triggerType?: FocusModeTrigger; triggerCalendarEventType?: CalendarEventType;
  scheduleStartTime?: string; scheduleEndTime?: string; scheduleDays?: number[];
  autoDeactivateMinutes?: number; requires2faOverride?: boolean;
  color?: string; icon?: string;
};

type SessionQuery = {
  page?: number; pageSize?: number;
  focusModeId?: string; from?: string; to?: string;
};

export const focusModesApi = {
  // CRUD
  list: () => api.get<FocusMode[]>('/focus-modes'),
  get: (id: string) => api.get<FocusMode>(`/focus-modes/${id}`),
  create: (data: FocusModeInput) => api.post<FocusMode>('/focus-modes', data),
  update: (id: string, data: Partial<FocusModeInput>) => api.patch<FocusMode>(`/focus-modes/${id}`, data),
  delete: (id: string) => api.delete(`/focus-modes/${id}`),
  clone: (id: string) => api.post<FocusMode>(`/focus-modes/${id}/clone`, {}),
  seedDefaults: () => api.post<FocusMode[]>('/focus-modes/seed-defaults', {}),

  // Activation
  getActive: () => api.get<FocusMode | null>('/focus-modes/active'),
  activate: (id: string) => api.post<FocusMode>(`/focus-modes/${id}/activate`),
  deactivate: (id: string) => api.post<FocusMode>(`/focus-modes/${id}/deactivate`),

  // 2FA Override (Ulysses Contract)
  requestOverride: (id: string, data: { requesterEmail: string; reason: string }) =>
    api.post<{ id: string; status: string; expiresAt: string; message: string }>(
      `/focus-modes/${id}/request-override`, data,
    ),
  resolveOverride: (data: { overrideCode: string; resolverEmail?: string }) =>
    api.post<FocusModeOverrideRequest>('/focus-modes/resolve-override', data),
  rejectOverride: (focusModeId: string, overrideId: string) =>
    api.post<FocusModeOverrideRequest>(`/focus-modes/${focusModeId}/reject-override/${overrideId}`, {}),
  getPendingOverrides: () =>
    api.get<FocusModeOverrideRequest[]>('/focus-modes/overrides/pending'),

  // Sessions & analytics
  getSessions: (params?: SessionQuery) =>
    api.getPaginated<FocusModeSession>('/focus-modes/sessions', params as Record<string, string | number>),
  getModeSessions: (id: string, params?: SessionQuery) =>
    api.getPaginated<FocusModeSession>(`/focus-modes/${id}/sessions`, params as Record<string, string | number>),
  getAnalytics: (days?: number) =>
    api.get<FocusModeAnalytics>('/focus-modes/analytics', days ? { days } : undefined),
  getDigest: () => api.get<{ focusMode: FocusMode; suppressed: unknown[]; count: number }>('/focus-modes/active/digest'),

  // Triggers
  checkTriggers: () =>
    api.post<{ calendarResults: unknown[]; scheduleResults: unknown[] }>('/focus-modes/check-triggers', {}),
};
