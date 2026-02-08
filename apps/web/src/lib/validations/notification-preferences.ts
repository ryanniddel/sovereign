import { z } from 'zod';

export const notificationPreferenceSchema = z.object({
  channel: z.string().min(1),
  isEnabled: z.boolean(),
  context: z.string().optional(),
  priority: z.string().optional(),
});

export type NotificationPreferenceValues = z.infer<typeof notificationPreferenceSchema>;
