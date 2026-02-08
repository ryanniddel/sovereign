import { api } from './client';
import type { EscalationRule, EscalationLog, EscalationTrigger, EscalationTargetType } from '@sovereign/shared';

type EscalationStepInput = {
  stepOrder: number; channel: string; delayMinutes: number;
  tone: string; messageTemplate?: string;
};

type EscalationQuery = {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
  triggerType?: EscalationTrigger;
};

export const escalationApi = {
  listRules: (params?: EscalationQuery) =>
    api.getPaginated<EscalationRule>('/escalation/rules', params as Record<string, string | number>),

  getRule: (id: string) => api.get<EscalationRule>(`/escalation/rules/${id}`),

  createRule: (data: {
    name: string; description?: string; triggerType: EscalationTrigger;
    steps: EscalationStepInput[]; isActive?: boolean;
  }) => api.post<EscalationRule>('/escalation/rules', data),

  updateRule: (id: string, data: {
    name?: string; description?: string; steps?: EscalationStepInput[]; isActive?: boolean;
  }) => api.patch<EscalationRule>(`/escalation/rules/${id}`, data),

  deleteRule: (id: string) => api.delete(`/escalation/rules/${id}`),

  getLogs: () => api.get<EscalationLog[]>('/escalation/logs'),

  trigger: (data: { targetId: string; targetType: EscalationTargetType; escalationRuleId: string }) =>
    api.post<void>('/escalation/trigger', data),
};
