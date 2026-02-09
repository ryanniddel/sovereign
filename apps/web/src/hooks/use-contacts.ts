'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi } from '@/lib/api/contacts.api';
import { toast } from 'sonner';
import type { RelationshipBoostType } from '@sovereign/shared';

export function useContacts(params?: Parameters<typeof contactsApi.list>[0]) {
  return useQuery({
    queryKey: ['contacts', params],
    queryFn: () => contactsApi.list(params),
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

export function useContactMeetingContext(id: string) {
  return useQuery({
    queryKey: ['contacts', id, 'meeting-context'],
    queryFn: () => contactsApi.getMeetingContext(id),
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

export function useBulkImportContacts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: contactsApi.bulkImport,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`Imported ${res.data.length} contacts`);
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

export function useAssignContactTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tierId }: { id: string; tierId: string }) =>
      contactsApi.updateTier(id, tierId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Tier assigned');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBoostRelationshipScore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, interactionType }: { id: string; interactionType: RelationshipBoostType }) =>
      contactsApi.boostScore(id, interactionType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Relationship score boosted');
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
