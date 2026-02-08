import { api } from './client';
import type {
  CalendarEvent, CalendarEventType, CalendarSource,
  CalendarProtectionRule, CalendarSyncConfig, CalendarSyncLog,
  DailyViewResponse, WeeklyViewResponse, MonthlyViewResponse,
  QuarterlyViewResponse, ConflictResult,
  ProtectionRuleType, SyncDirection,
} from '@sovereign/shared';

type DateRangeQuery = { startDate?: string; endDate?: string };
type CalendarViewQuery = { date: string; endDate?: string };

type ConflictCheckResult = {
  hasConflicts: boolean;
  hardConflicts: number;
  softConflicts: number;
  travelConflicts: number;
  protectionViolations: number;
  conflicts: ConflictResult[];
};

type CommandCenterData = {
  today: CalendarEvent[];
  thisWeek: CalendarEvent[];
  upcomingMeetings: CalendarEvent[];
  conflicts: ConflictResult[];
  totals: { today: number; thisWeek: number; meetings: number; conflicts: number };
};

type AvailableSlot = { start: string; end: string };

export const calendarApi = {
  // ── Events ──
  listEvents: (params?: DateRangeQuery) =>
    api.get<CalendarEvent[]>('/calendar/events', params),

  getEvent: (id: string) =>
    api.get<CalendarEvent>(`/calendar/events/${id}`),

  createEvent: (data: {
    title: string; description?: string; startTime: string; endTime: string;
    isAllDay?: boolean; location?: string; eventType?: CalendarEventType;
    isProtected?: boolean; recurrenceRule?: string;
    travelBufferMinutes?: number; bufferBeforeMinutes?: number; bufferAfterMinutes?: number;
    externalCalendarId?: string; source?: CalendarSource; meetingId?: string;
  }) => api.post<CalendarEvent>('/calendar/events', data),

  createFocusBlock: (data: { title: string; description?: string; startTime: string; endTime: string }) =>
    api.post<CalendarEvent>('/calendar/focus-blocks', data),

  updateEvent: (id: string, data: {
    title?: string; description?: string; startTime?: string; endTime?: string;
    isAllDay?: boolean; location?: string; eventType?: CalendarEventType;
    isProtected?: boolean; recurrenceRule?: string;
  }) => api.patch<CalendarEvent>(`/calendar/events/${id}`, data),

  deleteEvent: (id: string) => api.delete(`/calendar/events/${id}`),

  // ── Views ──
  getDailyView: (params: CalendarViewQuery) =>
    api.get<DailyViewResponse>('/calendar/views/daily', params),

  getWeeklyView: (params: CalendarViewQuery) =>
    api.get<WeeklyViewResponse>('/calendar/views/weekly', params),

  getMonthlyView: (params: CalendarViewQuery) =>
    api.get<MonthlyViewResponse>('/calendar/views/monthly', params),

  getQuarterlyView: (params: CalendarViewQuery) =>
    api.get<QuarterlyViewResponse>('/calendar/views/quarterly', params),

  getAgendaView: (params: CalendarViewQuery) =>
    api.get<CalendarEvent[]>('/calendar/views/agenda', params),

  getCommandCenter: () =>
    api.get<CommandCenterData>('/calendar/command-center'),

  // ── Conflicts & Availability ──
  checkConflicts: (startTime: string, endTime: string, excludeEventId?: string) =>
    api.get<ConflictCheckResult>('/calendar/conflicts', { startTime, endTime, excludeEventId }),

  getAvailableSlots: (date: string, durationMinutes?: number) =>
    api.get<AvailableSlot[]>('/calendar/available-slots', { date, durationMinutes }),

  // ── Protection Rules ──
  getProtectionRules: () =>
    api.get<CalendarProtectionRule[]>('/calendar/protection-rules'),

  getProtectionRule: (id: string) =>
    api.get<CalendarProtectionRule>(`/calendar/protection-rules/${id}`),

  createProtectionRule: (data: {
    name: string; type: ProtectionRuleType; isActive?: boolean;
    startTime?: string; endTime?: string; daysOfWeek?: number[];
    bufferMinutes?: number; maxCount?: number; requires2faOverride?: boolean;
  }) => api.post<CalendarProtectionRule>('/calendar/protection-rules', data),

  updateProtectionRule: (id: string, data: {
    name?: string; isActive?: boolean;
    startTime?: string; endTime?: string; daysOfWeek?: number[];
    bufferMinutes?: number; maxCount?: number; requires2faOverride?: boolean;
  }) => api.patch<CalendarProtectionRule>(`/calendar/protection-rules/${id}`, data),

  deleteProtectionRule: (id: string) =>
    api.delete(`/calendar/protection-rules/${id}`),

  // ── Sync Configs ──
  getSyncConfigs: () =>
    api.get<CalendarSyncConfig[]>('/calendar/sync-configs'),

  getSyncConfig: (id: string) =>
    api.get<CalendarSyncConfig>(`/calendar/sync-configs/${id}`),

  createSyncConfig: (data: {
    source: CalendarSource; direction?: SyncDirection;
    externalAccountId?: string; externalCalendarId?: string; externalCalendarName?: string;
    sovereignWins?: boolean; importAsEventType?: CalendarEventType;
    autoImportNewEvents?: boolean; syncIntervalMinutes?: number;
  }) => api.post<CalendarSyncConfig>('/calendar/sync-configs', data),

  updateSyncConfig: (id: string, data: {
    direction?: SyncDirection; sovereignWins?: boolean;
    importAsEventType?: CalendarEventType; autoImportNewEvents?: boolean;
    syncIntervalMinutes?: number;
  }) => api.patch<CalendarSyncConfig>(`/calendar/sync-configs/${id}`, data),

  deleteSyncConfig: (id: string) =>
    api.delete(`/calendar/sync-configs/${id}`),

  getSyncLogs: (id: string) =>
    api.get<CalendarSyncLog[]>(`/calendar/sync-configs/${id}/logs`),
};
