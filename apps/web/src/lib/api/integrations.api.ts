import { api } from './client';
import type { IntegrationsOverview } from '@sovereign/shared';

export const integrationsApi = {
  getStatus: () =>
    api.get<IntegrationsOverview>('/integrations/status'),

  getAuthorizeUrl: (provider: string) =>
    api.get<{ authorizeUrl: string }>(`/integrations/${provider.toLowerCase()}/authorize`),

  disconnect: (provider: string) =>
    api.delete(`/integrations/${provider.toLowerCase()}/disconnect`),

  connectPhone: (phoneNumber: string) =>
    api.post<null>('/integrations/phone/connect', { phoneNumber }),

  verifyPhone: (code: string) =>
    api.post<null>('/integrations/phone/verify', { code }),

  disconnectPhone: () =>
    api.delete('/integrations/phone/disconnect'),

  getMicrosoftCalendars: () =>
    api.get<{ id: string; name: string; primary: boolean }[]>('/integrations/microsoft/calendars'),

  getGoogleCalendars: () =>
    api.get<{ id: string; name: string; primary: boolean }[]>('/integrations/google/calendars'),

  getSlackChannels: () =>
    api.get<{ id: string; name: string }[]>('/integrations/slack/channels'),
};
