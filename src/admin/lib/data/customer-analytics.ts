import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { CustomerAnalyticsResponse } from '../../hooks/customer-analytics';
const BACKEND_URL = __BACKEND_URL__ === '/' ? '' : __BACKEND_URL__;

export async function retrieveCustomersAnalytics(date: DateRange | undefined) {
  if (!date || !date.from || !date?.to) {
    return undefined;
  }
  const dateFrom = format(date.from, 'yyyy-MM-dd');
  const dateTo = format(date.to, 'yyyy-MM-dd');
  const data = await fetch(
    `${BACKEND_URL}/admin/agilo-analytics/customers?date_from=${dateFrom}&date_to=${dateTo}`
  );
  const customersAnalytics = (await data.json()) as CustomerAnalyticsResponse;
  return customersAnalytics;
}
