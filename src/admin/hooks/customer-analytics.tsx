import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { retrieveCustomersAnalytics } from '../lib/data/customer-analytics';

export type CustomerAnalyticsResponse = {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  customer_count: {
    name: string;
    returning_customers: number;
    new_customers: number;
  }[];
  customer_group: { name: string; total: number }[];
  customer_sales: {
    customer_id: string;
    sales: number;
    name: string;
    groups: string[];
    count: number;
    last_order: Date;
    email: string;
  }[];
  currency_code: string;
};

export const useCustomerAnalytics = (
  query: DateRange | undefined,
  options?: Omit<
    UseQueryOptions<CustomerAnalyticsResponse | undefined, Error>,
    'queryKey' | 'queryFn'
  >
) => {
  return useQuery({
    queryKey: ['customer-analytics', query?.from, query?.to],
    queryFn: async () => {
      const data = await retrieveCustomersAnalytics(query);
      return data;
    },
    ...options,
  });
};
