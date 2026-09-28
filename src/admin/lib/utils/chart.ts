import { ValueType } from 'recharts/types/component/DefaultTooltipContent';

const toChartNumber = (value: ValueType | undefined): number =>
  typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : 0;

export const formatAxisCurrency = (
  value: ValueType | undefined,
  currency: string,
): string =>
  new Intl.NumberFormat(undefined, {
    currency,
    maximumFractionDigits: 0,
  }).format(toChartNumber(value));

function generateStableColor(
  input: string,
  saturation = 70,
  lightness = 50,
): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function generateColorsForData<T extends Record<string, unknown>>(
  data: T[],
  keyField: keyof T,
  saturation = 70,
  lightness = 50,
): string[] {
  return data.map((item) =>
    generateStableColor(String(item[keyField]), saturation, lightness),
  );
}
