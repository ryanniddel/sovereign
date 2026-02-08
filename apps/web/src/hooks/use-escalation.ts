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

export function useCloneEscalationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: escalationApi.cloneRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Escalation rule cloned');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useEscalationLogs(params?: Parameters<typeof escalationApi.getLogs>[0]) {
  return useQuery({
    queryKey: ['escalation', 'logs', params],
    queryFn: () => escalationApi.getLogs(params),
  });
}

export function useEscalationAnalytics(days?: number) {
  return useQuery({
    queryKey: ['escalation', 'analytics', days],
    queryFn: () => escalationApi.getAnalytics(days),
    select: (res) => res.data,
  });
}

export function useActiveEscalationChains() {
  return useQuery({
    queryKey: ['escalation', 'active-chains'],
    queryFn: () => escalationApi.getActiveChains(),
    select: (res) => res.data,
    refetchInterval: 60_000, // refresh every minute for real-time chain tracking
  });
}

export function useTriggerEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: escalationApi.trigger,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Escalation triggered');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function usePauseEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: string }) =>
      escalationApi.pause(targetId, targetType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Escalation paused');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResumeEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: string }) =>
      escalationApi.resume(targetId, targetType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Escalation resumed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: string }) =>
      escalationApi.cancel(targetId, targetType),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Escalation cancelled');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRecordEscalationResponse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ logId, responseContent }: { logId: string; responseContent?: string }) =>
      escalationApi.recordResponse(logId, responseContent),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['escalation'] });
      toast.success('Response recorded');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
