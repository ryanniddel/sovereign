'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '@/lib/api/calendar.api';
import { toast } from 'sonner';

// ── Events ──

export function useCalendarEvents(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['calendar', 'events', params],
    queryFn: () => calendarApi.listEvents(params),
    select: (res) => res.data,
  });
}

export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: ['calendar', 'event', id],
    queryFn: () => calendarApi.getEvent(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.createEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Event created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCreateFocusBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.createFocusBlock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Focus block created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof calendarApi.updateEvent>[1]) =>
      calendarApi.updateEvent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Event updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.deleteEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar'] });
      toast.success('Event deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Views ──

export function useDailyView(date: string) {
  return useQuery({
    queryKey: ['calendar', 'daily', date],
    queryFn: () => calendarApi.getDailyView({ date }),
    select: (res) => res.data,
  });
}

export function useWeeklyView(date: string) {
  return useQuery({
    queryKey: ['calendar', 'weekly', date],
    queryFn: () => calendarApi.getWeeklyView({ date }),
    select: (res) => res.data,
  });
}

export function useMonthlyView(date: string) {
  return useQuery({
    queryKey: ['calendar', 'monthly', date],
    queryFn: () => calendarApi.getMonthlyView({ date }),
    select: (res) => res.data,
  });
}

export function useQuarterlyView(date: string) {
  return useQuery({
    queryKey: ['calendar', 'quarterly', date],
    queryFn: () => calendarApi.getQuarterlyView({ date }),
    select: (res) => res.data,
  });
}

export function useAgendaView(date: string) {
  return useQuery({
    queryKey: ['calendar', 'agenda', date],
    queryFn: () => calendarApi.getAgendaView({ date }),
    select: (res) => res.data,
  });
}

export function useCommandCenter() {
  return useQuery({
    queryKey: ['calendar', 'command-center'],
    queryFn: () => calendarApi.getCommandCenter(),
    select: (res) => res.data,
  });
}

// ── Conflicts & Availability ──

export function useConflictCheck(startTime: string, endTime: string, excludeEventId?: string) {
  return useQuery({
    queryKey: ['calendar', 'conflicts', startTime, endTime, excludeEventId],
    queryFn: () => calendarApi.checkConflicts(startTime, endTime, excludeEventId),
    select: (res) => res.data,
    enabled: !!startTime && !!endTime,
  });
}

export function useAvailableSlots(date: string, durationMinutes?: number) {
  return useQuery({
    queryKey: ['calendar', 'available-slots', date, durationMinutes],
    queryFn: () => calendarApi.getAvailableSlots(date, durationMinutes),
    select: (res) => res.data,
    enabled: !!date,
  });
}

// ── Protection Rules ──

export function useProtectionRules() {
  return useQuery({
    queryKey: ['calendar', 'protection-rules'],
    queryFn: () => calendarApi.getProtectionRules(),
    select: (res) => res.data,
  });
}

export function useProtectionRule(id: string) {
  return useQuery({
    queryKey: ['calendar', 'protection-rule', id],
    queryFn: () => calendarApi.getProtectionRule(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateProtectionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.createProtectionRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', 'protection-rules'] });
      toast.success('Protection rule created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateProtectionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof calendarApi.updateProtectionRule>[1]) =>
      calendarApi.updateProtectionRule(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', 'protection-rules'] });
      toast.success('Protection rule updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteProtectionRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.deleteProtectionRule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', 'protection-rules'] });
      toast.success('Protection rule deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ── Sync Configs ──

export function useSyncConfigs() {
  return useQuery({
    queryKey: ['calendar', 'sync-configs'],
    queryFn: () => calendarApi.getSyncConfigs(),
    select: (res) => res.data,
  });
}

export function useSyncConfig(id: string) {
  return useQuery({
    queryKey: ['calendar', 'sync-config', id],
    queryFn: () => calendarApi.getSyncConfig(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateSyncConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.createSyncConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', 'sync-configs'] });
      toast.success('Sync config created');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSyncConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof calendarApi.updateSyncConfig>[1]) =>
      calendarApi.updateSyncConfig(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', 'sync-configs'] });
      toast.success('Sync config updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteSyncConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: calendarApi.deleteSyncConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', 'sync-configs'] });
      toast.success('Sync config removed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useSyncLogs(id: string) {
  return useQuery({
    queryKey: ['calendar', 'sync-logs', id],
    queryFn: () => calendarApi.getSyncLogs(id),
    select: (res) => res.data,
    enabled: !!id,
  });
}
