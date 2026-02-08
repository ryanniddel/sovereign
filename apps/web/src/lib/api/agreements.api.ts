import { api } from './client';
import type { Agreement } from '@sovereign/shared';

type AgreementQuery = {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
};

export const agreementsApi = {
  list: (params?: AgreementQuery) =>
    api.getPaginated<Agreement>('/agreements', params as Record<string, string | number>),

  get: (id: string) => api.get<Agreement>(`/agreements/${id}`),

  create: (data: { title: string; description: string; parties: string[]; agreedAt?: string; meetingId?: string }) =>
    api.post<Agreement>('/agreements', data),

  update: (id: string, data: { title?: string; description?: string; parties?: string[] }) =>
    api.patch<Agreement>(`/agreements/${id}`, data),

  supersede: (id: string, data: { title: string; description: string; parties: string[] }) =>
    api.post<Agreement>(`/agreements/${id}/supersede`, data),

  deactivate: (id: string) => api.post<Agreement>(`/agreements/${id}/deactivate`),

  delete: (id: string) => api.delete(`/agreements/${id}`),
};
