import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { retrieveCustomersAnalytics } from '../lib/data/customer-analytics';
import { CustomerAnalyticsResponse } from '../../api/admin/agilo-analytics/customers/route';

export const useCustomerAnalytics = (
  query: DateRange | undefined,
  options?: Omit<
    UseQueryOptions<CustomerAnalyticsResponse | undefined, Error>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: ['customer-analytics', JSON.stringify(query)],
    queryFn: async () => {
      const data = await retrieveCustomersAnalytics(query);
      return data;
    },
    ...options,
  });
};
