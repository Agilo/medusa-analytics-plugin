import * as React from 'react';
import { defineRouteConfig } from '@medusajs/admin-sdk';
import { AiAssistent, Spinner } from '@medusajs/icons';
import { Button, Container, Heading, Text } from '@medusajs/ui';
import { Sparkles } from 'lucide-react';
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

const randomGenerationWord = [
  'Thinking...',
  'Processing...',
  'Generating...',
  'Cooking...',
][Math.floor(Math.random() * 4)];

export default function AnalyticsAIPage() {
  const { data: config, isLoading: isLoadingConfig } = useGatewayConfig();

  const { control, handleSubmit, reset, setValue, setFocus } =
    useForm<AnalyticsChatInput>({
      resolver: zodResolver(analyticsChatSchema),
      defaultValues: { prompt: '', optionKey: '' },
    });

  const { spec, isStreaming, error, send } = useUIStream({
    api: '/admin/agilo-analytics/analytics-ai/chat',
  });

  const [lastPrompt, setLastPrompt] = React.useState('');

  // Height animation for the content area, for the streaming content
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState<number>();
  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() =>
      setContentHeight(el.offsetHeight),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [config?.configured]);

  const onSubmit = async (data: AnalyticsChatInput) => {
    setLastPrompt('');
    await send(data.prompt, { optionKey: data.optionKey });
    reset({ prompt: '', optionKey: data.optionKey });
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

  if (config && !config.encryption_key_configured) {
    return (
      <div className="flex items-center justify-center p-6 h-[calc(100vh-60px)]">
        <Container className="w-full max-w-lg p-6">
          <div className="flex items-start gap-3">
            <AiAssistent className="text-ui-fg-subtle mt-0.5" />
            <div className="flex-1">
              <Heading level="h2">AI dashboard is not enabled</Heading>
              <Text size="small" className="text-ui-fg-muted mt-1">
                Ask your developer to set the{' '}
                <code>aiGatewayEncryptionKey</code> option of the analytics
                plugin in <code>medusa-config</code>.
              </Text>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!config?.configured) {
    return <GatewayForm />;
  }

  return (
    <Container className="relative divide-y p-0">
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
            Generate
          </Button>
        </form>

        <div className="mt-3">
          <Suggestions onSelect={handleSuggestionSelect} />
        </div>
      </div>

      <div
        className="overflow-y-auto max-h-[calc(100vh-280px)] transition-[height] duration-300 ease-out"
        style={{ height: contentHeight }}
      >
        <div ref={contentRef} className="px-6 py-6">
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

              <JSONUIProvider registry={registry} initialState={spec?.state}>
                <Renderer
                  spec={spec}
                  registry={registry}
                  loading={isStreaming}
                />
              </JSONUIProvider>
              {isStreaming && (
                <div
                  className={`flex flex-col items-center justify-center gap-3 ${spec?.root ? 'py-6' : 'min-h-64'}`}
                >
                  <Sparkles className="size-8 text-ui-fg-muted animate-pulse" />
                  <Text size="base" className="text-ui-fg-muted">
                    {randomGenerationWord}
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

export const config = defineRouteConfig({
  label: 'AI dashboard',
  icon: AiAssistent,
});
