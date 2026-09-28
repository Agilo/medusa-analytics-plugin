import { z } from 'zod';

export const adminOrdersListQuerySchema = z.discriminatedUnion('preset', [
  z.object({
    preset: z.literal('custom'),
    date_from: z.string(),
    date_to: z.string(),
  }),
  z.object({
    preset: z.literal('this-month'),
  }),
  z.object({
    preset: z.literal('last-month'),
  }),
  z.object({
    preset: z.literal('last-3-months'),
  }),
]);

export type AdminOrdersListQueryInputArgs = z.infer<
  typeof adminOrdersListQuerySchema
>;
