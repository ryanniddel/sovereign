'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '@/lib/api/contacts.api';
import { toast } from 'sonner';

export function useContacts(params?: Parameters<typeof contactsApi.list>[0]) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.list(params),
  });
}

export function useContactSearch(q: string) {
  return useQuery({
    queryKey: ['contacts', 'search', q],
    queryFn: () => contactsApi.search(q),
    enabled: q.length >= 2,
    select: (res) => res.data,
  });
}

export function useContact(id: string) {
  return useQuery({
    queryKey: ['contacts', id],
    queryFn: () => contactsApi.get(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof contactsApi.update>[1]) =>
      contactsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateContactDisc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; discD: number; discI: number; discS: number; discC: number }) =>
      contactsApi.updateDisc(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('DISC profile updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
