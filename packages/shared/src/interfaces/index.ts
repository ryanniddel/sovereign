import { DeliveryChannel, Priority } from '../enums';

// ── API Response Wrappers ──

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  timestamp: string;
}

// ── Health Check ──

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: string;
  dependencies?: Record<string, 'ok' | 'down'>;
}

// ── Meeting Lifecycle ──

export interface MeetingRequest {
  title: string;
  description?: string;
  purpose: string;
  decisionRequired: string;
  requestedDurationMinutes: number;
  requestedParticipants: string[];
  agendaUrl?: string;
  preReadUrl?: string;
  meetingType?: string;
}

export interface MeetingCostCalculation {
  attendeeCount: number;
  durationMinutes: number;
  averageHourlyRate: number;
  totalCost: number;
}

export interface PostMeetingExtraction {
  actionItems: Array<{
    title: string;
    ownerEmail: string;
    dueDate: string;
    confidence: number;
  }>;
  agreements: Array<{
    title: string;
    description: string;
    parties: string[];
    confidence: number;
  }>;
  commitments: Array<{
    title: string;
    ownerEmail: string;
    dueDate: string;
    confidence: number;
  }>;
  recap: string;
  contradictions: Array<{
    newItem: string;
    existingAgreement: string;
    confidence: number;
  }>;
}

// ── Briefing Content ──

export interface MorningBriefingContent {
  schedule: Array<{
    time: string;
    title: string;
    prepNotes?: string;
    meetingCost?: number;
  }>;
  commitmentsDueToday: Array<{
    title: string;
    dueDate: string;
    owner: string;
  }>;
  overdueItems: Array<{
    title: string;
    originalDueDate: string;
    escalationStatus: string;
  }>;
  metrics: {
    currentStreak: number;
    accountabilityScore: number;
  };
  aiInsight: string;
  weather?: string;
  travelAlerts?: string[];
  priorityRanking: string[];
}

export interface NightlyReviewContent {
  openItems: Array<{
    id: string;
    title: string;
    type: 'commitment' | 'actionItem';
    status: string;
  }>;
  scorecard: {
    commitmentsMade: number;
    commitmentsDelivered: number;
    onTimeRate: number;
  };
  tomorrowPrep: Array<{
    meetingTitle: string;
    preReadSent: boolean;
    agendaConfirmed: boolean;
  }>;
  reflectionPrompt: string;
}

// ── Escalation Workflow ──

export interface EscalationWorkflowStep {
  stepOrder: number;
  channel: string;
  delayMinutes: number;
  tone: string;
  messageTemplate?: string;
}

// ── Notification Config ──

export interface NotificationConfig {
  channel: string;
  isEnabled: boolean;
  context: string;
  minPriority: Priority;
}

// ── Briefing Delivery Config ──

export interface BriefingConfig {
  morningTime: string; // "07:00"
  nightlyTime: string; // "21:00"
  deliveryChannels: DeliveryChannel[];
  isEnabled: boolean;
}
