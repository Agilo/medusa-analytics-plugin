import * as React from 'react';
import { Control, useController } from 'react-hook-form';
import { Select, Text } from '@medusajs/ui';
import { useRetrieveModels } from '../hooks/ai-dashboard';
import { AnalyticsChatInput } from '../../api/admin/agilo-analytics/analytics-ai/chat/validators';
import type { ModelOption, Provider, Tier } from '../../utils/ai-models';

const providerLabels: Record<Provider, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
};
const tierLabels: Record<Exclude<Tier, 'dev-cheap'>, string> = {
  balanced: 'Balanced',
  fast: 'Fast',
};
const DEV_GROUP_LABEL = 'Development (cheap)';

const labelForProvider = (provider: string) =>
  providerLabels[provider as Provider] ??
  provider.charAt(0).toUpperCase() + provider.slice(1);

const groupOf = (o: ModelOption) =>
  o.tier === 'dev-cheap' ? DEV_GROUP_LABEL : o.provider;

export const SelectModels: React.FC<{
  control: Control<AnalyticsChatInput>;
}> = ({ control }) => {
  const { data, isPending, isError } = useRetrieveModels();

  const options = React.useMemo(() => data ?? [], [data]);

  const {
    field: { value, onChange },
  } = useController({ control, name: 'optionKey' });

  const selectedOption = React.useMemo(
    () => options.find((o) => o.key === value),
    [options, value],
  );

  // Server returns the default option first
  React.useEffect(() => {
    if (options.length > 0 && !selectedOption) {
      onChange(options[0].key);
    }
  }, [options, selectedOption, onChange]);

  const placeholder =
    isPending && !data
      ? 'Loading models...'
      : isError || options.length === 0
        ? 'No models available'
        : 'Select a model';

  return (
    <Select value={value} onValueChange={onChange} size="small">
      <Select.Trigger className="min-w-40 px-2">
        <Select.Value>{selectedOption?.name ?? placeholder}</Select.Value>
      </Select.Trigger>
      <Select.Content
        className="max-h-64 w-(--radix-select-trigger-width) overflow-y-scroll scrollbar-thin scrollbar-thumb-ui-bg-subtle scrollbar-track-ui-bg-base"
        position="popper"
      >
        {Array.from(new Set(options.map(groupOf))).map((group) => (
          <Select.Group key={group}>
            <Select.Label>
              {group === DEV_GROUP_LABEL ? group : labelForProvider(group)}
            </Select.Label>
            {options
              .filter((o) => groupOf(o) === group)
              .map((o) => (
                <Select.Item key={o.key} value={o.key}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <Text as="span" size="small" weight="plus">
                      {o.name}
                    </Text>
                    <Text as="span" size="small" className="text-ui-fg-muted">
                      {o.tier === 'dev-cheap'
                        ? labelForProvider(o.provider)
                        : tierLabels[o.tier]}
                    </Text>
                  </div>
                </Select.Item>
              ))}
          </Select.Group>
        ))}
      </Select.Content>
    </Select>
  );
};
