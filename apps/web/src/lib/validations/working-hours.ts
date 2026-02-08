import { z } from 'zod';

export const workingHoursSchema = z.object({
  workingHoursStart: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  workingHoursEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  timezone: z.string().min(1, 'Timezone is required'),
  defaultHourlyRate: z.coerce.number().min(0).optional(),
});

export type WorkingHoursValues = z.infer<typeof workingHoursSchema>;
