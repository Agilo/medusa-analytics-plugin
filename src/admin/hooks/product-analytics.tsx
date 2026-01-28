import { DateRange } from 'react-day-picker';
import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { retrieveProductAnalytics } from '../lib/data/product-analytics';

export type ProductAnalyticsResponse = {
  lowStockVariants: {
    sku: string;
    inventoryQuantity: number;
    variantName: string;
    variantId: string;
    productId: string;
  }[];
  variantQuantitySold: {
    title: string;
    quantity: number;
  }[];
};

export const useProductAnalytics = (
  query: DateRange | undefined,
  options?: Omit<
    UseQueryOptions<ProductAnalyticsResponse | undefined, Error>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: ['product-analytics', query?.from, query?.to],
    queryFn: async () => {
      const data = await retrieveProductAnalytics(query);
      return data;
    },
    ...options,
  });
};
