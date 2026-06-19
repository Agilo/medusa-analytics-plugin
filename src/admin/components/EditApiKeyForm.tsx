import { PencilSquare } from '@medusajs/icons';
import { Button, FocusModal, Heading, Input, Label, Text } from '@medusajs/ui';
import { useGatewayConfig } from '../hooks/ai-dashboard';

export const EditApiKeyForm = () => {
  const { data } = useGatewayConfig();

  return (
    <FocusModal>
      <FocusModal.Trigger asChild>
        <Button>
          <PencilSquare className="size-fit" />
        </Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FocusModal.Header>
          <FocusModal.Title>Replace API Key</FocusModal.Title>
        </FocusModal.Header>
        <FocusModal.Body className="flex flex-col items-center py-16">
          <div className="flex w-full max-w-lg flex-col gap-y-8">
            <div className="flex flex-col gap-y-1">
              <Heading>Replace your API key</Heading>
              <Text className="text-ui-fg-subtle">
                Replace your API key with a new one, because of privacy and
                security reasons, you can't edit the existing key, but you can
                replace it with a new one.
              </Text>
            </div>
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="key_name" className="text-ui-fg-subtle">
                Key name
              </Label>
              <Input
                id="key_name"
                placeholder={`Your last key: ******${data?.key?.key_last_four ?? ''}`}
              />
            </div>
          </div>
        </FocusModal.Body>
        <FocusModal.Footer>
          <Button>Save</Button>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};
