import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { ModelOption } from '../../utils/ai-models';
import { retrieveAllAvailableModels } from '../lib/data/models';
import { getGatewayConfig } from '../lib/data/ai-gateway';

export const useRetrieveModels = (
  options?: Omit<
    UseQueryOptions<ModelOption[] | undefined, Error>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: ['available-models'],
    queryFn: retrieveAllAvailableModels,
    ...options,
  });
};

export const useGatewayConfig = () => {
  return useQuery({
    queryKey: ['ai-gateway-config'],
    queryFn: getGatewayConfig,
  });
};
