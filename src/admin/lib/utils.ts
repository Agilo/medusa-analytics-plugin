import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a stable, deterministic color based on a string input
 * Uses a simple hash function to ensure the same string always produces the same color
 */
export function generateStableColor(
  input: string,
  saturation = 70,
  lightness = 50,
): string {
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert hash to hue (0-360 degrees)
  const hue = Math.abs(hash) % 360;

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Generates an array of stable colors for a dataset
 * Each item's color is based on a key field (like name or id)
 */
export function generateColorsForData<T extends Record<string, any>>(
  data: T[],
  keyField: keyof T,
  saturation = 70,
  lightness = 50,
): string[] {
  return data.map((item) =>
    generateStableColor(String(item[keyField]), saturation, lightness),
  );
}
