import { api } from './client';
import type { NimbleSyncStatus, NimbleSyncResult, Contact } from '@sovereign/shared';

export const nimbleCrmApi = {
  getStatus: () => api.get<NimbleSyncStatus>('/nimble-crm/status'),

  connect: (data: { apiKey: string; accountId?: string }) =>
    api.post<{ message: string }>('/nimble-crm/connect', data),

  disconnect: () => api.delete<{ message: string }>('/nimble-crm/disconnect'),

  sync: (direction: 'inbound' | 'outbound' | 'both' = 'both') =>
    api.post<NimbleSyncResult>('/nimble-crm/sync', { direction }),

  getMappedContacts: () => api.get<Contact[]>('/nimble-crm/contacts'),

  pushContact: (contactId: string) =>
    api.post<{ message: string }>(`/nimble-crm/push/${contactId}`),

  pullContact: (nimbleCrmId: string) =>
    api.post<{ message: string }>(`/nimble-crm/pull/${nimbleCrmId}`),
};
