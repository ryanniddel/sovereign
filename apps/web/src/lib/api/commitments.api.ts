import { api } from './client';
import type { Commitment, CommitmentStatus, Priority, OwnerType } from '@sovereign/shared';

type CommitmentQuery = {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
  status?: CommitmentStatus; priority?: Priority;
};

export const commitmentsApi = {
  list: (params?: CommitmentQuery) =>
    api.getPaginated<Commitment>('/commitments', params as Record<string, string | number>),

  get: (id: string) => api.get<Commitment>(`/commitments/${id}`),

  create: (data: {
    title: string; description?: string; ownerId: string; ownerType: OwnerType;
    dueDate: string; priority?: Priority; meetingId?: string;
    affectsScore?: boolean; escalationRuleId?: string;
  }) => api.post<Commitment>('/commitments', data),

  update: (id: string, data: { title?: string; description?: string; dueDate?: string; priority?: Priority }) =>
    api.patch<Commitment>(`/commitments/${id}`, data),

  complete: (id: string) => api.post<Commitment>(`/commitments/${id}/complete`),

  reschedule: (id: string, dueDate: string) =>
    api.post<Commitment>(`/commitments/${id}/reschedule`, { dueDate }),

  delegate: (id: string, data: { delegateToId: string; retainAccountability?: boolean }) =>
    api.post<Commitment>(`/commitments/${id}/delegate`, data),

  delete: (id: string) => api.delete(`/commitments/${id}`),
};
