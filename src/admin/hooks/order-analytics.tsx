import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import {
  OrderAnalyticsResponse,
  retrieveOrderAnalytics,
} from '../lib/data/order-analytics';

export const useOrderAnalytics = (
  preset: string,
  query: DateRange | undefined,
  options?: Omit<
    UseQueryOptions<OrderAnalyticsResponse | undefined, Error>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: ['order-analytics', preset, JSON.stringify(query)],
    queryFn: async () => {
      const data = await retrieveOrderAnalytics(preset, query);
      return data;
    },
    ...options,
  });
};
