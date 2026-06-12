import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { AvailableModel } from '../../api/admin/agilo-analytics/analytics-ai/models/route';
import { retrieveAllAvailableModels } from '../lib/data/models';

export const useRetrieveModels = (
  options?: Omit<
    UseQueryOptions<AvailableModel[] | undefined, Error>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: ['available-models'],
    queryFn: async () => {
      const models = await retrieveAllAvailableModels();
      return models;
    },
    ...options,
  });
};
