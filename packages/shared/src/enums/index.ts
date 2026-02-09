// ── Calendar & Events ──

export enum CalendarEventType {
  MEETING = 'MEETING',
  FOCUS_BLOCK = 'FOCUS_BLOCK',
  TRAVEL = 'TRAVEL',
  PERSONAL = 'PERSONAL',
  ADMIN = 'ADMIN',
  BREAK = 'BREAK',
}

export enum CalendarSource {
  SOVEREIGN = 'SOVEREIGN',
  OUTLOOK = 'OUTLOOK',
  GOOGLE = 'GOOGLE',
}

// ── Meeting Lifecycle ──

export enum MeetingStatus {
  REQUESTED = 'REQUESTED',
  QUALIFYING = 'QUALIFYING',
  QUALIFIED = 'QUALIFIED',
  SCHEDULED = 'SCHEDULED',
  PREP_SENT = 'PREP_SENT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  AUTO_CANCELLED = 'AUTO_CANCELLED',
}

export enum MeetingType {
  DECISION = 'DECISION',
  ONE_ON_ONE = 'ONE_ON_ONE',
  BOARD = 'BOARD',
  INVESTOR = 'INVESTOR',
  TEAM = 'TEAM',
  EXTERNAL = 'EXTERNAL',
  VENDOR = 'VENDOR',
  INTERVIEW = 'INTERVIEW',
  ALL_HANDS = 'ALL_HANDS',
}

export enum QualifiedBy {
  AI_EA = 'AI_EA',
  USER = 'USER',
  AUTO = 'AUTO',
}

export enum ParticipantRole {
  ORGANIZER = 'ORGANIZER',
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL',
}

// ── Accountability ──

export enum CommitmentStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  RESCHEDULED = 'RESCHEDULED',
  DELEGATED = 'DELEGATED',
}

export enum ActionItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  RESCHEDULED = 'RESCHEDULED',
  DELEGATED = 'DELEGATED',
}

export enum OwnerType {
  USER = 'USER',
  CONTACT = 'CONTACT',
}

export enum ExternalSystem {
  TRELLO = 'TRELLO',
  CLICKUP = 'CLICKUP',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ── Escalation ──

export enum EscalationTrigger {
  OVERDUE = 'OVERDUE',
  NO_ACKNOWLEDGMENT = 'NO_ACKNOWLEDGMENT',
  MISSED_DEADLINE = 'MISSED_DEADLINE',
  MISSED_PRE_READ = 'MISSED_PRE_READ',
  NIGHTLY_CLOSEOUT = 'NIGHTLY_CLOSEOUT',
  SCORE_DROP = 'SCORE_DROP',
  CUSTOM = 'CUSTOM',
}

export enum EscalationChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PHONE_CALL = 'PHONE_CALL',
  SLACK = 'SLACK',
}

export enum EscalationTone {
  WARM = 'WARM',
  PROFESSIONAL = 'PROFESSIONAL',
  DIRECT = 'DIRECT',
  URGENT = 'URGENT',
  FINAL = 'FINAL',
}

export enum EscalationTargetType {
  COMMITMENT = 'COMMITMENT',
  ACTION_ITEM = 'ACTION_ITEM',
  MEETING_PREP = 'MEETING_PREP',
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT',
}

export enum EscalationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  RESPONDED = 'RESPONDED',
  CANCELLED = 'CANCELLED',
  PAUSED = 'PAUSED',
}

// ── Briefings ──

export enum BriefingType {
  MORNING = 'MORNING',
  NIGHTLY = 'NIGHTLY',
}

export enum DeliveryChannel {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  VOICE = 'VOICE',
  SMS = 'SMS',
}

// ── Focus Modes ──

export enum FocusModeTrigger {
  MANUAL = 'MANUAL',
  CALENDAR_EVENT = 'CALENDAR_EVENT',
  SCHEDULED = 'SCHEDULED',
}

export enum FocusModeOverrideStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum FocusModeDeactivationReason {
  MANUAL = 'MANUAL',
  SCHEDULED = 'SCHEDULED',
  CALENDAR_EVENT_ENDED = 'CALENDAR_EVENT_ENDED',
  AUTO_EXPIRED = 'AUTO_EXPIRED',
  OVERRIDE = 'OVERRIDE',
}

// ── Notifications ──

export enum NotificationContext {
  WORK_HOURS = 'WORK_HOURS',
  AFTER_HOURS = 'AFTER_HOURS',
  FOCUS_MODE = 'FOCUS_MODE',
  ALL = 'ALL',
}

export enum NotificationCategory {
  ESCALATION = 'ESCALATION',
  MEETING = 'MEETING',
  COMMITMENT = 'COMMITMENT',
  ACTION_ITEM = 'ACTION_ITEM',
  BRIEFING = 'BRIEFING',
  CLOSEOUT = 'CLOSEOUT',
  SYSTEM = 'SYSTEM',
  FOCUS_MODE = 'FOCUS_MODE',
}

// ── Streaks ──

export enum StreakType {
  DAILY_CLOSEOUT = 'DAILY_CLOSEOUT',
  COMMITMENT_DELIVERY = 'COMMITMENT_DELIVERY',
  MEETING_PREP = 'MEETING_PREP',
  ON_TIME = 'ON_TIME',
}

// ── Calendar Protection ──

export enum ProtectionRuleType {
  UNBOOKABLE_HOURS = 'UNBOOKABLE_HOURS',
  BUFFER_TIME = 'BUFFER_TIME',
  FOCUS_PROTECTION = 'FOCUS_PROTECTION',
  MAX_DAILY_MEETINGS = 'MAX_DAILY_MEETINGS',
}

// ── Calendar Sync ──

export enum SyncDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND',
  BOTH = 'BOTH',
}

export enum SyncStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  ERROR = 'ERROR',
  DISCONNECTED = 'DISCONNECTED',
}

export enum SyncResolution {
  SOVEREIGN_WINS = 'SOVEREIGN_WINS',
  EXTERNAL_ACCEPTED = 'EXTERNAL_ACCEPTED',
  MERGED = 'MERGED',
  SKIPPED = 'SKIPPED',
  ERROR = 'ERROR',
}

// ── Scheduler ──

export enum ScheduledJobStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  TIMED_OUT = 'TIMED_OUT',
}

// ── Conflict Detection ──

export enum ConflictSeverity {
  HARD = 'HARD',       // direct time overlap
  SOFT = 'SOFT',       // buffer zone violation
  TRAVEL = 'TRAVEL',   // insufficient travel time
  PROTECTION = 'PROTECTION', // violates protection rule
}
