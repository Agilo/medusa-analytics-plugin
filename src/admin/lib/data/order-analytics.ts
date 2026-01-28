import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { sdk } from '../utils';
import type { OrderAnalyticsResponse } from '../../../api/admin/agilo-analytics/orders/route';

export type { OrderAnalyticsResponse };

export async function retrieveOrderAnalytics(
  preset: string,
  date?: DateRange | undefined,
) {
  let url = `/admin/agilo-analytics/orders?preset=${preset}`;
  if (date && date.from && date.to) {
    const dateFrom = format(date.from, 'yyyy-MM-dd');
    const dateTo = format(date.to, 'yyyy-MM-dd');
    url = `/admin/agilo-analytics/orders?preset=custom&date_from=${dateFrom}&date_to=${dateTo}`;
  }
  const orderAnalytics = await sdk.client.fetch<OrderAnalyticsResponse>(url);
  return orderAnalytics;
}
