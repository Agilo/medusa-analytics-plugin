import {
  useMutation,
  useQuery,
  UseQueryOptions,
  useQueryClient,
} from '@tanstack/react-query';
import type { AvailableModel } from '../../api/admin/agilo-analytics/analytics-ai/models/route';
import { retrieveAllAvailableModels } from '../lib/data/models';
import { getGatewayConfig, setGatewayKey } from '../lib/data/ai-gateway';
import { AdminSetGatewayKeyInputArgs } from '../../api/admin/agilo-analytics/analytics-ai/route';

export const useRetrieveModels = (
  options?: Omit<
    UseQueryOptions<AvailableModel[] | undefined, Error>,
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

export const useSetGatewayKey = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AdminSetGatewayKeyInputArgs) =>
      setGatewayKey(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-gateway-config'] });
      queryClient.invalidateQueries({ queryKey: ['available-models'] });
    },
  });
};
