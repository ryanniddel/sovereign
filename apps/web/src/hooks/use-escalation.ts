'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escalationApi } from '@/lib/api/escalation.api';
import { toast } from 'sonner';

export function useEscalationRules(params?: Parameters<typeof escalationApi.listRules>[0]) {
  return useQuery({
    queryKey: ['escalation', 'rules', params],
    queryFn: () => escalationApi.listRules(params),
  });
}

export function useEscalationRule(id: string) {
  return useQuery({
    queryKey: ['escalation', 'rules', id],
    queryFn: () => escalationApi.getRule(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useCreateEscalationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: escalationApi.createRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Escalation rule created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateEscalationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof escalationApi.updateRule>[1]) =>
      escalationApi.updateRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Escalation rule updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteEscalationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: escalationApi.deleteRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Escalation rule deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useEscalationLogs() {
  return useQuery({
    queryKey: ['escalation', 'logs'],
    queryFn: () => escalationApi.getLogs(),
    select: (res) => res.data,
  });
}
