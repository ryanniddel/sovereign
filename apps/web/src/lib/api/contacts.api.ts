import { api } from './client';
import type { Contact, ContactMeetingContext, RelationshipBoostType } from '@sovereign/shared';

type ContactQuery = {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
  tierId?: string; company?: string; search?: string;
};

export const contactsApi = {
  list: (params?: ContactQuery) => api.getPaginated<Contact>('/contacts', params as Record<string, string | number>),

  search: (q: string) => api.get<Contact[]>('/contacts/search', { q }),

  get: (id: string) => api.get<Contact>(`/contacts/${id}`),

  create: (data: {
    email: string; name: string; phone?: string; company?: string;
    title?: string; tierId?: string; nimbleCrmId?: string;
  }) => api.post<Contact>('/contacts', data),

  bulkImport: (contacts: Array<{ email: string; name: string; phone?: string; company?: string; title?: string; tierId?: string }>) =>
    api.post<Contact[]>('/contacts/bulk-import', { contacts }),

  update: (id: string, data: {
    email?: string; name?: string; phone?: string; company?: string;
    title?: string; tierId?: string; nimbleCrmId?: string;
  }) => api.patch<Contact>(`/contacts/${id}`, data),

  updateDisc: (id: string, data: { discD: number; discI: number; discS: number; discC: number }) =>
    api.patch<Contact>(`/contacts/${id}/disc`, data),

  updateTier: (id: string, tierId: string) =>
    api.patch<Contact>(`/contacts/${id}/tier`, { tierId }),

  delete: (id: string) => api.delete(`/contacts/${id}`),

  getMeetingContext: (id: string) =>
    api.get<ContactMeetingContext>(`/contacts/${id}/meeting-context`),

  boostScore: (id: string, interactionType: RelationshipBoostType) =>
    api.post<Contact>(`/contacts/${id}/boost-score`, { interactionType }),

  enrichFromEmail: (email: string) =>
    api.post<Contact>('/contacts/enrich-from-email', { email }),
};
