import { z } from 'zod';

export const createFocusModeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  allowCriticalOnly: z.boolean().optional(),
  allowMeetingPrep: z.boolean().optional(),
  allowAll: z.boolean().optional(),
  triggerType: z.string().optional(),
  triggerCalendarEventType: z.string().optional(),
  scheduleStartTime: z.string().optional(),
  scheduleEndTime: z.string().optional(),
  scheduleDays: z.array(z.number()).optional(),
  autoDeactivateMinutes: z.coerce.number().min(5).max(1440).optional(),
  requires2faOverride: z.boolean().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export type CreateFocusModeValues = z.infer<typeof createFocusModeSchema>;
