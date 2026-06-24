import { z } from 'zod';

export const analyticsAISchema = z.object({
  date_from: z.string().describe('ISO date (YYYY-MM-DD)').optional(),
  date_to: z.string().describe('ISO date (YYYY-MM-DD)').optional(),
  preset: z
    .enum(['this-month', 'last-month', 'last-3-months', 'all-time'])
    .optional()
    .default('this-month'),
});
export type AnalyticsAIArgs = z.infer<typeof analyticsAISchema>;

export const analyticsChatSchema = z.object({
  prompt: z.string().min(1, 'Please enter a question'),
  modelId: z.string().min(1, 'Please select a model'),
});
export type AnalyticsChatInput = z.infer<typeof analyticsChatSchema>;

export const promptSchema = analyticsChatSchema.pick({ prompt: true });
export type PromptFormValues = z.infer<typeof promptSchema>;
