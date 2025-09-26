import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { CustomerAnalyticsResponse } from '../../hooks/customer-analytics';
import { sdk } from '../utils';

export async function retrieveCustomersAnalytics(date: DateRange | undefined) {
  if (!date || !date.from || !date?.to) {
    return undefined;
  }
  const dateFrom = format(date.from, 'yyyy-MM-dd');
  const dateTo = format(date.to, 'yyyy-MM-dd');
  const customersAnalytics = await sdk.client.fetch<CustomerAnalyticsResponse>(
    `/admin/agilo-analytics/customers?date_from=${dateFrom}&date_to=${dateTo}`,
  );
  return customersAnalytics;
}
