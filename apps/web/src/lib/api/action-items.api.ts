import { api } from './client';
import type { ActionItem, ActionItemStatus, Priority, OwnerType, ExternalSystem } from '@sovereign/shared';

type ActionItemQuery = {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
  status?: ActionItemStatus; priority?: Priority;
};

export const actionItemsApi = {
  list: (params?: ActionItemQuery) =>
    api.getPaginated<ActionItem>('/action-items', params as Record<string, string | number>),

  get: (id: string) => api.get<ActionItem>(`/action-items/${id}`),

  create: (data: {
    title: string; description?: string; ownerId: string; ownerType: OwnerType;
    dueDate: string; priority?: Priority; meetingId?: string;
    externalSystem?: ExternalSystem; externalSystemId?: string; escalationRuleId?: string;
  }) => api.post<ActionItem>('/action-items', data),

  update: (id: string, data: { title?: string; description?: string; dueDate?: string; priority?: Priority }) =>
    api.patch<ActionItem>(`/action-items/${id}`, data),

  complete: (id: string) => api.post<ActionItem>(`/action-items/${id}/complete`),

  reschedule: (id: string, dueDate: string) =>
    api.post<ActionItem>(`/action-items/${id}/reschedule`, { dueDate }),

  delegate: (id: string, delegateToId: string) =>
    api.post<ActionItem>(`/action-items/${id}/delegate`, { delegateToId }),

  delete: (id: string) => api.delete(`/action-items/${id}`),
};
