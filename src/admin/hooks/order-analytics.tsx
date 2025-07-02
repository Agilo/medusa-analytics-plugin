import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { retrieveOrderAnalytics } from '../lib/data/order-analytics';

export type OrderAnalyticsResponse = {
  total_orders: number;
  regions: { name: string; sales: number }[];
  total_sales: number;
  statuses: { name: string; count: number }[];
  order_sales: { name: string; sales: number }[];
  prev_sales_percent: number;
  order_count: { name: string; count: number }[];
  prev_orders_percent: number;
  currency_code: string;
};

export const useOrderAnalytics = (
  preset: string,
  query: DateRange | undefined,
  options?: Omit<
    UseQueryOptions<OrderAnalyticsResponse | undefined, Error>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: ['order-analytics', query?.from, query?.to],
    queryFn: async () => {
      const data = await retrieveOrderAnalytics(preset, query);
      return data;
    },
    ...options,
  });
};
