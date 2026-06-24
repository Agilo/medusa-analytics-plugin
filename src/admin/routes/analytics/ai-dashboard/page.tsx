import * as React from 'react';
import { defineRouteConfig } from '@medusajs/admin-sdk';
import {
  AiAssistent,
  Spinner,
  User,
  ShoppingCart,
  FlyingBox,
} from '@medusajs/icons';
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Select,
  Skeleton,
  Text,
} from '@medusajs/ui';
import {
  useRetrieveModels,
  useGatewayConfig,
} from '../../../hooks/ai-dashboard';
import { GatewayForm } from '../../../components/GatewayForm';
import { normalizeGatewayModels } from '../../../lib/normalize-models';
import { EditApiKeyForm } from '../../../components/EditApiKeyForm';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessagePart, type UITools } from 'ai';
import { LineChart } from '../../../components/LineChart';
import { BarChart } from '../../../components/BarChart';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const promptSchema = z.object({
  prompt: z.string().min(1),
});
type PromptFormValues = z.infer<typeof promptSchema>;

export default function AnalyticsAIPage() {
  const { data: config, isLoading: isLoadingConfig } = useGatewayConfig();
  const hasGatewayKey = !!config?.key;

  const { data, isPending } = useRetrieveModels({
    enabled: hasGatewayKey,
  });

  const models = React.useMemo(
    () => (data?.length ? normalizeGatewayModels(data) : []),
    [data],
  );

  const [modelId, setModelId] = React.useState(() => {
    const defaultModel = models.find((m) => m.recommended) ?? models[0];
    return defaultModel?.id ?? 'openai/gpt-4.1';
  });

  const selectedModel = React.useMemo(
    () => models.find((m) => m.id === modelId),
    [models, modelId],
  );

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/admin/agilo-analytics/analytics-ai/chat',
      body: {
        modelId,
      },
    }),
  });
  const isLoading = status === 'submitted' || status === 'streaming';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
  });

  const onSubmit = (data: PromptFormValues) => {
    sendMessage({ role: 'user', parts: [{ type: 'text', text: data.prompt }] });
    reset();
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  React.useEffect(() => {
    if (models.length === 0) {
      return;
    }

    const hasSelectedModel = models.some((model) => model.id === modelId);

    if (!hasSelectedModel) {
      const defaultModel =
        models.find((model) => model.recommended) ?? models[0];

      if (defaultModel) {
        setModelId(defaultModel.id);
      }
    }
  }, [modelId, models]);

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

          <div className="flex items-center gap-2 ml-auto">
            <Text as="span" size="small" className="text-ui-fg-muted">
              Model:
            </Text>
            <Select value={modelId} onValueChange={setModelId} size="small">
              <Select.Trigger className="min-w-40 px-2">
                <Select.Value>
                  {isPending && !data
                    ? 'Loading models...'
                    : (selectedModel?.label ?? 'Select a model')}
                </Select.Value>
              </Select.Trigger>
              <Select.Content className="max-h-90">
                <Select.Group>
                  <Select.Label>Recommended</Select.Label>
                  {models
                    .filter((m) => m.recommended)
                    .map((m) => (
                      <Select.Item key={m.id} value={m.id}>
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-2">
                            <Text as="span" size="small" weight="plus">
                              {m.label}
                            </Text>
                            <Badge size="xsmall" color="grey">
                              {m.provider}
                            </Badge>
                          </div>
                          <div className="flex items-center">
                            <Text
                              as="span"
                              size="xsmall"
                              className="text-ui-fg-muted"
                            >
                              {m.context}
                            </Text>
                          </div>
                        </div>
                      </Select.Item>
                    ))}
                </Select.Group>

                <Select.Separator />

                {['OpenAI', 'Anthropic', 'Google', 'Mistral']
                  .filter((provider) =>
                    models.some(
                      (m) => m.provider === provider && !m.recommended,
                    ),
                  )
                  .map((provider) => (
                    <Select.Group key={provider}>
                      <Select.Label>{provider}</Select.Label>
                      {models
                        .filter(
                          (m) => m.provider === provider && !m.recommended,
                        )
                        .map((m) => (
                          <Select.Item key={m.id} value={m.id}>
                            <div className="flex items-center justify-between gap-3 w-full">
                              <Text as="span" size="small" weight="plus">
                                {m.label}
                              </Text>
                              <div className="flex items-center">
                                <Text
                                  as="span"
                                  size="xsmall"
                                  className="text-ui-fg-muted"
                                >
                                  {m.context}
                                </Text>
                              </div>
                            </div>
                          </Select.Item>
                        ))}
                    </Select.Group>
                  ))}
              </Select.Content>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <EditApiKeyForm />
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex mt-4 gap-2 items-center w-full"
        >
          <div className="flex-1 min-w-70">
            <Input
              {...register('prompt')}
              placeholder="Ask a question about your store… (e.g., 'Show me abandoned carts')"
              className="flex-1 min-w-70"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? <Spinner className="animate-spin" /> : 'Generate'}
          </Button>
        </form>
      </div>

      <div
        ref={scrollRef}
        className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-280px)]"
      >
        {messages.length === 0 ? (
          <div className="h-90 flex flex-col items-center justify-center text-center gap-2">
            <AiAssistent className="text-ui-fg-subtle" />
            <Text size="small" weight="plus">
              Find everything you need to know about your store data in one
              place
            </Text>
            <Text size="small" className="text-ui-fg-muted max-w-130">
              Enter a question above to get started
            </Text>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col gap-2 ${message.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <MessageBubble message={message} />
              </div>
            ))}
            {isLoading && (
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

const isToolPart = (part: UIMessagePart<any, UITools>) =>
  part.type.startsWith('tool-') || part.type === 'dynamic-tool';

const getToolName = (part: any) =>
  part.type === 'dynamic-tool'
    ? part.toolName
    : String(part.type).replace(/^tool-/, '');

const MessageBubble = ({ message }: { message: any }) => {
  const text = message.parts
    ?.filter((part: UIMessagePart<any, UITools>) => part.type === 'text')
    .map((part: any) => part.text)
    .join('');
  const toolParts =
    message.parts?.filter((part: UIMessagePart<any, UITools>) =>
      isToolPart(part),
    ) ?? [];

  return (
    <>
      {text ? (
        <div
          className={`max-w-[80%] rounded-lg p-4 ${
            message.role === 'user'
              ? 'bg-ui-bg-interactive text-ui-fg-on-color'
              : 'bg-ui-bg-subtle border border-ui-border-base'
          }`}
        >
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
    </>
  );
};

const AIGeneratedWidget = ({ toolPart }: { toolPart: any }) => {
  const toolName = getToolName(toolPart);

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
