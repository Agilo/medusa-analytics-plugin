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

export async function retrieveOrderAnalyticsCSV(
  preset: string,
  date?: DateRange
) {
  let url = `${BACKEND_URL}/admin/agilo-analytics/orders/csv?preset=${preset}`;

  if (date?.from && date?.to) {
    const dateFrom = format(date.from, 'yyyy-MM-dd');
    const dateTo = format(date.to, 'yyyy-MM-dd');
    url = `${BACKEND_URL}/admin/agilo-analytics/orders/csv?date_from=${dateFrom}&date_to=${dateTo}&preset=${preset}`;
  }

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error("Failed to download ZIP");
  }

  const blob = await res.blob();
  const urlObject = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = urlObject;
  a.download = "order-analytics.zip";
  a.click();
  window.URL.revokeObjectURL(urlObject);
}

