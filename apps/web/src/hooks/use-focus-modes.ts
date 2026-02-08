'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { focusModesApi } from '@/lib/api/focus-modes.api';
import { toast } from 'sonner';

// ── Queries ──

export function useFocusModes() {
  return useQuery({
    queryKey: ['focus-modes'],
    queryFn: () => focusModesApi.list(),
    select: (res) => res.data,
  });
}

export function useActiveFocusMode() {
  return useQuery({
    queryKey: ['focus-modes', 'active'],
    queryFn: () => focusModesApi.getActive(),
    select: (res) => res.data,
  });
}

export function useFocusMode(id: string) {
  return useQuery({
    queryKey: ['focus-modes', id],
    queryFn: () => focusModesApi.get(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useFocusModeAnalytics(days?: number) {
  return useQuery({
    queryKey: ['focus-modes', 'analytics', days],
    queryFn: () => focusModesApi.getAnalytics(days),
    select: (res) => res.data,
  });
}

export function useFocusModeSessions(params?: Parameters<typeof focusModesApi.getSessions>[0]) {
  return useQuery({
    queryKey: ['focus-modes', 'sessions', params],
    queryFn: () => focusModesApi.getSessions(params),
  });
}

export function usePendingOverrides() {
  return useQuery({
    queryKey: ['focus-modes', 'overrides', 'pending'],
    queryFn: () => focusModesApi.getPendingOverrides(),
    select: (res) => res.data,
    refetchInterval: 30_000,
  });
}

export function useSuppressedDigest() {
  return useQuery({
    queryKey: ['focus-modes', 'digest'],
    queryFn: () => focusModesApi.getDigest(),
    select: (res) => res.data,
  });
}

// ── Mutations ──

export function useCreateFocusMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: focusModesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Focus mode created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateFocusMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof focusModesApi.update>[1]) =>
      focusModesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Focus mode updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteFocusMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: focusModesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Focus mode deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCloneFocusMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: focusModesApi.clone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Focus mode cloned');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSeedDefaultFocusModes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: focusModesApi.seedDefaults,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Default focus modes created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useActivateFocusMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: focusModesApi.activate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Focus mode activated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeactivateFocusMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: focusModesApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Focus mode deactivated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── 2FA Override (Ulysses Contract) ──

export function useRequestOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; requesterEmail: string; reason: string }) =>
      focusModesApi.requestOverride(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Override request sent — check for the 6-digit code');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResolveOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: focusModesApi.resolveOverride,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Override approved — focus mode deactivated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRejectOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ focusModeId, overrideId }: { focusModeId: string; overrideId: string }) =>
      focusModesApi.rejectOverride(focusModeId, overrideId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Override request rejected');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCheckTriggers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: focusModesApi.checkTriggers,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Triggers checked');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
