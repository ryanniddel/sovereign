import { z } from 'zod';

export const psychometricsSchema = z.object({
  discD: z.coerce.number().min(0).max(100).optional(),
  discI: z.coerce.number().min(0).max(100).optional(),
  discS: z.coerce.number().min(0).max(100).optional(),
  discC: z.coerce.number().min(0).max(100).optional(),
  kolbeProfile: z.string().optional(),
  mbtiType: z.string().optional(),
  enneagramType: z.coerce.number().min(1).max(9).optional(),
  bigFiveOpenness: z.coerce.number().min(0).max(100).optional(),
  bigFiveConscientiousness: z.coerce.number().min(0).max(100).optional(),
  bigFiveExtraversion: z.coerce.number().min(0).max(100).optional(),
  bigFiveAgreeableness: z.coerce.number().min(0).max(100).optional(),
  bigFiveNeuroticism: z.coerce.number().min(0).max(100).optional(),
});

export type PsychometricsValues = z.infer<typeof psychometricsSchema>;
