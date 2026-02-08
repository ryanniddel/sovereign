'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { actionItemsApi } from '@/lib/api/action-items.api';
import { toast } from 'sonner';

export function useActionItems(params?: Parameters<typeof actionItemsApi.list>[0]) {
  return useQuery({
    queryKey: ['action-items', params],
    queryFn: () => actionItemsApi.list(params),
  });
}

export function useActionItem(id: string) {
  return useQuery({
    queryKey: ['action-items', id],
    queryFn: () => actionItemsApi.get(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useCreateActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actionItemsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-items'] });
      toast.success('Action item created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof actionItemsApi.update>[1]) =>
      actionItemsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-items'] });
      toast.success('Action item updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompleteActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actionItemsApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-items'] });
      qc.invalidateQueries({ queryKey: ['accountability'] });
      toast.success('Action item completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRescheduleActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) =>
      actionItemsApi.reschedule(id, dueDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-items'] });
      toast.success('Action item rescheduled');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDelegateActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delegateToId }: { id: string; delegateToId: string }) =>
      actionItemsApi.delegate(id, delegateToId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-items'] });
      toast.success('Action item delegated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteActionItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actionItemsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['action-items'] });
      toast.success('Action item deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
