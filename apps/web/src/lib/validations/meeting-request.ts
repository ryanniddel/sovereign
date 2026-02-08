import { z } from 'zod';

export const meetingRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  description: z.string().optional(),
  decisionRequired: z.string().optional(),
  estimatedDurationMinutes: z.coerce.number().min(15).optional(),
  meetingType: z.string().optional(),
  agendaUrl: z.string().url().optional().or(z.literal('')),
  preReadUrl: z.string().url().optional().or(z.literal('')),
});

export type MeetingRequestValues = z.infer<typeof meetingRequestSchema>;
