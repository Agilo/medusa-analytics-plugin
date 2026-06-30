import * as React from 'react';
import { defineRouteConfig } from '@medusajs/admin-sdk';
import { AiAssistent, Spinner } from '@medusajs/icons';
import { Button, Container, Heading, Skeleton, Text } from '@medusajs/ui';
import { useUIStream, JSONUIProvider, Renderer } from '@json-render/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registry } from '../../../lib/ai/registry';
import { GatewayForm } from '../../../components/GatewayForm';
import { SelectModels } from '../../../components/SelectModels';
import { EditApiKeyForm } from '../../../components/EditApiKeyForm';
import { Input } from '../../../components/Input';
import { Suggestions } from '../../../components/Suggestions';
import { useGatewayConfig } from '../../../hooks/ai-dashboard';
import {
  AnalyticsChatInput,
  analyticsChatSchema,
} from '../../../../api/admin/agilo-analytics/analytics-ai/chat/validators';
import { cn } from '../../../lib/utils/general-utils';

export default function AnalyticsAIPage() {
  const { data: config, isLoading: isLoadingConfig } = useGatewayConfig();

  const { control, handleSubmit, reset, setValue, setFocus } =
    useForm<AnalyticsChatInput>({
      resolver: zodResolver(analyticsChatSchema),
      defaultValues: { prompt: '', modelId: '' },
    });

  // The AI streams a json-render UI spec; <Renderer> turns it into our cards/charts.
  const { spec, isStreaming, error, send } = useUIStream({
    api: '/admin/agilo-analytics/analytics-ai/chat',
  });

  const [lastPrompt, setLastPrompt] = React.useState('');

  const onSubmit = async (data: AnalyticsChatInput) => {
    // The selected model travels in the stream's `context` body field.
    await send(data.prompt, { modelId: data.modelId });
    reset({ prompt: '', modelId: data.modelId });
    setLastPrompt(data.prompt);
  };

  const handleSuggestionSelect = (question: string) => {
    setValue('prompt', question, { shouldValidate: true });
    setFocus('prompt');
  };

  if (isLoadingConfig) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <Spinner className="size-12 animate-spin" />
      </div>
    );
  }

  if (!config?.key) {
    return <GatewayForm />;
  }

  return (
    <Container
      className={cn(
        'relative divide-y p-0',
        lastPrompt && 'h-[calc(100vh-80px)]',
      )}
    >
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-65">
            <div className="flex items-center gap-2">
              <AiAssistent className="text-ui-fg-subtle" />
              <Heading level="h1">AI Analytics Dashboard</Heading>
            </div>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Ask anything about your store data and get a dashboard generated
              on the fly
            </Text>
          </div>

          <div className="flex items-center gap-2 ml-auto relative">
            <Text as="span" size="small" className="text-ui-fg-muted">
              Model:
            </Text>
            <SelectModels control={control} />
          </div>
          <div className="flex items-center gap-2">
            <EditApiKeyForm />
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex mt-4 gap-2 items-center w-full"
        >
          <Controller
            control={control}
            name="prompt"
            render={({ field, fieldState }) => (
              <div className="flex-1 min-w-70">
                <Input
                  {...field}
                  placeholder="Ask a question about your store… (e.g., 'Show me sales by region this quarter')"
                  className="flex-1 min-w-70"
                  error={fieldState.error?.message}
                />
              </div>
            )}
          />
          <Button type="submit" variant="primary" disabled={isStreaming}>
            {isStreaming ? <Spinner className="animate-spin" /> : 'Generate'}
          </Button>
        </form>

        <div className="mt-3">
          <Suggestions onSelect={handleSuggestionSelect} />
        </div>
      </div>

      <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-280px)]">
        {!(lastPrompt !== '' || isStreaming) ? (
          <div className="h-90 flex flex-col items-center justify-center text-center gap-2">
            <AiAssistent className="text-ui-fg-subtle" />
            <Text size="small" weight="plus">
              Find everything you need to know about your store data in one
              place
            </Text>
            <Text size="small" className="text-ui-fg-muted max-w-130">
              Enter a question above to get started. Results are cleared on
              refresh
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {lastPrompt && (
              <div className="px-4 py-3 shadow-elevation-card-rest flex items-center gap-2 border rounded-lg items-baseline">
                <Text size="small" className="text-ui-fg-muted">
                  Your last question:
                </Text>
                <Text size="base">{lastPrompt}</Text>
              </div>
            )}

            {error && (
              <Container className="p-4 bg-ui-bg-subtle border border-ui-border-error">
                <Text size="small" className="text-ui-fg-error">
                  {error.message || 'The dashboard could not be generated.'}
                </Text>
              </Container>
            )}

            {isStreaming && !spec && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full md:col-span-2" />
              </div>
            )}

            <JSONUIProvider registry={registry}>
              <Renderer spec={spec} registry={registry} loading={isStreaming} />
            </JSONUIProvider>
          </div>
        )}
      </div>
    </Container>
  );
}

export const config = defineRouteConfig({
  label: 'AI dashboard',
  icon: AiAssistent,
});
