import { AiAssistent } from '@medusajs/icons';
import { Button, Heading, Input, Label, Text, toast } from '@medusajs/ui';
import { Controller, useForm } from 'react-hook-form';
import {
  AdminSetGatewayKeyInputArgs,
  adminSetGatewayKeySchema,
} from '../../api/admin/agilo-analytics/analytics-ai/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSetGatewayKey } from '../hooks/ai-dashboard';

export const GatewayForm: React.FC = () => {
  const { control, handleSubmit } = useForm<AdminSetGatewayKeyInputArgs>({
    resolver: zodResolver(adminSetGatewayKeySchema),
    defaultValues: {
      api_key: '',
    },
  });

  const { mutate, isPending } = useSetGatewayKey();

  const onSubmit = async (values: AdminSetGatewayKeyInputArgs) => {
    mutate(values, {
      onSuccess: () => {
        toast.success('Successfully set AI Gateway key');
      },
      onError: () => {
        toast.error('Failed to set AI Gateway key');
      },
    });
  };

  return (
    <div className="flex items-center justify-center relative p-6 h-[calc(100vh-60px)]">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-lg rounded-lg border border-ui-border-base bg-ui-bg-base p-6 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <AiAssistent className="text-ui-fg-subtle mt-0.5" />
          <div className="flex-1">
            <Heading level="h2">Add Vercel AI Gateway API key</Heading>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Add your Vercel AI Gateway API key once, then you can select any
              model from the picker.
            </Text>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-y-2">
          <Label htmlFor="api_key" className="text-ui-fg-subtle">
            Vercel AI Gateway API key
          </Label>
          <Controller
            control={control}
            name="api_key"
            render={({ field }) => (
              <Input
                {...field}
                id="api_key"
                type="password"
                placeholder="Paste your key…"
              />
            )}
          />
        </div>

        <div className="mt-6 flex items-center justify-end">
          <Button variant="primary" type="submit" isLoading={isPending}>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
};
