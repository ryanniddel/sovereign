import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  Target,
  CheckSquare,
  ClipboardList,
  Handshake,
  FileText,
  Shield,
  Bell,
  Focus,
  TrendingUp,
  Settings,
  Moon,
  Sun,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  MeetingStatus,
  MeetingType,
  CommitmentStatus,
  ActionItemStatus,
  Priority,
  EscalationTrigger,
  EscalationChannel,
  EscalationTone,
  EscalationStatus,
  EscalationTargetType,
  BriefingType,
  FocusModeTrigger,
  FocusModeDeactivationReason,
  FocusModeOverrideStatus,
  NotificationCategory,
  CalendarEventType,
} from '@sovereign/shared';
import type { SearchEntityType } from '@sovereign/shared';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: { label: string; href: string }[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  {
    label: 'Meetings',
    href: '/meetings',
    icon: Users,
  },
  {
    label: 'Accountability',
    href: '/accountability',
    icon: Target,
    children: [
      { label: 'Dashboard', href: '/accountability' },
      { label: 'Action Items', href: '/accountability/action-items' },
      { label: 'Commitments', href: '/accountability/commitments' },
      { label: 'Agreements', href: '/accountability/agreements' },
    ],
  },
  { label: 'Contacts', href: '/contacts', icon: FileText },
  { label: 'Daily Closeout', href: '/closeout', icon: CheckSquare },
  { label: 'Briefings', href: '/briefings', icon: Sun },
  { label: 'Focus Modes', href: '/focus-modes', icon: Focus },
  { label: 'Escalation', href: '/escalation', icon: TrendingUp },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  [MeetingStatus.REQUESTED]: 'Requested',
  [MeetingStatus.QUALIFYING]: 'Qualifying',
  [MeetingStatus.QUALIFIED]: 'Qualified',
  [MeetingStatus.SCHEDULED]: 'Scheduled',
  [MeetingStatus.PREP_SENT]: 'Prep Sent',
  [MeetingStatus.IN_PROGRESS]: 'In Progress',
  [MeetingStatus.COMPLETED]: 'Completed',
  [MeetingStatus.CANCELLED]: 'Cancelled',
  [MeetingStatus.AUTO_CANCELLED]: 'Auto-Cancelled',
};

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  [MeetingStatus.REQUESTED]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  [MeetingStatus.QUALIFYING]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  [MeetingStatus.QUALIFIED]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  [MeetingStatus.SCHEDULED]: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  [MeetingStatus.PREP_SENT]: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  [MeetingStatus.IN_PROGRESS]: 'bg-green-500/10 text-green-500 border-green-500/20',
  [MeetingStatus.COMPLETED]: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  [MeetingStatus.CANCELLED]: 'bg-red-500/10 text-red-500 border-red-500/20',
  [MeetingStatus.AUTO_CANCELLED]: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  [MeetingType.DECISION]: 'Decision',
  [MeetingType.ONE_ON_ONE]: '1:1',
  [MeetingType.BOARD]: 'Board',
  [MeetingType.INVESTOR]: 'Investor',
  [MeetingType.TEAM]: 'Team',
  [MeetingType.EXTERNAL]: 'External',
  [MeetingType.VENDOR]: 'Vendor',
  [MeetingType.INTERVIEW]: 'Interview',
  [MeetingType.ALL_HANDS]: 'All Hands',
};

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  [CommitmentStatus.PENDING]: 'Pending',
  [CommitmentStatus.IN_PROGRESS]: 'In Progress',
  [CommitmentStatus.COMPLETED]: 'Completed',
  [CommitmentStatus.OVERDUE]: 'Overdue',
  [CommitmentStatus.RESCHEDULED]: 'Rescheduled',
  [CommitmentStatus.DELEGATED]: 'Delegated',
};

export const ACTION_ITEM_STATUS_LABELS: Record<ActionItemStatus, string> = {
  [ActionItemStatus.PENDING]: 'Pending',
  [ActionItemStatus.IN_PROGRESS]: 'In Progress',
  [ActionItemStatus.COMPLETED]: 'Completed',
  [ActionItemStatus.OVERDUE]: 'Overdue',
  [ActionItemStatus.RESCHEDULED]: 'Rescheduled',
  [ActionItemStatus.DELEGATED]: 'Delegated',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  [Priority.LOW]: 'Low',
  [Priority.MEDIUM]: 'Medium',
  [Priority.HIGH]: 'High',
  [Priority.CRITICAL]: 'Critical',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.LOW]: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  [Priority.MEDIUM]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  [Priority.HIGH]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  [Priority.CRITICAL]: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export const ESCALATION_TRIGGER_LABELS: Record<EscalationTrigger, string> = {
  [EscalationTrigger.OVERDUE]: 'Overdue',
  [EscalationTrigger.NO_ACKNOWLEDGMENT]: 'No Acknowledgment',
  [EscalationTrigger.MISSED_DEADLINE]: 'Missed Deadline',
  [EscalationTrigger.MISSED_PRE_READ]: 'Missed Pre-Read',
  [EscalationTrigger.NIGHTLY_CLOSEOUT]: 'Nightly Closeout',
};

export const ESCALATION_CHANNEL_LABELS: Record<EscalationChannel, string> = {
  [EscalationChannel.IN_APP]: 'In-App',
  [EscalationChannel.EMAIL]: 'Email',
  [EscalationChannel.SMS]: 'SMS',
  [EscalationChannel.PHONE_CALL]: 'Phone Call',
  [EscalationChannel.SLACK]: 'Slack',
};

export const ESCALATION_TONE_LABELS: Record<EscalationTone, string> = {
  [EscalationTone.WARM]: 'Warm',
  [EscalationTone.PROFESSIONAL]: 'Professional',
  [EscalationTone.DIRECT]: 'Direct',
  [EscalationTone.URGENT]: 'Urgent',
  [EscalationTone.FINAL]: 'Final',
};

export const ESCALATION_STATUS_LABELS: Record<EscalationStatus, string> = {
  [EscalationStatus.PENDING]: 'Pending',
  [EscalationStatus.SENT]: 'Sent',
  [EscalationStatus.DELIVERED]: 'Delivered',
  [EscalationStatus.RESPONDED]: 'Responded',
  [EscalationStatus.CANCELLED]: 'Cancelled',
  [EscalationStatus.PAUSED]: 'Paused',
};

export const ESCALATION_TARGET_TYPE_LABELS: Record<EscalationTargetType, string> = {
  [EscalationTargetType.COMMITMENT]: 'Commitment',
  [EscalationTargetType.ACTION_ITEM]: 'Action Item',
  [EscalationTargetType.MEETING_PREP]: 'Meeting Prep',
  [EscalationTargetType.ACKNOWLEDGMENT]: 'Acknowledgment',
};

export const BRIEFING_TYPE_LABELS: Record<BriefingType, string> = {
  [BriefingType.MORNING]: 'Morning',
  [BriefingType.NIGHTLY]: 'Nightly',
};

export const FOCUS_MODE_TRIGGER_LABELS: Record<FocusModeTrigger, string> = {
  [FocusModeTrigger.MANUAL]: 'Manual',
  [FocusModeTrigger.CALENDAR_EVENT]: 'Calendar Event',
  [FocusModeTrigger.SCHEDULED]: 'Scheduled',
};

export const FOCUS_MODE_DEACTIVATION_REASON_LABELS: Record<FocusModeDeactivationReason, string> = {
  [FocusModeDeactivationReason.MANUAL]: 'Manual',
  [FocusModeDeactivationReason.SCHEDULED]: 'Scheduled',
  [FocusModeDeactivationReason.CALENDAR_EVENT_ENDED]: 'Calendar Event Ended',
  [FocusModeDeactivationReason.AUTO_EXPIRED]: 'Auto-expired',
  [FocusModeDeactivationReason.OVERRIDE]: 'Override',
};

export const FOCUS_MODE_OVERRIDE_STATUS_LABELS: Record<FocusModeOverrideStatus, string> = {
  [FocusModeOverrideStatus.PENDING]: 'Pending',
  [FocusModeOverrideStatus.APPROVED]: 'Approved',
  [FocusModeOverrideStatus.REJECTED]: 'Rejected',
  [FocusModeOverrideStatus.EXPIRED]: 'Expired',
};

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  [CalendarEventType.MEETING]: 'Meeting',
  [CalendarEventType.FOCUS_BLOCK]: 'Focus Block',
  [CalendarEventType.TRAVEL]: 'Travel',
  [CalendarEventType.PERSONAL]: 'Personal',
  [CalendarEventType.ADMIN]: 'Admin',
  [CalendarEventType.BREAK]: 'Break',
};

export const CALENDAR_EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  [CalendarEventType.MEETING]: 'bg-blue-500',
  [CalendarEventType.FOCUS_BLOCK]: 'bg-purple-500',
  [CalendarEventType.TRAVEL]: 'bg-amber-500',
  [CalendarEventType.PERSONAL]: 'bg-green-500',
  [CalendarEventType.ADMIN]: 'bg-gray-500',
  [CalendarEventType.BREAK]: 'bg-teal-500',
};

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  [NotificationCategory.ESCALATION]: 'Escalation',
  [NotificationCategory.MEETING]: 'Meeting',
  [NotificationCategory.COMMITMENT]: 'Commitment',
  [NotificationCategory.ACTION_ITEM]: 'Action Item',
  [NotificationCategory.BRIEFING]: 'Briefing',
  [NotificationCategory.CLOSEOUT]: 'Closeout',
  [NotificationCategory.SYSTEM]: 'System',
  [NotificationCategory.FOCUS_MODE]: 'Focus Mode',
};

export const NOTIFICATION_CATEGORY_COLORS: Record<NotificationCategory, string> = {
  [NotificationCategory.ESCALATION]: 'bg-red-500/10 text-red-500',
  [NotificationCategory.MEETING]: 'bg-blue-500/10 text-blue-500',
  [NotificationCategory.COMMITMENT]: 'bg-purple-500/10 text-purple-500',
  [NotificationCategory.ACTION_ITEM]: 'bg-orange-500/10 text-orange-500',
  [NotificationCategory.BRIEFING]: 'bg-emerald-500/10 text-emerald-500',
  [NotificationCategory.CLOSEOUT]: 'bg-yellow-500/10 text-yellow-500',
  [NotificationCategory.SYSTEM]: 'bg-gray-500/10 text-gray-500',
  [NotificationCategory.FOCUS_MODE]: 'bg-violet-500/10 text-violet-500',
};

// ── Search Entity Types ──

export const SEARCH_ENTITY_TYPE_LABELS: Record<SearchEntityType, string> = {
  contact: 'Contacts',
  meeting: 'Meetings',
  commitment: 'Commitments',
  actionItem: 'Action Items',
  agreement: 'Agreements',
  calendarEvent: 'Calendar Events',
  escalationRule: 'Escalation Rules',
  briefing: 'Briefings',
  focusMode: 'Focus Modes',
};

export const SEARCH_ENTITY_TYPE_ICONS: Record<SearchEntityType, LucideIcon> = {
  contact: Users,
  meeting: Calendar,
  commitment: Target,
  actionItem: ClipboardList,
  agreement: FileText,
  calendarEvent: CalendarDays,
  escalationRule: Zap,
  briefing: Sun,
  focusMode: Shield,
};

export const SEARCH_ENTITY_TYPE_COLORS: Record<SearchEntityType, string> = {
  contact: 'text-blue-500',
  meeting: 'text-indigo-500',
  commitment: 'text-orange-500',
  actionItem: 'text-emerald-500',
  agreement: 'text-purple-500',
  calendarEvent: 'text-blue-400',
  escalationRule: 'text-red-500',
  briefing: 'text-yellow-500',
  focusMode: 'text-purple-400',
};

export const SEARCH_ENTITY_TYPE_ROUTES: Record<SearchEntityType, string> = {
  contact: '/contacts',
  meeting: '/meetings',
  commitment: '/accountability/commitments',
  actionItem: '/accountability/action-items',
  agreement: '/accountability/agreements',
  calendarEvent: '/calendar',
  escalationRule: '/escalation',
  briefing: '/briefings',
  focusMode: '/focus-modes',
};

export const SEARCH_ENTITY_TYPES: SearchEntityType[] = [
  'contact', 'meeting', 'commitment', 'actionItem', 'agreement',
  'calendarEvent', 'escalationRule', 'briefing', 'focusMode',
];
