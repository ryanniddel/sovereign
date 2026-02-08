import { api } from './client';
import type { Meeting, MeetingParticipant, MeetingStatus, MeetingType, ParticipantRole } from '@sovereign/shared';

type MeetingQuery = {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
  status?: MeetingStatus; meetingType?: MeetingType;
};

type MeetingAnalytics = {
  totalMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  autoCancelledMeetings: number;
  totalCost: number;
  totalHoursInMeetings: number;
  averageRating: number | null;
  averageValueScore: number | null;
  meetingsRatedUnnecessary: number;
  meetingsByType: Record<string, number>;
  meetingsByStatus: Record<string, number>;
  qualificationRate: number;
  averageDurationMinutes: number;
  costPerMeeting: number;
};

type RecurringReview = {
  meetingId: string;
  title: string;
  totalOccurrences: number;
  averageRating: number | null;
  averageCost: number;
  totalCost: number;
  averageAttendance: number;
  percentRatedUnnecessary: number;
  recommendation: 'KEEP' | 'REVIEW' | 'CANCEL';
  reasonForRecommendation: string;
};

type ExtractedActionItem = { title: string; ownerEmail: string; dueDate?: string; confidence?: number };
type ExtractedCommitment = { title: string; ownerEmail: string; dueDate?: string; confidence?: number };
type ExtractedAgreement = { title: string; description: string; parties?: string[]; confidence?: number };
type DetectedContradiction = { newItem: string; existingAgreement: string; confidence?: number };

type RecapResult = {
  meeting: Meeting;
  created: { actionItems: number; commitments: number; agreements: number };
  contradictions: DetectedContradiction[];
};

export type { MeetingAnalytics, RecurringReview, RecapResult, DetectedContradiction };

export const meetingsApi = {
  // ── CRUD ──
  list: (params?: MeetingQuery) =>
    api.getPaginated<Meeting>('/meetings', params as Record<string, string | number>),

  get: (id: string) => api.get<Meeting>(`/meetings/${id}`),

  create: (data: {
    title: string; description?: string; purpose: string; decisionRequired?: string;
    estimatedDurationMinutes?: number; meetingType?: MeetingType;
    participantEmails?: string[]; agendaUrl?: string; preReadUrl?: string;
  }) => api.post<Meeting>('/meetings', data),

  update: (id: string, data: {
    title?: string; description?: string; purpose?: string;
    decisionRequired?: string; estimatedDurationMinutes?: number; meetingType?: MeetingType;
  }) => api.patch<Meeting>(`/meetings/${id}`, data),

  // ── Lifecycle transitions ──
  qualify: (id: string, data: { approved: boolean; qualifiedBy?: string; rejectionReason?: string }) =>
    api.post<Meeting>(`/meetings/${id}/qualify`, data),

  schedule: (id: string) => api.post<Meeting>(`/meetings/${id}/schedule`),

  reschedule: (id: string, data: { startTime: string; endTime: string; reason?: string; location?: string }) =>
    api.post<Meeting>(`/meetings/${id}/reschedule`, data),

  submitAgenda: (id: string, agendaUrl: string) =>
    api.post<Meeting>(`/meetings/${id}/agenda`, { agendaUrl }),

  distributePreRead: (id: string, data: { preReadUrl: string; deadline?: string }) =>
    api.post<Meeting>(`/meetings/${id}/pre-read`, data),

  start: (id: string) => api.post<Meeting>(`/meetings/${id}/start`),

  complete: (id: string) => api.post<Meeting>(`/meetings/${id}/complete`),

  cancel: (id: string) => api.post<Meeting>(`/meetings/${id}/cancel`),

  // ── Post-meeting ──
  rate: (id: string, data: { rating: number; valueScore?: number; wasNecessary?: boolean }) =>
    api.post<Meeting>(`/meetings/${id}/rate`, data),

  submitRecap: (id: string, data: {
    transcriptUrl?: string; recapContent?: string; actualDurationMinutes?: number;
    autoCreateItems?: boolean;
    actionItems?: ExtractedActionItem[]; commitments?: ExtractedCommitment[];
    agreements?: ExtractedAgreement[]; contradictions?: DetectedContradiction[];
  }) => api.post<RecapResult>(`/meetings/${id}/recap`, data),

  // ── Analytics ──
  getAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    api.get<MeetingAnalytics>('/meetings/analytics', params),

  getRecurringReviews: () =>
    api.get<RecurringReview[]>('/meetings/recurring-reviews'),

  // ── Participants ──
  addParticipant: (id: string, data: { email: string; name: string; role?: ParticipantRole; contactId?: string }) =>
    api.post<MeetingParticipant>(`/meetings/${id}/participants`, data),

  removeParticipant: (id: string, pid: string) =>
    api.delete(`/meetings/${id}/participants/${pid}`),

  acknowledgeParticipant: (id: string, pid: string) =>
    api.post<MeetingParticipant>(`/meetings/${id}/participants/${pid}/acknowledge`),
};
