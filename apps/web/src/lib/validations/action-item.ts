import { z } from 'zod';

export const createActionItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.string().optional(),
  ownerId: z.string().optional(),
  ownerType: z.string().optional(),
  meetingId: z.string().optional(),
});

export type CreateActionItemValues = z.infer<typeof createActionItemSchema>;
