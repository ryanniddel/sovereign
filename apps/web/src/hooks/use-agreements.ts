'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agreementsApi } from '@/lib/api/agreements.api';
import { toast } from 'sonner';

export function useAgreements(params?: Parameters<typeof agreementsApi.list>[0]) {
  return useQuery({
    queryKey: ['agreements', params],
    queryFn: () => agreementsApi.list(params),
  });
}

export function useAgreement(id: string) {
  return useQuery({
    queryKey: ['agreements', id],
    queryFn: () => agreementsApi.get(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useCreateAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agreementsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof agreementsApi.update>[1]) =>
      agreementsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSupersedeAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title: string; description: string; parties: string[] }) =>
      agreementsApi.supersede(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement superseded');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeactivateAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agreementsApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deactivated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: agreementsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreements'] });
      toast.success('Agreement deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
