import { Button, FocusModal, Heading, Label, Text, toast } from '@medusajs/ui';
import { Input } from './Input';
import { PencilSquare } from '@medusajs/icons';
import { useGatewayConfig, useUpdateGatewayKey } from '../hooks/ai-dashboard';
import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AdminSetGatewayKeyInputArgs,
  adminSetGatewayKeySchema,
} from '../../api/admin/agilo-analytics/analytics-ai/validators';

export const EditApiKeyForm = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  const { data } = useGatewayConfig();
  const { mutate, isPending } = useUpdateGatewayKey();

  const {
    reset,
    handleSubmit,
    control,
    formState: { isValid },
  } = useForm({
    resolver: zodResolver(adminSetGatewayKeySchema),
    defaultValues: {
      api_key: '',
    },
    mode: 'onChange',
  });
  const onSubmit = (data: AdminSetGatewayKeyInputArgs) => {
    mutate(
      { api_key: data.api_key },
      {
        onSuccess: () => {
          setIsOpen(false);
          toast.success('API key updated successfully');
          reset();
        },
        onError: (error: Error) => {
          toast.error(error?.message ?? 'Failed to update API key');
        },
      },
    );
  };

  return (
    <FocusModal open={isOpen} onOpenChange={setIsOpen}>
      <FocusModal.Trigger asChild>
        <Button variant="secondary">
          <PencilSquare className="size-fit" />
        </Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FocusModal.Header>
          <FocusModal.Title>Replace API Key</FocusModal.Title>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center py-16">
          <form
            id="edit-api-key-form"
            className="flex w-full max-w-lg flex-col gap-y-8"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="flex flex-col gap-y-1">
              <Heading>Replace your API key</Heading>
              <Text className="text-ui-fg-subtle">
                Replace your API key with a new one, because of privacy and
                security reasons, you can't edit the existing key, but you can
                replace it with a new one.
              </Text>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="api_key" className="text-ui-fg-subtle">
                API Key
              </Label>
              <Controller
                name="api_key"
                control={control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    id="api_key"
                    type="password"
                    placeholder={`Your last key: ******${data?.key?.key_last_four ?? ''}`}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>
          </form>
        </FocusModal.Body>
        <FocusModal.Footer>
          <Button
            type="submit"
            form="edit-api-key-form"
            isLoading={isPending}
            disabled={isPending || !isValid}
          >
            Save
          </Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};
