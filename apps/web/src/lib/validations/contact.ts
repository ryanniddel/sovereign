import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  tierId: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial();

export type CreateContactValues = z.infer<typeof createContactSchema>;
export type UpdateContactValues = z.infer<typeof updateContactSchema>;
