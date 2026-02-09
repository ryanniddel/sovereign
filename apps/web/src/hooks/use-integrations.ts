'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { integrationsApi } from '@/lib/api/integrations.api';
import { toast } from 'sonner';

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: ['integrations', 'status'],
    queryFn: () => integrationsApi.getStatus(),
    select: (res) => res.data,
  });
}

export function useConnectIntegration() {
  return useMutation({
    mutationFn: async (provider: string) => {
      const res = await integrationsApi.getAuthorizeUrl(provider);
      window.location.href = res.data.authorizeUrl;
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDisconnectIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (provider: string) => integrationsApi.disconnect(provider),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Integration disconnected');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useConnectPhone() {
  return useMutation({
    mutationFn: (phoneNumber: string) => integrationsApi.connectPhone(phoneNumber),
    onSuccess: () => toast.success('Verification code sent'),
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useVerifyPhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => integrationsApi.verifyPhone(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Phone verified successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDisconnectPhone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => integrationsApi.disconnectPhone(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['integrations'] });
      toast.success('Phone disconnected');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMicrosoftCalendars(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'microsoft', 'calendars'],
    queryFn: () => integrationsApi.getMicrosoftCalendars(),
    select: (res) => res.data,
    enabled,
  });
}

export function useGoogleCalendars(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'google', 'calendars'],
    queryFn: () => integrationsApi.getGoogleCalendars(),
    select: (res) => res.data,
    enabled,
  });
}

export function useSlackChannels(enabled: boolean) {
  return useQuery({
    queryKey: ['integrations', 'slack', 'channels'],
    queryFn: () => integrationsApi.getSlackChannels(),
    select: (res) => res.data,
    enabled,
  });
}
