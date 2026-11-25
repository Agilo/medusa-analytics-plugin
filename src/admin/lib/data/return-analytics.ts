import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { sdk } from '../utils';
import type { ReturnAnalyticsResponse } from '../../../api/admin/agilo-analytics/returns/route';

export type { ReturnAnalyticsResponse };

export async function retrieveReturnAnalytics(
  preset: string,
  date?: DateRange | undefined,
) {
  // Same as `retrieveOrderAnalytics`, so both tabs use the same periods.
  let url = `/admin/agilo-analytics/returns?preset=${preset}`;
  if (date && date.from && date.to) {
    const dateFrom = format(date.from, 'yyyy-MM-dd');
    const dateTo = format(date.to, 'yyyy-MM-dd');
    url = `/admin/agilo-analytics/returns?preset=custom&date_from=${dateFrom}&date_to=${dateTo}`;
  }
  return sdk.client.fetch<ReturnAnalyticsResponse>(url);
}
