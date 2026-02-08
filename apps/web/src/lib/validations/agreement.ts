import { z } from 'zod';

export const createAgreementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  parties: z.array(z.string()).min(1, 'At least one party is required'),
  agreedAt: z.string().min(1, 'Agreement date is required'),
  meetingId: z.string().optional(),
});

export type CreateAgreementValues = z.infer<typeof createAgreementSchema>;
