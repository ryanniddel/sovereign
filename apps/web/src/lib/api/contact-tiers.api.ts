import { api } from './client';
import type { ContactTier } from '@sovereign/shared';

export const contactTiersApi = {
  list: () => api.get<ContactTier[]>('/contact-tiers'),

  create: (data: {
    name: string; priority?: number; escalationDelayMinutes?: number;
    calendarAccessLevel?: string; communicationPriority?: string;
  }) => api.post<ContactTier>('/contact-tiers', data),

  update: (id: string, data: {
    name?: string; priority?: number; escalationDelayMinutes?: number;
    calendarAccessLevel?: string; communicationPriority?: string;
  }) => api.patch<ContactTier>(`/contact-tiers/${id}`, data),

  delete: (id: string) => api.delete(`/contact-tiers/${id}`),
};
