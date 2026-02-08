'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commitmentsApi } from '@/lib/api/commitments.api';
import { toast } from 'sonner';

export function useCommitments(params?: Parameters<typeof commitmentsApi.list>[0]) {
  return useQuery({
    queryKey: ['commitments', params],
    queryFn: () => commitmentsApi.list(params),
  });
}

export function useCommitment(id: string) {
  return useQuery({
    queryKey: ['commitments', id],
    queryFn: () => commitmentsApi.get(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useCreateCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: commitmentsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commitments'] });
      toast.success('Commitment created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof commitmentsApi.update>[1]) =>
      commitmentsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commitments'] });
      toast.success('Commitment updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompleteCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: commitmentsApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commitments'] });
      qc.invalidateQueries({ queryKey: ['accountability'] });
      toast.success('Commitment completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRescheduleCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) =>
      commitmentsApi.reschedule(id, dueDate),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commitments'] });
      toast.success('Commitment rescheduled');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDelegateCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; delegateToId: string; retainAccountability?: boolean }) =>
      commitmentsApi.delegate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commitments'] });
      toast.success('Commitment delegated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCommitment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: commitmentsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['commitments'] });
      toast.success('Commitment deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
