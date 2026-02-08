import { z } from 'zod';

export const briefingPreferencesSchema = z.object({
  morningTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  nightlyTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:MM'),
  morningChannel: z.string().optional(),
  nightlyChannel: z.string().optional(),
  includeMeetingCosts: z.boolean().optional(),
  includeActionItems: z.boolean().optional(),
  includeStreaks: z.boolean().optional(),
  includeReflectionPrompt: z.boolean().optional(),
  maxScheduleItems: z.coerce.number().min(5).max(50).optional(),
  maxOverdueItems: z.coerce.number().min(3).max(25).optional(),
  morningEnabled: z.boolean().optional(),
  nightlyEnabled: z.boolean().optional(),
});

export type BriefingPreferencesValues = z.infer<typeof briefingPreferencesSchema>;
