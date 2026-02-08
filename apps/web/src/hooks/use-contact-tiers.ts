'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactTiersApi } from '@/lib/api/contact-tiers.api';
import { toast } from 'sonner';

export function useContactTiers() {
  return useQuery({
    queryKey: ['contact-tiers'],
    queryFn: () => contactTiersApi.list(),
    select: (res) => res.data,
  });
}

export function useCreateContactTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactTiersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-tiers'] });
      toast.success('Tier created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateContactTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof contactTiersApi.update>[1]) =>
      contactTiersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-tiers'] });
      toast.success('Tier updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteContactTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactTiersApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-tiers'] });
      toast.success('Tier deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
