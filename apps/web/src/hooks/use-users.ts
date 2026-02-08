'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users.api';
import { toast } from 'sonner';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => usersApi.getMe(),
    select: (res) => res.data,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Profile updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdatePsychometrics() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updatePsychometrics,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Psychometrics updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateWorkingHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: usersApi.updateWorkingHours,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users', 'me'] });
      toast.success('Working hours updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

