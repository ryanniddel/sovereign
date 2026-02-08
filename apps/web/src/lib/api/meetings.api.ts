import { api } from './client';
import type { Meeting, MeetingParticipant, MeetingStatus, MeetingType, ParticipantRole } from '@sovereign/shared';

type MeetingQuery = {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
  status?: MeetingStatus; meetingType?: MeetingType;
};

export const meetingsApi = {
  list: (params?: MeetingQuery) =>
    api.getPaginated<Meeting>('/meetings', params as Record<string, string | number>),

  get: (id: string) => api.get<Meeting>(`/meetings/${id}`),

  create: (data: {
    title: string; description?: string; purpose: string; decisionRequired?: string;
    estimatedDurationMinutes?: number; meetingType?: MeetingType;
    participantEmails?: string[]; agendaUrl?: string; preReadUrl?: string;
  }) => api.post<Meeting>('/meetings', data),

  qualify: (id: string, data: { approved: boolean; qualifiedBy?: string; rejectionReason?: string }) =>
    api.post<Meeting>(`/meetings/${id}/qualify`, data),

  schedule: (id: string) => api.post<Meeting>(`/meetings/${id}/schedule`),

  submitAgenda: (id: string, agendaUrl: string) =>
    api.post<Meeting>(`/meetings/${id}/agenda`, { agendaUrl }),

  distributePreRead: (id: string, data: { preReadUrl: string; deadline?: string }) =>
    api.post<Meeting>(`/meetings/${id}/pre-read`, data),

  start: (id: string) => api.post<Meeting>(`/meetings/${id}/start`),

  complete: (id: string) => api.post<Meeting>(`/meetings/${id}/complete`),

  cancel: (id: string) => api.post<Meeting>(`/meetings/${id}/cancel`),

  rate: (id: string, data: { rating: number; valueScore?: number; wasNecessary?: boolean }) =>
    api.post<Meeting>(`/meetings/${id}/rate`, data),

  addParticipant: (id: string, data: { email: string; name: string; role?: ParticipantRole; contactId?: string }) =>
    api.post<MeetingParticipant>(`/meetings/${id}/participants`, data),

  removeParticipant: (id: string, pid: string) =>
    api.delete(`/meetings/${id}/participants/${pid}`),

  acknowledgeParticipant: (id: string, pid: string) =>
    api.post<MeetingParticipant>(`/meetings/${id}/participants/${pid}/acknowledge`),
};
