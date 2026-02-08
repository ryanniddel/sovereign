'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { focusModesApi } from '@/lib/api/focus-modes.api';
import { toast } from 'sonner';

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

export function useOverrideFocusMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmationCode }: { id: string; confirmationCode: string }) =>
      focusModesApi.override(id, confirmationCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-modes'] });
      toast.success('Focus mode overridden');
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
