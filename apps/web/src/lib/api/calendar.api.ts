import { api } from './client';
import type { CalendarEvent, CalendarEventType, CalendarSource } from '@sovereign/shared';

type DateRangeQuery = { startDate?: string; endDate?: string };
type CalendarViewQuery = { date: string; endDate?: string };

export const calendarApi = {
  listEvents: (params?: DateRangeQuery) =>
    api.get<CalendarEvent[]>('/calendar/events', params),

  createEvent: (data: {
    title: string; description?: string; startTime: string; endTime: string;
    isAllDay?: boolean; location?: string; eventType?: CalendarEventType;
    isProtected?: boolean; recurrenceRule?: string; externalCalendarId?: string;
    source?: CalendarSource; meetingId?: string;
  }) => api.post<CalendarEvent>('/calendar/events', data),

  createFocusBlock: (data: { title: string; description?: string; startTime: string; endTime: string }) =>
    api.post<CalendarEvent>('/calendar/focus-blocks', data),

  updateEvent: (id: string, data: {
    title?: string; description?: string; startTime?: string; endTime?: string;
    isAllDay?: boolean; location?: string; eventType?: CalendarEventType;
    isProtected?: boolean; recurrenceRule?: string;
  }) => api.patch<CalendarEvent>(`/calendar/events/${id}`, data),

  deleteEvent: (id: string) => api.delete(`/calendar/events/${id}`),

  getDailyView: (params: CalendarViewQuery) =>
    api.get<unknown>('/calendar/views/daily', params),

  getWeeklyView: (params: CalendarViewQuery) =>
    api.get<unknown>('/calendar/views/weekly', params),

  getMonthlyView: (params: CalendarViewQuery) =>
    api.get<unknown>('/calendar/views/monthly', params),

  getQuarterlyView: (params: CalendarViewQuery) =>
    api.get<unknown>('/calendar/views/quarterly', params),

  getAgendaView: (params: CalendarViewQuery) =>
    api.get<unknown>('/calendar/views/agenda', params),

  getCommandCenter: () => api.get<unknown>('/calendar/command-center'),

  checkConflicts: (startTime: string, endTime: string) =>
    api.get<unknown>('/calendar/conflicts', { startTime, endTime }),

  getAvailableSlots: (date: string, durationMinutes?: number) =>
    api.get<unknown>('/calendar/available-slots', { date, durationMinutes }),
};
