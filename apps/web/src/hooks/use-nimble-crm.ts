'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nimbleCrmApi } from '@/lib/api/nimble-crm.api';
import { toast } from 'sonner';

export function useNimbleCrmStatus() {
  return useQuery({
    queryKey: ['nimble-crm', 'status'],
    queryFn: () => nimbleCrmApi.getStatus(),
    select: (res) => res.data,
  });
}

export function useMappedContacts() {
  return useQuery({
    queryKey: ['nimble-crm', 'contacts'],
    queryFn: () => nimbleCrmApi.getMappedContacts(),
    select: (res) => res.data,
  });
}

export function useConnectNimbleCrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nimbleCrmApi.connect,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nimble-crm'] });
      toast.success('Nimble CRM connected');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDisconnectNimbleCrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nimbleCrmApi.disconnect,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nimble-crm'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Nimble CRM disconnected');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSyncNimbleCrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nimbleCrmApi.sync,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['nimble-crm'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(res.data.message);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePushContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nimbleCrmApi.pushContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nimble-crm'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact pushed to Nimble');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePullContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: nimbleCrmApi.pullContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nimble-crm'] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact pulled from Nimble');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
