import {
  CalendarEventType,
  CalendarSource,
  MeetingStatus,
  MeetingType,
  QualifiedBy,
  ParticipantRole,
  CommitmentStatus,
  ActionItemStatus,
  OwnerType,
  ExternalSystem,
  Priority,
  EscalationTrigger,
  EscalationChannel,
  EscalationTone,
  EscalationTargetType,
  BriefingType,
  DeliveryChannel,
  FocusModeTrigger,
  NotificationContext,
  StreakType,
  ProtectionRuleType,
  SyncDirection,
  SyncStatus,
  SyncResolution,
  ConflictSeverity,
} from '../enums';

// ── DISC Profile ──

export interface DISCProfile {
  dominance: number; // 0-100
  influence: number;
  steadiness: number;
  conscientiousness: number;
}

// ── Psychometric Profiles ──

export interface PsychometricProfile {
  disc?: DISCProfile;
  kolbe?: string;
  mbtiType?: string;
  enneagramType?: number;
  bigFive?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
}

// ── User ──

export interface User {
  id: string;
  email: string;
  name: string;
  auth0Id: string;
  timezone: string;
  avatarUrl?: string;
  psychometrics?: PsychometricProfile;
  workingHoursStart: string; // "09:00"
  workingHoursEnd: string;   // "17:00"
  defaultHourlyRate: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Contact ──

export interface ContactTier {
  id: string;
  userId: string;
  name: string;
  priority: number;
  escalationDelayMinutes: number;
  calendarAccessLevel: string;
  communicationPriority: string;
}

export interface Contact {
  id: string;
  userId: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  title?: string;
  tierId?: string;
  disc?: DISCProfile;
  relationshipScore: number;
  lastInteractionAt?: Date;
  nimbleCrmId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Calendar Event ──

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  location?: string;
  eventType: CalendarEventType;
  isProtected: boolean;
  recurrenceRule?: string;
  travelBufferMinutes?: number;
  travelOrigin?: string;
  travelDestination?: string;
  travelEventId?: string;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  externalCalendarId?: string;
  externalEventHash?: string;
  source: CalendarSource;
  lastSyncedAt?: Date;
  meetingId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Calendar Protection Rules ──

export interface CalendarProtectionRule {
  id: string;
  userId: string;
  name: string;
  type: ProtectionRuleType;
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  bufferMinutes?: number;
  maxCount?: number;
  requires2faOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Calendar Sync ──

export interface CalendarSyncConfig {
  id: string;
  userId: string;
  source: CalendarSource;
  direction: SyncDirection;
  status: SyncStatus;
  externalAccountId?: string;
  externalCalendarId?: string;
  externalCalendarName?: string;
  sovereignWins: boolean;
  importAsEventType?: CalendarEventType;
  autoImportNewEvents: boolean;
  syncIntervalMinutes: number;
  lastSyncAt?: Date;
  lastSyncError?: string;
  nextSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarSyncLog {
  id: string;
  syncConfigId: string;
  direction: SyncDirection;
  externalEventId?: string;
  calendarEventId?: string;
  action: string;
  resolution: SyncResolution;
  hasConflict: boolean;
  sovereignData?: Record<string, unknown>;
  externalData?: Record<string, unknown>;
  resolvedData?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: Date;
}

// ── Nested Calendar Views ──

export interface HourSlot {
  hour: number; // 0-23
  label: string; // "9:00 AM"
  events: CalendarEvent[];
}

export interface DailyViewResponse {
  date: string;
  hours: HourSlot[];
  totalEvents: number;
  conflicts: ConflictResult[];
}

export interface DayBucket {
  date: string;
  dayOfWeek: number; // 0=Sun, 6=Sat
  dayLabel: string;   // "Mon Feb 10"
  events: CalendarEvent[];
  totalEvents: number;
}

export interface WeeklyViewResponse {
  weekStart: string;
  weekEnd: string;
  days: DayBucket[];
  totalEvents: number;
  conflicts: ConflictResult[];
}

export interface WeekBucket {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  events: CalendarEvent[];
  totalEvents: number;
}

export interface MonthlyViewResponse {
  month: number;
  year: number;
  weeks: WeekBucket[];
  totalEvents: number;
  conflicts: ConflictResult[];
}

export interface MonthBucket {
  month: number;
  year: number;
  monthLabel: string; // "February 2026"
  events: CalendarEvent[];
  totalEvents: number;
}

export interface QuarterlyViewResponse {
  quarter: number;
  year: number;
  months: MonthBucket[];
  totalEvents: number;
  conflicts: ConflictResult[];
}

// ── Conflict Detection ──

export interface ConflictResult {
  severity: ConflictSeverity;
  eventA: { id: string; title: string; startTime: Date; endTime: Date };
  eventB: { id: string; title: string; startTime: Date; endTime: Date };
  overlapMinutes: number;
  message: string;
  protectionRuleId?: string;
}

// ── Meeting ──

export interface Meeting {
  id: string;
  userId: string;
  calendarEventId?: string;
  title: string;
  description?: string;
  status: MeetingStatus;
  purpose?: string;
  decisionRequired?: string;
  agendaUrl?: string;
  agendaSubmittedAt?: Date;
  preReadUrl?: string;
  preReadDistributedAt?: Date;
  preReadDeadline?: Date;
  isQualified: boolean;
  qualifiedAt?: Date;
  qualifiedBy?: QualifiedBy;
  rejectionReason?: string;
  meetingType?: MeetingType;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  meetingCost?: number;
  hourlyRate?: number;
  transcriptUrl?: string;
  recapContent?: string;
  rating?: number;
  valueScore?: number;
  wasNecessary?: boolean;
  isRecurring: boolean;
  recurringGroupId?: string;
  nextReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  contactId?: string;
  userId?: string;
  email: string;
  name: string;
  role: ParticipantRole;
  hasAcknowledged: boolean;
  acknowledgedAt?: Date;
  optedOutOfRecording: boolean;
}

// ── Accountability: Commitments, Action Items, Agreements ──

export interface Commitment {
  id: string;
  userId: string;
  meetingId?: string;
  ownerId: string;
  ownerType: OwnerType;
  title: string;
  description?: string;
  dueDate: Date;
  status: CommitmentStatus;
  completedAt?: Date;
  priority: Priority;
  affectsScore: boolean;
  escalationRuleId?: string;
  currentEscalationLevel: number;
  lastEscalatedAt?: Date;
  isDelegated: boolean;
  delegatedToId?: string;
  delegatedAt?: Date;
  delegatorRetainsAccountability: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionItem {
  id: string;
  userId: string;
  meetingId?: string;
  title: string;
  description?: string;
  ownerId: string;
  ownerType: OwnerType;
  dueDate: Date;
  status: ActionItemStatus;
  completedAt?: Date;
  priority: Priority;
  externalSystem?: ExternalSystem;
  externalSystemId?: string;
  escalationRuleId?: string;
  currentEscalationLevel: number;
  lastEscalatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agreement {
  id: string;
  userId: string;
  meetingId?: string;
  title: string;
  description: string;
  parties: string[];
  agreedAt: Date;
  isActive: boolean;
  supersededById?: string;
  addedToKnowledgeBase: boolean;
  knowledgeBaseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Escalation ──

export interface EscalationStep {
  stepOrder: number;
  channel: EscalationChannel;
  delayMinutes: number;
  tone: EscalationTone;
  messageTemplate?: string;
}

export interface EscalationRule {
  id: string;
  userId: string;
  name: string;
  description?: string;
  triggerType: EscalationTrigger;
  steps: EscalationStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EscalationLog {
  id: string;
  userId: string;
  escalationRuleId: string;
  stepOrder: number;
  targetType: EscalationTargetType;
  targetId: string;
  recipientEmail: string;
  recipientContactId?: string;
  channel: EscalationChannel;
  tone: EscalationTone;
  sentAt: Date;
  deliveredAt?: Date;
  responseReceivedAt?: Date;
  responseContent?: string;
}

// ── Accountability Scores & Streaks ──

export interface AccountabilityScore {
  id: string;
  userId: string;
  date: Date;
  score: number;
  commitmentsMade: number;
  commitmentsDelivered: number;
  commitmentsMissed: number;
  onTimeRate: number;
}

export interface Streak {
  id: string;
  userId: string;
  type: StreakType;
  currentCount: number;
  longestCount: number;
  lastActivityAt: Date;
  brokenAt?: Date;
  startedAt: Date;
}

// ── Briefings ──

export interface Briefing {
  id: string;
  userId: string;
  type: BriefingType;
  date: Date;
  content: Record<string, unknown>;
  deliveryChannel: DeliveryChannel;
  deliveredAt?: Date;
  completedAt?: Date;
  isCompleted: boolean;
  createdAt: Date;
}

// ── Focus Mode ──

export interface FocusMode {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isActive: boolean;
  allowCriticalOnly: boolean;
  allowMeetingPrep: boolean;
  allowAll: boolean;
  triggerType: FocusModeTrigger;
  triggerCalendarEventType?: CalendarEventType;
  requires2faOverride: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Notification Preferences ──

export interface NotificationPreference {
  id: string;
  userId: string;
  channel: EscalationChannel;
  isEnabled: boolean;
  context: NotificationContext;
  priority: Priority;
}

// ── Daily Closeout ──

export interface DailyCloseout {
  id: string;
  userId: string;
  date: Date;
  isCompleted: boolean;
  completedAt?: Date;
  openItemsAtStart: number;
  itemsCompleted: number;
  itemsRescheduled: number;
  itemsDelegated: number;
  reflectionNotes?: string;
  createdAt: Date;
}
