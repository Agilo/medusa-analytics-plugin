import { z } from 'zod';

export const analyticsInputSchema = z.object({
  date_from: z.string().describe('ISO date (YYYY-MM-DD)').optional(),
  date_to: z.string().describe('ISO date (YYYY-MM-DD)').optional(),
  preset: z
    .enum(['this-month', 'last-month', 'last-3-months', 'all-time'])
    .optional()
    .default('this-month'),
});

export type AnalyticsInputArgs = z.infer<typeof analyticsInputSchema>;
