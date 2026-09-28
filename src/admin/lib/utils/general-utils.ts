import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Medusa from '@medusajs/js-sdk';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const sdk = new Medusa({
  baseUrl: __BACKEND_URL__ || '/',
  auth: {
    type: 'session',
  },
});
