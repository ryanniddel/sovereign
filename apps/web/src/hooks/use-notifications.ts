'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications.api';
import { toast } from 'sonner';

// ── Queries ──

export function useNotificationInbox(params?: Parameters<typeof notificationsApi.getInbox>[0]) {
  return useQuery({
    queryKey: ['notifications', 'inbox', params],
    queryFn: () => notificationsApi.getInbox(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount(),
    select: (res) => res.data,
    refetchInterval: 30_000,
  });
}

export function useNotificationStats(days?: number) {
  return useQuery({
    queryKey: ['notifications', 'stats', days],
    queryFn: () => notificationsApi.getStats(days),
    select: (res) => res.data,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationsApi.getPreferences(),
    select: (res) => res.data,
  });
}

// ── Mutations ──

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: (_, category) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(category ? `Marked all ${category} as read` : 'Marked all as read');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDismissNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.dismiss,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDismissAll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.dismissAll,
    onSuccess: (_, category) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(category ? `Dismissed all ${category}` : 'All notifications dismissed');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateNotificationPreference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.updatePreference,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
      toast.success('Preference updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useInitializeNotificationDefaults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.initializeDefaults,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
      toast.success('Default preferences initialized');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useCleanupNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.cleanup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Old notifications cleaned up');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
