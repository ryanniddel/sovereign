import { api } from './client';
import type {
  EscalationRule, EscalationLog, EscalationTrigger, EscalationTargetType,
  EscalationAnalytics, ActiveEscalationChain,
} from '@sovereign/shared';

type EscalationStepInput = {
  stepOrder: number; channel: string; delayMinutes: number;
  tone: string; messageTemplate?: string;
};

type EscalationQuery = {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: string;
  triggerType?: EscalationTrigger;
};

type EscalationLogQuery = {
  page?: number; pageSize?: number;
  targetType?: string; channel?: string; status?: string;
  ruleId?: string; from?: string; to?: string;
};

export const escalationApi = {
  // Rule CRUD
  listRules: (params?: EscalationQuery) =>
    api.getPaginated<EscalationRule>('/escalation/rules', params as Record<string, string | number>),

  getRule: (id: string) => api.get<EscalationRule>(`/escalation/rules/${id}`),

  createRule: (data: {
    name: string; description?: string; triggerType: EscalationTrigger;
    steps: EscalationStepInput[]; isActive?: boolean;
    maxRetries?: number; cooldownMinutes?: number; stopOnResponse?: boolean;
  }) => api.post<EscalationRule>('/escalation/rules', data),

  updateRule: (id: string, data: {
    name?: string; description?: string; steps?: EscalationStepInput[];
    isActive?: boolean; maxRetries?: number; cooldownMinutes?: number; stopOnResponse?: boolean;
  }) => api.patch<EscalationRule>(`/escalation/rules/${id}`, data),

  deleteRule: (id: string) => api.delete(`/escalation/rules/${id}`),

  cloneRule: (id: string) => api.post<EscalationRule>(`/escalation/rules/${id}/clone`, {}),

  // Logs
  getLogs: (params?: EscalationLogQuery) =>
    api.getPaginated<EscalationLog>('/escalation/logs', params as Record<string, string | number>),

  // Analytics & chains
  getAnalytics: (days?: number) =>
    api.get<EscalationAnalytics>('/escalation/analytics', days ? { days } : undefined),

  getActiveChains: () => api.get<ActiveEscalationChain[]>('/escalation/active-chains'),

  // Actions
  trigger: (data: { targetId: string; targetType: EscalationTargetType; escalationRuleId: string }) =>
    api.post<void>('/escalation/trigger', data),

  pause: (targetId: string, targetType: string) =>
    api.post<void>('/escalation/pause', { targetId, targetType }),

  resume: (targetId: string, targetType: string) =>
    api.post<void>('/escalation/resume', { targetId, targetType }),

  cancel: (targetId: string, targetType: string) =>
    api.post<void>('/escalation/cancel', { targetId, targetType }),

  recordResponse: (logId: string, responseContent?: string) =>
    api.post<EscalationLog>('/escalation/record-response', { logId, responseContent }),
};
