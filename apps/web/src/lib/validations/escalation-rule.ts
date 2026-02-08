import { z } from 'zod';

export const escalationStepSchema = z.object({
  stepOrder: z.number(),
  channel: z.string().min(1),
  delayMinutes: z.coerce.number().min(0),
  tone: z.string().min(1),
  messageTemplate: z.string().optional(),
});

export const escalationRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  triggerType: z.string().min(1, 'Trigger type is required'),
  isActive: z.boolean().optional(),
  steps: z.array(escalationStepSchema).min(1, 'At least one step is required'),
});

export type EscalationRuleValues = z.infer<typeof escalationRuleSchema>;
