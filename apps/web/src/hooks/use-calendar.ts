'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '@/lib/api/calendar.api';
import { toast } from 'sonner';

export function useCalendarEvents(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['calendar', 'events', params],
    queryFn: () => calendarApi.listEvents(params),
    select: (res) => res.data,
  });
}

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
