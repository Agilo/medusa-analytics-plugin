import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { OrderAnalyticsResponse } from '../../hooks/order-analytics';

const BACKEND_URL = window.location.origin;

export async function retrieveOrderAnalytics(
  preset: string,
  date?: DateRange | undefined
) {
  if (!date || !date.from || !date?.to) {
    const data = await fetch(
      `${BACKEND_URL}/admin/agilo-analytics/orders?preset=${preset}`
    );
    const orderAnalytics = (await data.json()) as OrderAnalyticsResponse;
    return orderAnalytics;
  }
  const dateFrom = format(date.from, 'yyyy-MM-dd');
  const dateTo = format(date.to, 'yyyy-MM-dd');
  const data = await fetch(
    `${BACKEND_URL}/admin/agilo-analytics/orders?date_from=${dateFrom}&date_to=${dateTo}&preset=${preset}`
  );
  const orderAnalytics = (await data.json()) as OrderAnalyticsResponse;
  return orderAnalytics;
}
