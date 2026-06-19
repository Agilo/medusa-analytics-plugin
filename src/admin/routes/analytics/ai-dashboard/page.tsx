import * as React from 'react';
import { defineRouteConfig } from '@medusajs/admin-sdk';
import { AiAssistent } from '@medusajs/icons';
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
    return defaultModel?.id ?? 'gpt-4.1';
  });

  const selectedModel = React.useMemo(
    () => models.find((m) => m.id === modelId),
    [models, modelId],
  );

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
        <Skeleton className="h-6 w-56" />
      </div>
    );
  }

  return (
    <>
      {!hasGatewayKey ? (
        <GatewayForm />
      ) : (
        <Container className="relative divide-y p-0">
          <div className="px-6 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
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

              <div className="flex items-center gap-2">
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

                    {['OpenAI', 'Anthropic', 'Google', 'Mistral', 'Local']
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
            </div>

            <div className="flex mt-4 gap-2 items-center w-full">
              <div className="flex-1 min-w-70">
                <Input
                  placeholder="Ask a question about your store… (e.g., 'Show me abandoned carts')"
                  className="flex-1 min-w-70"
                />
              </div>
              <Button variant="primary">Generate</Button>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="min-h-90">
              {true && (
                <div className="h-90 flex flex-col items-center justify-center text-center gap-2">
                  <AiAssistent className="text-ui-fg-subtle" />
                  <Text size="small" weight="plus">
                    Find everything you need to know about your store data in
                    one place
                  </Text>
                  <Text size="small" className="text-ui-fg-muted max-w-130">
                    Enter a question above or click one of the quick prompts to
                    get started
                  </Text>
                </div>
              )}
              {false ? (
                <div className="flex flex-col gap-3 max-w-205">
                  <Skeleton className="h-6 w-56" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-11/12" />
                  <Skeleton className="h-4 w-4/5" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      )}
    </>
  );
}

export const config = defineRouteConfig({
  label: 'AI dashboard',
  icon: AiAssistent,
});
