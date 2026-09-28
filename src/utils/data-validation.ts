import { MedusaError } from '@medusajs/framework/utils';
import { z } from 'zod';

export function isDataValid<T>({
  data,
  schema,
}: {
  schema: z.ZodSchema<T>;
  data: unknown;
}) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      parsed.error.issues.map((err) => err.message).join(', '),
    );
  }

  return parsed.data;
}
