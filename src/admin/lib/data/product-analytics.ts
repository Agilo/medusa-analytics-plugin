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
