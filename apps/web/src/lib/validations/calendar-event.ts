import { z } from 'zod';

export const createCalendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  isAllDay: z.boolean().optional(),
  location: z.string().optional(),
  eventType: z.string().optional(),
  isProtected: z.boolean().optional(),
  bufferBeforeMinutes: z.coerce.number().min(0).optional(),
  bufferAfterMinutes: z.coerce.number().min(0).optional(),
});

export type CreateCalendarEventValues = z.infer<typeof createCalendarEventSchema>;
