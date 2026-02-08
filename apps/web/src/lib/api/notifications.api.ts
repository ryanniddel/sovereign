import { api } from './client';
import type {
  Notification, NotificationPreference, NotificationStats,
  EscalationChannel, NotificationContext, NotificationCategory, Priority,
} from '@sovereign/shared';

type InboxQuery = {
  page?: number; pageSize?: number;
  category?: NotificationCategory; priority?: Priority;
  unreadOnly?: boolean;
};

export const notificationsApi = {
  // Inbox
  getInbox: (params?: InboxQuery) =>
    api.getPaginated<Notification>('/notifications/inbox', params as Record<string, string | number>),

  getUnreadCount: () =>
    api.get<{ total: number; byCategory: Record<string, number> }>('/notifications/unread-count'),

  getStats: (days?: number) =>
    api.get<NotificationStats>('/notifications/stats', days ? { days } : undefined),

  // Actions
  markRead: (id: string) => api.post<Notification>(`/notifications/${id}/read`),
  markAllRead: (category?: string) => api.post<{ markedRead: number }>('/notifications/mark-all-read', { category }),
  dismiss: (id: string) => api.post<Notification>(`/notifications/${id}/dismiss`),
  dismissAll: (category?: string) => api.post<{ dismissed: number }>('/notifications/dismiss-all', { category }),

  // Send (testing/internal)
  send: (data: { title: string; message: string; channel?: EscalationChannel; priority?: Priority }) =>
    api.post<Notification>('/notifications/send', data),

  // Preferences
  getPreferences: () => api.get<NotificationPreference[]>('/notifications/preferences'),
  updatePreference: (data: {
    channel: EscalationChannel; isEnabled?: boolean;
    context?: NotificationContext; priority?: Priority;
  }) => api.post<NotificationPreference>('/notifications/preferences', data),
  initializeDefaults: () => api.post<NotificationPreference[]>('/notifications/preferences/initialize', {}),

  // Cleanup
  cleanup: (days?: number) => api.delete(`/notifications/cleanup${days ? `?days=${days}` : ''}`),
};
