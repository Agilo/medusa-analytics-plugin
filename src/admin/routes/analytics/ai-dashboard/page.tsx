import * as React from 'react';
import { defineRouteConfig } from '@medusajs/admin-sdk';
import {
  AiAssistent,
  Spinner,
  User,
  ShoppingCart,
  FlyingBox,
} from '@medusajs/icons';
import { Button, Container, Heading, Skeleton, Text } from '@medusajs/ui';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { GatewayForm } from '../../../components/GatewayForm';
import { SelectModels } from '../../../components/SelectModels';
import { EditApiKeyForm } from '../../../components/EditApiKeyForm';
import { Input } from '../../../components/Input';
import { Suggestions } from '../../../components/Suggestions';
import { LineChart } from '../../../components/LineChart';
import { BarChart } from '../../../components/BarChart';
import { format } from 'date-fns';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGatewayConfig } from '../../../hooks/ai-dashboard';
import {
  AnalyticsChatInput,
  analyticsChatSchema,
} from '../../../../api/admin/agilo-analytics/analytics-ai/chat/validators';

export default function AnalyticsAIPage() {
  const { data: config, isLoading: isLoadingConfig } = useGatewayConfig();
  const hasGatewayKey = !!config?.key;

  const { control, handleSubmit, reset, setValue, setFocus } =
    useForm<AnalyticsChatInput>({
      resolver: zodResolver(analyticsChatSchema),
      defaultValues: { prompt: '', modelId: '' },
    });

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/admin/agilo-analytics/analytics-ai/chat',
      // Send a single flat { prompt, modelId } body that matches the request
      // schema — no message history, no parts. modelId comes from the per-call
      // body (set in onSubmit), so it's always the value selected at send time.
      prepareSendMessagesRequest: ({ messages, body }) => ({
        body: {
          prompt:
            messages[messages.length - 1]?.parts.find((p) => p.type === 'text')
              ?.text ?? '',
          modelId: body?.modelId,
        },
      }),
    }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  // We only ever show the latest answer — never a conversation history.
  const answer = messages.find((m) => m.role === 'assistant');

  const [lastPrompt, setLastPrompt] = React.useState('');

  const onSubmit = (data: AnalyticsChatInput) => {
    // Drop any previous exchange so each question is answered on its own. (don't care about history of conversation)
    setMessages([]);
    sendMessage(
      { role: 'user', parts: [{ type: 'text', text: data.prompt }] },
      { body: { modelId: data.modelId } },
    );
    // Clear the prompt but keep the selected model for the next question.
    reset({ prompt: '', modelId: data.modelId });
    setLastPrompt(data.prompt);
  };

  // Prefill the input when a suggested question is clicked, then focus it so
  // the user can edit or submit right away.
  const handleSuggestionSelect = (question: string) => {
    setValue('prompt', question, { shouldValidate: true });
    setFocus('prompt');
  };

  if (isLoadingConfig) {
    return (
      <div className="flex h-[calc(100vh-60px)] items-center justify-center">
        <Spinner className="size-12 animate-spin" />
      </div>
    );
  }

  if (!hasGatewayKey) {
    return <GatewayForm />;
  }

  return (
    <Container className="relative divide-y p-0">
      <div className="px-6 py-4">
        <div className="flex flex-wrap items-start  gap-4">
          <div className="min-w-65">
            <div className="flex items-center gap-2">
              <AiAssistent className="text-ui-fg-subtle" />
              <Heading level="h1">AI Analytics Dashboard</Heading>
            </div>
            <Text size="small" className="text-ui-fg-muted mt-1">
              Ask questions about your store data and get instant insights
              powered by AI
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
                  placeholder="Ask a question about your store… (e.g., 'Show me abandoned carts')"
                  className="flex-1 min-w-70"
                  error={fieldState.error?.message}
                />
              </div>
            )}
          />
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <Spinner className="animate-spin" /> : 'Generate'}
          </Button>
        </form>

        <div className="mt-3">
          <Suggestions onSelect={handleSuggestionSelect} />
        </div>
      </div>

      <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-280px)]">
        {!answer && !isLoading ? (
          <div className="h-90 flex flex-col items-center justify-center text-center gap-2">
            <AiAssistent className="text-ui-fg-subtle" />
            <Text size="small" weight="plus">
              Find everything you need to know about your store data in one
              place
            </Text>
            <Text size="small" className="text-ui-fg-muted max-w-130">
              Enter a question above to get started. Chat is cleared on the
              refresh
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {answer && (
              <>
                <div className="px-4 py-3 shadow-elevation-card-rest flex items-center gap-2 border border-rounded-md items-baseline">
                  <Text size="small" className="text-ui-fg-muted ">
                    Your last question:
                  </Text>
                  <Text size="base">{lastPrompt}</Text>
                </div>
                <AssistantAnswer message={answer} />
              </>
            )}
            {isLoading && !answer && (
              <div className="flex flex-col gap-3 max-w-205">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}
          </div>
        )}
      </div>
    </Container>
  );
}

const AssistantAnswer = ({ message }: { message: any }) => {
  const text = message.parts
    ?.filter((part: any) => part.type === 'text')
    .map((part: any) => part.text)
    .join('');
  const toolParts = message.parts?.filter(
    (part: any) =>
      part.type.startsWith('tool-') || part.type === 'dynamic-tool',
  );

  return (
    <div className="flex flex-col gap-2">
      {text ? (
        <div className="max-w-[80%] rounded-lg p-4 bg-ui-bg-subtle border border-ui-border-base">
          <Text size="small" className="whitespace-pre-wrap">
            {text}
          </Text>
        </div>
      ) : null}

      {toolParts.map((part: any) => (
        <div key={part.toolCallId} className="w-full mt-4">
          <AIGeneratedWidget toolPart={part} />
        </div>
      ))}
    </div>
  );
};

const AIGeneratedWidget = ({ toolPart }: { toolPart: any }) => {
  const toolName =
    toolPart.type === 'dynamic-tool'
      ? toolPart.toolName
      : String(toolPart.type).replace(/^tool-/, '');

  if (toolPart.state === 'output-error') {
    return (
      <Container className="p-4 bg-ui-bg-subtle border border-ui-border-error">
        <Text size="small" className="text-ui-fg-error">
          {toolPart.errorText || 'The analytics widget could not be loaded.'}
        </Text>
      </Container>
    );
  }

  if (toolPart.state !== 'output-available') {
    return (
      <Container className="p-4 bg-ui-bg-component border border-ui-border-base animate-pulse">
        <div className="flex items-center gap-2">
          <Spinner className="animate-spin" />
          <Text size="small">
            Fetching {toolName.replace(/([A-Z])/g, ' $1').toLowerCase()}...
          </Text>
        </div>
      </Container>
    );
  }

  const result = toolPart.output;

  if (toolName === 'getOrdersAnalytics') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Container className="relative p-4">
          <ShoppingCart className="absolute right-4 top-4 text-ui-fg-muted" />
          <Text size="small" className="text-ui-fg-muted">
            Total Orders
          </Text>
          <Heading level="h2" className="mt-1">
            {result.total_orders}
          </Heading>
        </Container>
        <Container className="relative p-4">
          <Text size="small" className="text-ui-fg-muted">
            Total Sales
          </Text>
          <Heading level="h2" className="mt-1">
            {new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: result.currency,
              maximumFractionDigits: 0,
            }).format(result.total_sales)}
          </Heading>
        </Container>
        <Container className="md:col-span-2 p-4 h-64">
          <Text size="small" weight="plus" className="mb-4">
            Orders Over Time
          </Text>
          <LineChart
            data={result.order_count}
            xAxisDataKey="name"
            yAxisDataKey="count"
          />
        </Container>
      </div>
    );
  }

  if (toolName === 'getProductsAnalytics') {
    return (
      <Container className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <FlyingBox className="text-ui-fg-subtle" />
          <Text size="small" weight="plus">
            Top Products
          </Text>
        </div>
        <div className="h-64">
          <BarChart
            data={result.topProducts}
            xAxisDataKey="title"
            yAxisDataKey="quantity"
          />
        </div>
      </Container>
    );
  }

  if (toolName === 'getCustomersAnalytics') {
    return (
      <Container className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="text-ui-fg-subtle" />
          <Text size="small" weight="plus">
            New Customers
          </Text>
        </div>
        <Heading level="h1">{result.new_customers}</Heading>
        <Text size="small" className="text-ui-fg-muted">
          Acquired between{' '}
          {format(new Date(result.date_range.from), 'MMM d, yyyy')} and{' '}
          {format(new Date(result.date_range.to), 'MMM d, yyyy')}
        </Text>
      </Container>
    );
  }

  return null;
};

export const config = defineRouteConfig({
  label: 'AI dashboard',
  icon: AiAssistent,
});
