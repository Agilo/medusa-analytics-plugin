import { z } from 'zod';

export const adminProductAnalyticsQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

export type AdminProductAnalyticsQueryInputArgs = z.infer<
  typeof adminProductAnalyticsQuerySchema
>;
