import * as React from 'react';
import { defineRouteConfig } from '@medusajs/admin-sdk';
import { AiAssistent } from '@medusajs/icons';
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Skeleton,
  Text,
} from '@medusajs/ui';

const getAvailableModels = () => [
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    provider: 'OpenAI',
    context: '128k',
    recommended: true,
    description: 'General-purpose analytics & reasoning',
  },
  {
    id: 'gpt-4o-mini',
    label: 'GPT-4o mini',
    provider: 'OpenAI',
    context: '128k',
    description: 'Fast, cost-effective summaries',
  },
  {
    id: 'claude-3.5-sonnet',
    label: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    context: '200k',
    recommended: true,
    description: 'Strong writing and analysis',
  },
  {
    id: 'gemini-1.5-pro',
    label: 'Gemini 1.5 Pro',
    provider: 'Google',
    context: '1M',
    description: 'Large-context exploration',
  },
  {
    id: 'mistral-large',
    label: 'Mistral Large',
    provider: 'Mistral',
    context: '128k',
    description: 'Balanced quality and speed',
  },
];

export default function AnalyticsAIPage() {
  const models = React.useMemo(() => getAvailableModels(), []);

  const [hasGatewayKey, setHasGatewayKey] = React.useState(false);

  const [modelId, setModelId] = React.useState<string>(() => {
    const defaultModel = models.find((m) => m.recommended) ?? models[0];
    return defaultModel?.id ?? 'gpt-4.1';
  });

  const selectedModel = React.useMemo(
    () => models.find((m) => m.id === modelId),
    [models, modelId],
  );

  return (
    <>
      {!hasGatewayKey ? (
        <div className="flex items-center justify-center relative p-6 h-[calc(100vh-60px)]">
          <div className="w-full max-w-lg rounded-lg border border-ui-border-base bg-ui-bg-base p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <AiAssistent className="text-ui-fg-subtle mt-0.5" />
              <div className="flex-1">
                <Heading level="h2">Add Vercel AI Gateway API key</Heading>
                <Text size="small" className="text-ui-fg-muted mt-1">
                  Add your Vercel AI Gateway API key once, then you can select
                  any model from the picker.
                </Text>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-y-2">
              <Label htmlFor="vercel_gateway_key" className="text-ui-fg-subtle">
                Vercel AI Gateway API key
              </Label>
              <Input type="password" placeholder="Paste your key…" />
            </div>

            <div className="mt-6 flex items-center justify-end">
              <Button variant="primary" onClick={() => setHasGatewayKey(true)}>
                Continue
              </Button>
            </div>
          </div>
        </div>
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
                      {selectedModel?.label ?? 'Select a model'}
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
