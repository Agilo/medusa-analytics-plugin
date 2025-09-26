import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ProductAnalyticsResponse } from '../../hooks/product-analytics';
import { sdk } from '../utils';

export async function retrieveProductAnalytics(date: DateRange | undefined) {
  if (!date || !date.from || !date?.to) {
    return undefined;
  }
  const dateFrom = format(date.from, 'yyyy-MM-dd');
  const dateTo = format(date.to, 'yyyy-MM-dd');
  const productAnalytics = await sdk.client.fetch<ProductAnalyticsResponse>(
    `/admin/agilo-analytics/products?date_from=${dateFrom}&date_to=${dateTo}`,
  );
  return productAnalytics;
}
