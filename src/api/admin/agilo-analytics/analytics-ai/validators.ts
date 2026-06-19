import { z } from 'zod';

export const adminSetGatewayKeySchema = z.object({
  api_key: z.string().min(10),
});

export type AdminSetGatewayKeyInputArgs = z.infer<
  typeof adminSetGatewayKeySchema
>;
