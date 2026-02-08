import { api } from './client';
import type { NotificationPreference, EscalationChannel, NotificationContext, Priority } from '@sovereign/shared';

export const notificationsApi = {
  getPreferences: () => api.get<NotificationPreference[]>('/notifications/preferences'),

  updatePreference: (data: {
    channel: EscalationChannel; isEnabled?: boolean;
    context?: NotificationContext; priority?: Priority;
  }) => api.post<NotificationPreference>('/notifications/preferences', data),
};
