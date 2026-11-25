import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import {
  ReturnAnalyticsResponse,
  retrieveReturnAnalytics,
} from '../lib/data/return-analytics';

export const useReturnAnalytics = (
  preset: string,
  query: DateRange | undefined,
  options?: Omit<
    UseQueryOptions<ReturnAnalyticsResponse | undefined, Error>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: ['return-analytics', preset, JSON.stringify(query)],
    queryFn: async () => {
      const data = await retrieveReturnAnalytics(preset, query);
      return data;
    },
    ...options,
  });
};
