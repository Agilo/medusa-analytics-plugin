import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ProductAnalyticsResponse } from '../../hooks/product-analytics';

const BACKEND_URL = window.location.origin;

export async function retrieveProductAnalytics(date: DateRange | undefined) {
  if (!date || !date.from || !date?.to) {
    return undefined;
  }
  const dateFrom = format(date.from, 'yyyy-MM-dd');
  const dateTo = format(date.to, 'yyyy-MM-dd');
  const data = await fetch(
    `${BACKEND_URL}/admin/agilo-analytics/products?date_from=${dateFrom}&date_to=${dateTo}`
  );
  const productAnalytics = (await data.json()) as ProductAnalyticsResponse;
  return productAnalytics;
}

export async function retrieveProductAnalyticsCSV(date?: DateRange) {
  if (!date || !date.from || !date?.to) {
    return undefined;
  }

  const dateFrom = format(date.from, 'yyyy-MM-dd');
  const dateTo = format(date.to, 'yyyy-MM-dd');
  const url = `${BACKEND_URL}/admin/agilo-analytics/products/csv?date_from=${dateFrom}&date_to=${dateTo}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Failed to download CSV');
  }

  const blob = await res.blob();
  const urlObject = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = urlObject;
  a.download = 'product-analytics.csv';
  a.click();
  window.URL.revokeObjectURL(urlObject);
}
