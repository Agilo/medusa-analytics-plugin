import { z } from 'zod';

export const adminCustomerAnalyticsQuerySchema = z.object({
  date_from: z.string(),
  date_to: z.string(),
});

export type AdminCustomerAnalyticsQueryInputArgs = z.infer<
  typeof adminCustomerAnalyticsQuerySchema
>;
