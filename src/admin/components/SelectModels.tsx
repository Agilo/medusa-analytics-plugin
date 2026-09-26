// External packages
import * as React from 'react';
import { Control, useController } from 'react-hook-form';
import { Select, Text } from '@medusajs/ui';

// Internal
import { useRetrieveModels } from '../hooks/ai-dashboard';
import { providerLabels, tierLabels } from '../lib/utils/models';
import { AnalyticsChatInput } from '../../api/admin/agilo-analytics/analytics-ai/chat/validators';
import type { Provider } from '../../utils/ai-models';

export const SelectModels = ({
  control,
}: {
  control: Control<AnalyticsChatInput>;
}) => {
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
        {(Object.keys(providerLabels) as Provider[])
          .filter((provider) => options.some((o) => o.provider === provider))
          .map((provider) => (
            <Select.Group key={provider}>
              <Select.Label>{providerLabels[provider]}</Select.Label>
              {options
                .filter((o) => o.provider === provider)
                .map((o) => (
                  <Select.Item key={o.key} value={o.key}>
                    <div className="flex items-center justify-between gap-3 w-full">
                      <Text as="span" size="small" weight="plus">
                        {o.name}
                      </Text>
                      <Text as="span" size="small" className="text-ui-fg-muted">
                        {tierLabels[o.tier]}
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
