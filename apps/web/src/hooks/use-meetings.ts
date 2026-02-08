'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '@/lib/api/meetings.api';
import { toast } from 'sonner';

// ── Queries ──

export function useMeetings(params?: Parameters<typeof meetingsApi.list>[0]) {
  return useQuery({
    queryKey: ['meetings', params],
    queryFn: () => meetingsApi.list(params),
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ['meetings', id],
    queryFn: () => meetingsApi.get(id),
    enabled: !!id,
    select: (res) => res.data,
  });
}

export function useMeetingAnalytics(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['meetings', 'analytics', params],
    queryFn: () => meetingsApi.getAnalytics(params),
    select: (res) => res.data,
  });
}

export function useRecurringReviews() {
  return useQuery({
    queryKey: ['meetings', 'recurring-reviews'],
    queryFn: () => meetingsApi.getRecurringReviews(),
    select: (res) => res.data,
  });
}

// ── CRUD Mutations ──

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: meetingsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting requested');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof meetingsApi.update>[1]) =>
      meetingsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Lifecycle Mutations ──

export function useQualifyMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof meetingsApi.qualify>[1]) =>
      meetingsApi.qualify(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting qualified');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useScheduleMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: meetingsApi.schedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting scheduled');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRescheduleMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof meetingsApi.reschedule>[1]) =>
      meetingsApi.reschedule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting rescheduled');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStartMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: meetingsApi.start,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting started');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCompleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: meetingsApi.complete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting completed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCancelMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: meetingsApi.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting cancelled');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Post-meeting Mutations ──

export function useRateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof meetingsApi.rate>[1]) =>
      meetingsApi.rate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting rated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSubmitRecap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof meetingsApi.submitRecap>[1]) =>
      meetingsApi.submitRecap(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Recap submitted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Participant Mutations ──

export function useAddParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, ...data }: { meetingId: string } & Parameters<typeof meetingsApi.addParticipant>[1]) =>
      meetingsApi.addParticipant(meetingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Participant added');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, participantId }: { meetingId: string; participantId: string }) =>
      meetingsApi.removeParticipant(meetingId, participantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Participant removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
